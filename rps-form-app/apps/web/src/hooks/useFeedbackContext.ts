/**
 * useFeedbackContext.ts
 * Hook untuk mengumpulkan konteks halaman secara cerdas.
 *
 * Filosofi Senior Dev:
 * - Kirim SEDIKIT tapi RELEVAN, bukan banyak tapi noise.
 * - Error adalah signal. console.log("rendering") adalah noise.
 * - AI tidak butuh tahu setiap GET 200 yang sukses —
 *   tapi WAJIB tahu setiap POST 500 dan stack trace error.
 *
 * Yang dikirim saat submit:
 *   - Semua network ERRORS dari sesi ini (4xx/5xx/network failure)
 *   - 3 network call sukses terakhir (baseline konteks)
 *   - Semua console.error & console.warn dari sesi ini
 *   - Zustand store snapshot (state form saat ini)
 *   - Route history (halaman mana saja yang dikunjungi)
 *   - Browser/device fingerprint (layar, bahasa, timezone)
 *   - Memory usage & performance timing (deteksi memory leak)
 *   - Waktu di halaman saat ini (berapa lama sebelum bug terjadi)
 */

import { useLocation } from 'react-router-dom';

// ─── Type Definitions ───────────────────────────────────────────────────────

export interface NetworkCallRecord {
  url: string;
  method: string;
  status: number | null;
  duration: number | null;
  timestamp: string;
  isError: boolean;
}

export interface ConsoleLogRecord {
  level: 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface RouteHistoryRecord {
  path: string;
  timestamp: string;
}

export interface PageContext {
  // Lokasi
  url: string;
  pathname: string;
  pageTitle: string;
  sessionId: string;
  timestamp: string;
  timeOnPageMs: number;

  // Network — hanya yang penting
  networkErrors: NetworkCallRecord[];          // semua error sesi ini
  networkRecentSuccess: NetworkCallRecord[];   // 3 sukses terakhir sebagai baseline

  // Console — hanya error & warn (bukan log/info)
  consoleCritical: ConsoleLogRecord[];         // semua error+warn sesi ini

  // Navigasi
  routeHistory: RouteHistoryRecord[];          // jejak halaman yang dikunjungi

  // Browser/Device
  browser: {
    userAgent: string;
    language: string;
    timezone: string;
    screen: string;
    viewport: string;
    online: boolean;
  };

  // Performance
  performance: {
    loadTimeMs: number | null;
    domReadyMs: number | null;
    memoryMB: number | null;       // deteksi potential memory leak
    memoryLimitMB: number | null;
  };
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const KEY_SESSION_ID    = 'dk_sess_id';
const KEY_NET_ERRORS    = 'dk_net_errors';
const KEY_NET_SUCCESS   = 'dk_net_success';   // hanya simpan 10 terakhir
const KEY_CONSOLE_CRIT  = 'dk_console_crit';
const KEY_ROUTE_HISTORY = 'dk_route_history';

// ─── SessionStorage Helpers ──────────────────────────────────────────────────

function ssGet<T>(key: string): T[] {
  try { return JSON.parse(sessionStorage.getItem(key) ?? '[]'); } catch { return []; }
}

function ssSet<T>(key: string, data: T[], maxEntries = 200) {
  try {
    const trimmed = data.length > maxEntries ? data.slice(-maxEntries) : data;
    sessionStorage.setItem(key, JSON.stringify(trimmed));
  } catch { /* sessionStorage penuh — abaikan */ }
}

// ─── Session ID ──────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  let id = sessionStorage.getItem(KEY_SESSION_ID);
  if (!id) {
    id = `dk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem(KEY_SESSION_ID, id);
  }
  return id;
}

// ─── Interceptors (dipasang SEKALI di main.tsx sebelum React render) ─────────

let interceptorsInstalled = false;

export function installInterceptors(): void {
  if (interceptorsInstalled || typeof window === 'undefined') return;
  interceptorsInstalled = true;
  getOrCreateSessionId();

  // ── Fetch Interceptor ──────────────────────────────────────────────────────
  const origFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const start  = Date.now();
    const url    = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = (init?.method ?? 'GET').toUpperCase();

    try {
      const response = await origFetch(input, init);
      const record: NetworkCallRecord = {
        url, method,
        status:    response.status,
        duration:  Date.now() - start,
        timestamp: new Date().toISOString(),
        isError:   !response.ok,
      };

      if (!response.ok) {
        // Error → simpan semua (tidak ada batas ketat, maks 200)
        ssSet(KEY_NET_ERRORS, [...ssGet<NetworkCallRecord>(KEY_NET_ERRORS), record]);
      } else {
        // Sukses → hanya simpan 10 terakhir (baseline konteks)
        ssSet(KEY_NET_SUCCESS, [...ssGet<NetworkCallRecord>(KEY_NET_SUCCESS), record], 10);
      }

      return response;
    } catch (err) {
      const record: NetworkCallRecord = {
        url, method, status: null,
        duration:  Date.now() - start,
        timestamp: new Date().toISOString(),
        isError:   true,
      };
      ssSet(KEY_NET_ERRORS, [...ssGet<NetworkCallRecord>(KEY_NET_ERRORS), record]);
      throw err;
    }
  };

  // ── Console Interceptor — hanya warn & error ──────────────────────────────
  (['warn', 'error'] as const).forEach((level) => {
    const orig = (console[level] as (...args: unknown[]) => void).bind(console);
    (console[level] as (...args: unknown[]) => void) = (...args: unknown[]) => {
      const record: ConsoleLogRecord = {
        level,
        message:   args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        timestamp: new Date().toISOString(),
      };
      ssSet(KEY_CONSOLE_CRIT, [...ssGet<ConsoleLogRecord>(KEY_CONSOLE_CRIT), record]);
      orig(...args);
    };
  });
}

// ─── Route Tracker ───────────────────────────────────────────────────────────
// Dipanggil dari hook — catat setiap navigasi halaman

let lastPath = '';
let pageEnteredAt = Date.now();

function trackRoute(pathname: string) {
  if (pathname === lastPath) return;
  lastPath       = pathname;
  pageEnteredAt  = Date.now();

  const history = ssGet<RouteHistoryRecord>(KEY_ROUTE_HISTORY);
  history.push({ path: pathname, timestamp: new Date().toISOString() });
  ssSet(KEY_ROUTE_HISTORY, history, 30); // simpan 30 halaman terakhir
}

// ─── Hook Utama ───────────────────────────────────────────────────────────────

export function useFeedbackContext(): () => PageContext {
  const location = useLocation();

  // Catat navigasi setiap kali pathname berubah
  trackRoute(location.pathname);

  return (): PageContext => {
    const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined;
    const mem = (performance as any).memory;

    return {
      url:          window.location.href,
      pathname:     location.pathname,
      pageTitle:    document.title,
      sessionId:    getOrCreateSessionId(),
      timestamp:    new Date().toISOString(),
      timeOnPageMs: Date.now() - pageEnteredAt,

      // Network — hanya yang penting
      networkErrors:        ssGet<NetworkCallRecord>(KEY_NET_ERRORS),
      networkRecentSuccess: ssGet<NetworkCallRecord>(KEY_NET_SUCCESS).slice(-3),

      // Console — hanya warn & error
      consoleCritical: ssGet<ConsoleLogRecord>(KEY_CONSOLE_CRIT),

      // Route history
      routeHistory: ssGet<RouteHistoryRecord>(KEY_ROUTE_HISTORY),

      // Browser fingerprint
      browser: {
        userAgent: navigator.userAgent,
        language:  navigator.language,
        timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen:    `${screen.width}x${screen.height}`,
        viewport:  `${window.innerWidth}x${window.innerHeight}`,
        online:    navigator.onLine,
      },

      // Performance & Memory
      performance: {
        loadTimeMs:     nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
        domReadyMs:     nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
        memoryMB:       mem ? Math.round(mem.usedJSHeapSize / 1048576) : null,
        memoryLimitMB:  mem ? Math.round(mem.jsHeapSizeLimit / 1048576) : null,
      },
    };
  };
}
