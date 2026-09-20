let hide: ReturnType<typeof setTimeout> | undefined;

/** `what` names the copied thing in the toast: "URL copied to clipboard." */
export async function copyText(text: string, what: string): Promise<boolean> {
  let success = false;
  try {
    await navigator.clipboard.writeText(text);
    success = true;
  } catch {
    // Clipboard access can be denied by the browser or the operating system.
  }
  const toast = document.querySelector<HTMLElement>('[data-toast]');
  if (toast) {
    clearTimeout(hide);
    toast.textContent = success
      ? `${what} copied to clipboard.`
      : 'Copy failed. Select the text and copy it manually.';
    toast.style.opacity = '1';
    hide = setTimeout(() => {
      toast.style.opacity = '0';
      toast.textContent = '';
    }, 5000);
  }
  return success;
}
