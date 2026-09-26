import { Router } from 'express';
import { agentAuth } from '../middleware/agentAuth';
import { aiController } from '../controllers/ai.controller';

const router = Router();

// Apply Agent Authentication to all AI DX endpoints
router.use(agentAuth);

// Context Introspection
router.get('/context', aiController.getContext.bind(aiController));
router.get('/context/rps/:id', aiController.getRpsContext.bind(aiController));

// Action Catalog & RPC Execution Hub
router.get('/actions/catalog', aiController.getActionCatalog.bind(aiController));
router.post('/actions/execute', aiController.executeAction.bind(aiController));

// Continuous Learning: Rules & Memory
router.get('/learning/rules', aiController.getLearnedRules.bind(aiController));
router.post('/learning/rules', aiController.registerLearnedRule.bind(aiController));

// Context Compression & Issue-to-Fix Learning Hub
router.get('/learning/summaries', aiController.getIssueFixSummaries.bind(aiController));
router.post('/learning/issue-fix', aiController.recordIssueFix.bind(aiController));

// Feedback Loop
router.post('/learning/feedback', aiController.submitFeedback.bind(aiController));

// Telemetry & Logs Inspection
router.get('/history', aiController.getInteractions.bind(aiController));
router.get('/errors', aiController.getErrors.bind(aiController));

export default router;
