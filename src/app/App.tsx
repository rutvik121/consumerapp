import { BrowserRouter, HashRouter } from 'react-router-dom';
import { AppRouter } from './router';

/**
 * Application root.
 *
 * Deliberately thin: providers go here as they are genuinely needed, not in
 * anticipation. There is no global data provider because screens fetch through
 * repositories, and no theme provider because the design system is CSS tokens.
 *
 * ROUTER: history routing normally. Building with VITE_HASH_ROUTER=true
 * switches to hash routing, which is what a single-file static build needs —
 * there is no server to rewrite unknown paths back to index.html, so a
 * refresh or a deep link would otherwise 404. Same app either way.
 */
const Router = import.meta.env.VITE_HASH_ROUTER === 'true' ? HashRouter : BrowserRouter;

export function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}
