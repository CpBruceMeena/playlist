/**
 * Triggers a browser file download by creating a temporary anchor element.
 * The server must serve the URL with Content-Disposition: attachment headers.
 */
export function triggerBrowserDownload(downloadUrl: string, title?: string): void {
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  if (title) {
    anchor.download = title;
  }
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
