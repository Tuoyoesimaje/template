// Entrypoint for Vite. This file is a thin wrapper around the original app logic
// moved from root-level app.js. It also registers HMR dispose handlers so timers
// and listeners are cleaned up during HMR reloads.

// Import global styles (optional - keeps behaviour same as before)
import './styles/style.css';

// Expose a simple cleanup registry so modules can register disposers.
const _cleanupFns = [];
export function registerCleanup(fn) { _cleanupFns.push(fn); }

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    for (const fn of _cleanupFns) { try { fn(); } catch (e) { /* ignore */ } }
  });
}

// Provide safe global wrappers for inline handlers so they don't throw before
// the main app module has a chance to register real implementations.
window._queuedQuizCalls = window._queuedQuizCalls || [];
if (!window.handleQuizAnswer) {
  window.handleQuizAnswer = function(selected) {
    // queue the call until the real handler is available
    window._queuedQuizCalls.push(selected);
  };
}
if (!window.handleKeyDown) {
  window._queuedKeyEvents = window._queuedKeyEvents || [];
  window.handleKeyDown = function(e) {
    window._queuedKeyEvents.push(e);
    // no-op until real handler is registered
  };
}

// Load the main app logic (app.js will register the real handlers on window)
import './app.js';

// If any queued quiz calls exist and the real handler is now available, replay them
setTimeout(() => {
  try {
    if (window._queuedQuizCalls && window._queuedQuizCalls.length && window.handleQuizAnswer && window.handleQuizAnswer !== undefined) {
      const q = window._queuedQuizCalls.slice(); window._queuedQuizCalls = [];
      for (const s of q) {
        try { window.handleQuizAnswer(s); } catch (e) { /* ignore */ }
      }
    }
    if (window._queuedKeyEvents && window._queuedKeyEvents.length && window.handleKeyDown && window.handleKeyDown !== undefined) {
      const qk = window._queuedKeyEvents.slice(); window._queuedKeyEvents = [];
      for (const ev of qk) {
        try { window.handleKeyDown(ev); } catch (e) { /* ignore */ }
      }
    }
  } catch (e) { /* ignore */ }
}, 50);
