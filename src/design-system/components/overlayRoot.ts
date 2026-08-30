/**
 * Overlays (bottom sheets, dialogs) portal into a node INSIDE the device
 * frame, not into <body>. That keeps them visually contained within the phone
 * on desktop, which is what makes the prototype read as a mobile app rather
 * than a website with modals.
 *
 * The node is rendered by AppShell. See @/navigation/AppShell.
 */
export const OVERLAY_ROOT_ID = 'app-overlay-root';

export function getOverlayRoot(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.getElementById(OVERLAY_ROOT_ID);
}
