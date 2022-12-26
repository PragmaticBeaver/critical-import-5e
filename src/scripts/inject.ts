export function createImportButton(label: string, callback: () => void) {
  const icon = document.createElement("i");
  icon.className = "fas fa-file-download";

  const btn = document.createElement("button");
  btn.className = "critical-import-open-dialog-btn";
  btn.innerText = label;
  btn.onclick = callback;
  btn.appendChild(icon);
  return btn;
}
