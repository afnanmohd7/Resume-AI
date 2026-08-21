import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The app makes zero network requests at runtime, so production builds ship a
 * lock-tight Content-Security-Policy: no remote script, no remote style, and —
 * critically for a tool that holds someone's employment history — no way for
 * injected code to phone home (`connect-src 'none'`, `form-action 'none'`).
 *
 * It is injected at build time only, because Vite's dev server needs an inline
 * refresh preamble and a websocket for HMR.
 */
const PRODUCTION_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  // frame-ancestors is intentionally absent: it is ignored in a <meta> CSP and
  // only warns. It is delivered as a real header via public/_headers instead.
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'resume-ai-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`,
      );
    },
  };
}

// Relative base so the build also works from a file:// path or a project
// sub-path (e.g. GitHub Pages) with no extra configuration.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), cspPlugin()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
