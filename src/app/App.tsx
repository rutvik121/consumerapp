import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';

/**
 * Application root.
 *
 * Deliberately thin: providers go here as they are genuinely needed, not in
 * anticipation. There is no global data provider because screens fetch through
 * repositories, and no theme provider because the design system is CSS tokens.
 */
export function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
