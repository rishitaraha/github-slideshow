export function isAppOpenInIframe(): boolean {
  // Ref: https://stackoverflow.com/a/61596084.
  return window !== window.parent;
}
