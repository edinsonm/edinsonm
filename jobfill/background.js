// Atajo de teclado -> ejecuta el autofill en todos los frames de la pestaña activa.
chrome.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== 'autofill') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: () => window.__jobfillRun && window.__jobfillRun(),
  }).catch(() => {});
});
