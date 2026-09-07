(() => {
  const buttonId = 'expense-tracker-indmoney-capture';
  if (document.getElementById(buttonId)) return;

  const button = document.createElement('button');
  button.id = buttonId;
  button.textContent = 'Capture portfolio';
  Object.assign(button.style, {
    position: 'fixed',
    right: '24px',
    bottom: '24px',
    zIndex: '2147483647',
    padding: '12px 16px',
    border: '0',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    font: '600 14px system-ui, sans-serif',
    boxShadow: '0 4px 18px rgba(0,0,0,.25)',
    cursor: 'pointer',
  });

  button.addEventListener('click', () => {
    button.disabled = true;
    button.textContent = 'Capturing...';

    setTimeout(() => capturePage(), 1500);
  });

  function capturePage() {
    button.remove();

    const clean = (value) => (value || '').replace(/\s+/g, ' ').trim();
    const visibleText = clean(document.body?.innerText).slice(0, 150000);
    const tables = Array.from(document.querySelectorAll('table')).map((table) => ({
      headers: Array.from(table.querySelectorAll('thead th')).map((cell) => clean(cell.textContent)),
      rows: Array.from(table.querySelectorAll('tbody tr')).map((row) => Array.from(row.querySelectorAll('th,td')).map((cell) => clean(cell.textContent))),
    })).filter((table) => table.rows.length > 0);
    const rows = Array.from(document.querySelectorAll('[role="row"], tr, [data-testid*="holding"], [data-testid*="portfolio"], [class*="holding"], [class*="portfolio"]'))
      .map((element) => clean(element.textContent))
      .filter(Boolean)
      .slice(0, 1000);

    const payload = {
      url: window.location.href,
      title: document.title,
      capturedAt: new Date().toISOString(),
      tables,
      rows,
      visibleText,
    };

    const json = JSON.stringify(payload, null, 2);
    const downloadUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `indmoney-raw-${Date.now()}.json`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);

    window.opener?.postMessage({ source: 'expense-tracker-indmoney', type: 'INDMONEY_SNAPSHOT', payload }, '*');
    document.body.appendChild(button);
    button.textContent = 'Saved JSON + sent';
    setTimeout(() => { button.disabled = false; button.textContent = 'Capture portfolio'; }, 2500);
  }

  document.body.appendChild(button);
})();
