const out = document.getElementById('out');
document.getElementById('opts').onclick = () => chrome.runtime.openOptionsPage();
document.getElementById('fill').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const res = await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: () => window.__jobfillRun && window.__jobfillRun(),
    });
    const reports = res.map((r) => r.result).filter(Boolean);
    const err = reports.find((r) => r.error);
    if (err && reports.length === 1) { out.textContent = err.error; return; }
    const filled = reports.reduce((n, r) => n + (r.filled || 0), 0);
    const skipped = [...new Set(reports.flatMap((r) => r.skipped || []))];
    out.textContent = `✔ ${filled} campos rellenados.` +
      (skipped.length ? `\n\nSin rellenar (revisa a mano):\n- ${skipped.slice(0, 15).join('\n- ')}` : '');
  } catch (e) {
    out.textContent = 'No se puede rellenar en esta página: ' + e.message;
  }
};
