# Forensic Remediation Plan: Milestone 2 Anti-Hallucination & Telemetry Integrity

**Target**: Remediation of Integrity Violation in Milestone 2  
**Author**: Explorer M2 Remediation (`explorer_m2_rem_1`)  
**Assignee**: Worker M2  
**Date**: 2026-09-24  

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 The Primary Forensic Violation
In `rps-form-app/apps/api/src/services/ai.service.ts:501-512`, the 3-Layer Anti-Hallucination Diagnostic Suite (`runDoctorDiagnostics()`) implemented Layer 2 (API Response Contracts) as a static facade:
```typescript
// LAYER 2: API Contract Verification
const layer2 = {
  layer: 'Layer 2: API Response Contracts',
  status: 'PASS',
  verifiedRoutes: [
    { path: '/api/rps', method: 'GET', contract: 'Array<RpsDocument>' },
    { path: '/api/rps', method: 'POST', contract: 'RpsDocument' },
    { path: '/api/v1/ai/context', method: 'GET', contract: 'AiSystemContext' },
    { path: '/api/v1/ai/actions/catalog', method: 'GET', contract: 'Array<ActionDefinition>' },
    { path: '/api/v1/ai/learning/rules', method: 'GET', contract: 'Array<AiLearnedRule>' },
  ],
};
```
**Violation Assessment**:
1. `status: 'PASS'` is hardcoded as a static string literal.
2. No Express router stack inspection or runtime contract probing is performed.
3. If any or all of the core endpoints were unmounted, corrupted, or deleted, `layer2.status` would continue to report `'PASS'`.
4. This constitutes **Prohibited Pattern #2 (Facade Implementation: "Correct-looking interfaces with no genuine logic (e.g. return <constant>)")**.

### 1.2 Secondary Audit Improvement
In `rps-form-app/apps/api/src/services/logger.service.ts:130`, `logError()` always generates an isolated `randomUUID()` instead of honoring the incoming `traceId` from the originating action. Consequently, when an action fails, `storage/logs/ai-agent.jsonl` and `storage/logs/ai-errors.jsonl` record disjoint trace identifiers, breaking end-to-end telemetry correlation.

---

## 2. Concrete Remediation Architecture

```
                       ┌──────────────────────────────────────────────────┐
                       │               Express Server (app)               │
                       │  app.use('/api/v1/ai', aiRoutes)                 │
                       │  app.use('/api', apiRoutes)                      │
                       └────────────────────────┬─────────────────────────┘
                                                │ aiService.setApp(app)
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AiService.runDoctorDiagnostics()                                │
│                                                                                        │
│  ┌─────────────────────────────────┐   ┌────────────────────────────────────────────┐  │
│  │ 1. Dynamic Router Stack Walker  │   │ 2. Active Contract Shape Probes            │  │
│  │ Recursively inspects:           │   │ Probes in-memory service contracts:        │  │
│  │ • app._router.stack             │   │ • rpsService.getAll() -> Array?            │  │
│  │ • layer.regexp mount prefixes   │   │ • rpsService.create -> Function?           │  │
│  │ • layer.route.path & methods    │   │ • aiService.getSystemContext() -> Valid?   │  │
│  │ • layer.route.stack (handlers)  │   │ • aiService.getActionCatalog() -> Array>=5 │  │
│  │ Result: DiscoveredRoute[]       │   │ • learningService.getRules() -> Array?     │  │
│  └────────────────┬────────────────┘   └─────────────────────┬──────────────────────┘  │
│                   │                                          │                         │
│                   └────────────────────┬─────────────────────┘                         │
│                                        ▼                                               │
│             ┌─────────────────────────────────────────────────────────┐                │
│             │ Match active routes with EXPECTED_CONTRACTS:            │                │
│             │ • Route mounted? (GET /api/rps, etc.)                   │                │
│             │ • Handler attached? (handlersCount >= 1)                │                │
│             │ • Contract shape valid? (probe() === true)              │                │
│             └──────────────────────────┬──────────────────────────────┘                │
│                                        ▼                                               │
│                    allVerified = verifiedRoutes.every(r => r.verified)                 │
│                          status = allVerified ? 'PASS' : 'FAIL'                        │
│             overall = (L1==='PASS' && L2==='PASS' && L3==='PASS') ? 'HEALTHY' : 'DEGRADED' │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Implementation Blueprint for Worker M2

### File 1: `rps-form-app/apps/api/src/services/logger.service.ts`

#### Objectives:
1. Update `ErrorLogInput` interface to accept optional `traceId?: string`.
2. Update `logError()` to use `input.traceId || randomUUID()`.

#### Code Changes:
```typescript
// --- Line 22: Update ErrorLogInput interface ---
export interface ErrorLogInput {
  traceId?: string; // Accept caller traceId for correlation
  interactionId?: string;
  agentId?: string;
  errorType: string;
  severity?: 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  stackTrace?: string;
  contextData?: any;
  reproductionStep?: string;
  attemptedFix?: string;
}

// --- Line 126: Update logError method ---
  async logError(input: ErrorLogInput) {
    this.ensureLogDir();

    const timestamp = new Date().toISOString();
    const traceId = input.traceId || randomUUID(); // Preserve correlation if supplied

    const jsonEntry = {
      timestamp,
      traceId,
      error: input.message,
      message: input.message,
      errorType: input.errorType,
      severity: input.severity || 'ERROR',
      agentId: input.agentId || null,
      interactionId: input.interactionId || null,
      stackTrace: input.stackTrace || null,
      contextData: input.contextData || null,
      reproductionStep: input.reproductionStep || null,
      attemptedFix: input.attemptedFix || null,
    };
    ...
```

---

### File 2: `rps-form-app/apps/api/src/services/ai.service.ts`

#### Objectives:
1. Add `private appInstance: any = null` and public `setApp(app: any)` / `getApp()` methods to `AiService`.
2. Add recursive `extractExpressRoutes(stack: any[], basePath = '')` helper to traverse nested Express routers.
3. Replace hardcoded `layer2` in `runDoctorDiagnostics()` with active runtime introspection and contract shape probing.
4. Pass `traceId: effectiveTraceId` to `loggerService.logError()` in `executeAction()`.

#### Code Changes:

##### Change 2A: Add App Holder & Router Extraction
In `AiService` class (around line 18):
```typescript
export interface DiscoveredRoute {
  path: string;
  method: string;
  handlersCount: number;
}

export interface ApiContractSpec {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  contract: string;
  probe?: () => Promise<boolean> | boolean;
}

export class AiService {
  private appInstance: any = null;

  public setApp(app: any): void {
    this.appInstance = app;
  }

  public getApp(): any {
    return this.appInstance;
  }

  /**
   * Dynamically traverses Express application and router stacks to discover all mounted endpoints.
   */
  private extractExpressRoutes(stack: any[], basePath = ''): DiscoveredRoute[] {
    const results: DiscoveredRoute[] = [];
    if (!Array.isArray(stack)) return results;

    for (const layer of stack) {
      if (layer.route) {
        // Direct route handler layer
        const routePath = (basePath + (layer.route.path === '/' ? '' : layer.route.path))
          .replace(/\/+/g, '/')
          .replace(/\/$/, '') || '/';
        const methods = Object.keys(layer.route.methods || {});
        const handlersCount = Array.isArray(layer.route.stack) ? layer.route.stack.length : 0;
        for (const m of methods) {
          results.push({
            path: routePath,
            method: m.toUpperCase(),
            handlersCount,
          });
        }
      } else if (layer.name === 'router' && layer.handle && Array.isArray(layer.handle.stack)) {
        // Nested router middleware layer (e.g. app.use('/api', apiRoutes))
        let subPrefix = '';
        if (layer.regexp) {
          const src = layer.regexp.source;
          // Decode Express regex prefix e.g. ^\/api\/v1\/ai\/?(?=\/|$) or ^\/rps\/?(?=\/|$)
          const match = src.match(/^\^\\\/([a-zA-Z0-9_\-\\\/]+?)\\\/\?\(\?=\\\/\|\$\)/);
          if (match) {
            subPrefix = '/' + match[1].replace(/\\\//g, '/');
          }
        }
        results.push(...this.extractExpressRoutes(layer.handle.stack, basePath + subPrefix));
      }
    }
    return results;
  }
```

##### Change 2B: Update TraceId Correlation in `executeAction`
In `executeAction()`:
At line 285:
```typescript
      await loggerService.logError({
        traceId: effectiveTraceId, // Propagate traceId
        agentId: agentContext?.id,
        errorType: 'VALIDATION_ERROR',
        severity: 'WARNING',
        message: err.message,
        contextData: { action: actionName, parameters },
      });
```
At line 445:
```typescript
      // Log error (dual pipe: DB + JSONL)
      await loggerService.logError({
        traceId: effectiveTraceId, // Propagate traceId
        agentId: agentContext?.id,
        errorType: err.code || 'ACTION_EXECUTION_ERROR',
        severity: (err.statusCode && err.statusCode >= 500) ? 'ERROR' : 'WARNING',
        message: errorMessage,
        stackTrace: err.stack,
        contextData: { action: actionName, parameters },
      });
```

##### Change 2C: Replace Facade in `runDoctorDiagnostics()`
Replace lines 500-512 of `ai.service.ts` with:
```typescript
    // LAYER 2: API Contract Verification (Active Express Introspection & Runtime Probing)
    let appToInspect = this.appInstance;
    if (!appToInspect) {
      try {
        // Fallback lazy resolution if called without explicit server setApp binding
        const express = require('express');
        const apiRoutes = require('../routes').default;
        const aiRoutes = require('../routes/ai.routes').default;
        const fallbackApp = express();
        fallbackApp.use('/api/v1/ai', aiRoutes);
        fallbackApp.use('/api', apiRoutes);
        appToInspect = fallbackApp;
      } catch {
        appToInspect = null;
      }
    }

    const routerStack = appToInspect?._router?.stack || appToInspect?.stack || [];
    const discoveredRoutes = this.extractExpressRoutes(routerStack);

    const EXPECTED_CONTRACTS: ApiContractSpec[] = [
      {
        path: '/api/rps',
        method: 'GET',
        contract: 'Array<RpsDocument>',
        probe: async () => {
          const list = await rpsService.getAll();
          return Array.isArray(list);
        },
      },
      {
        path: '/api/rps',
        method: 'POST',
        contract: 'RpsDocument',
        probe: () => typeof rpsService.create === 'function',
      },
      {
        path: '/api/v1/ai/context',
        method: 'GET',
        contract: 'AiSystemContext',
        probe: async () => {
          const ctx = await this.getSystemContext();
          return !!(ctx && ctx.system && ctx.system.application === 'Dunia_Kampus');
        },
      },
      {
        path: '/api/v1/ai/actions/catalog',
        method: 'GET',
        contract: 'Array<ActionDefinition>',
        probe: () => {
          const catalog = this.getActionCatalog();
          return Array.isArray(catalog) && catalog.length >= 5;
        },
      },
      {
        path: '/api/v1/ai/learning/rules',
        method: 'GET',
        contract: 'Array<AiLearnedRule>',
        probe: async () => {
          const rules = await learningService.getRules();
          return Array.isArray(rules);
        },
      },
    ];

    const verifiedRoutes: Array<{
      path: string;
      method: string;
      contract: string;
      verified: boolean;
      routeExists: boolean;
      contractValid: boolean;
      handlersCount: number;
      error?: string | null;
    }> = [];

    for (const exp of EXPECTED_CONTRACTS) {
      const match = discoveredRoutes.find(
        (r) => r.path === exp.path && r.method === exp.method && r.handlersCount > 0
      );
      const routeExists = !!match;
      let contractValid = false;

      if (routeExists && exp.probe) {
        try {
          contractValid = Boolean(await exp.probe());
        } catch {
          contractValid = false;
        }
      } else if (routeExists) {
        contractValid = true;
      }

      const verified = routeExists && contractValid;
      let error: string | null = null;
      if (!routeExists) {
        error = `Route ${exp.method} ${exp.path} is not registered in the active Express router stack`;
      } else if (!contractValid) {
        error = `Contract probe failed for ${exp.method} ${exp.path} (expected ${exp.contract})`;
      }

      verifiedRoutes.push({
        path: exp.path,
        method: exp.method,
        contract: exp.contract,
        verified,
        routeExists,
        contractValid,
        handlersCount: match ? match.handlersCount : 0,
        error,
      });
    }

    const allRoutesVerified = verifiedRoutes.length > 0 && verifiedRoutes.every((r) => r.verified);
    const layer2Status = allRoutesVerified ? 'PASS' : 'FAIL';

    const layer2 = {
      layer: 'Layer 2: API Response Contracts',
      status: layer2Status,
      totalDiscoveredEndpoints: discoveredRoutes.length,
      routerStackInspected: routerStack.length > 0,
      verifiedRoutes,
      missingRoutes: verifiedRoutes.filter((r) => !r.verified).map((r) => `${r.method} ${r.path}`),
    };
```

---

### File 3: `rps-form-app/apps/api/src/server.ts`

#### Objectives:
1. Import `aiService` from `./services/ai.service`.
2. Register `app` instance with `aiService.setApp(app)` immediately after mounting routes.

#### Code Changes:
```typescript
// --- Add import at top ---
import { aiService } from './services/ai.service';

// --- Line 18: After mounting routes ---
// 2. Mount API Routes
app.use('/api/v1/ai', aiRoutes);
app.use('/api', apiRoutes);

// Register active Express app in AiService for dynamic router introspection
aiService.setApp(app);
```

---

### File 4: `rps-form-app/apps/api/src/controllers/ai.controller.ts`

#### Objectives:
Ensure that whenever `executeAction` receives a request, `aiService` has `req.app` available as a fallback.

#### Code Changes:
```typescript
  async executeAction(req: AgentRequest, res: Response, next: NextFunction) {
    try {
      // Lazy attach app if not already set
      if (!aiService.getApp() && req.app) {
        aiService.setApp(req.app);
      }

      const { action, parameters } = req.body;
      ...
```

---

## 4. Invalidation & Adversarial Failure Simulation

To prove that the implementation is genuine and NOT a facade, the implementation MUST satisfy two conditions:

### Test Case 1: Healthy Scenario
When all 5 expected routes are registered and backing contracts are valid:
- `layer2.status` MUST evaluate to `'PASS'`.
- `layer2.verifiedRoutes.length` MUST be `>= 5`.
- `doctorResult.status` MUST evaluate to `'HEALTHY'`.

### Test Case 2: Invalidation / Route Failure Scenario
When an unmounted route is injected into `EXPECTED_CONTRACTS` (or an existing route is unmounted):
- The stack walker discovers that the route is absent from `discoveredRoutes`.
- `routeExists` evaluates to `false`, `verified` evaluates to `false`.
- `layer2.status` dynamically evaluates to `'FAIL'`.
- `doctorResult.status` evaluates to `'DEGRADED'`.

### Test Case 3: Telemetry Trace Correlation Scenario
When `system.run_doctor` or an intentional invalid action probe (e.g. `nonexistent.action`) is triggered with `X-Trace-Id`:
- `ai-agent.jsonl` entry contains `"traceId": "<caller-trace-id>"`.
- `ai-errors.jsonl` entry contains the EXACT same `"traceId": "<caller-trace-id>"`.
- Cross-correlation is preserved across both telemetry files.

---

## 5. Verification Commands for Worker M2

After editing the files, execute the following commands in order:

```powershell
# 1. Compile TypeScript
npm --prefix rps-form-app/apps/api run build

# 2. Run Unified E2E Test Suite (All 60 tests must PASS)
node tests/runner.js

# 3. Run Challenger Adversarial Suite (All 50 tests must PASS)
node tests/adversarial/challenger_m2_adversarial.js

# 4. Run Live Database Mutation and Forensic Audit Check
node .agents/auditor_m2_1/test_live_mutation.js

# 5. Run Targeted Layer 2 Invalidation Verification Script
node -e "
const { aiService } = require('./rps-form-app/apps/api/dist/services/ai.service');
aiService.runDoctorDiagnostics().then(d => {
  console.log('Doctor Overall Status:', d.status);
  console.log('Layer 2 Status:', d.layers.layer2_api.status);
  console.log('Total Endpoints Discovered:', d.layers.layer2_api.totalDiscoveredEndpoints);
  console.log('Verified Routes Count:', d.layers.layer2_api.verifiedRoutes.length);
  if (d.layers.layer2_api.status !== 'PASS') process.exit(1);
});
"
```
