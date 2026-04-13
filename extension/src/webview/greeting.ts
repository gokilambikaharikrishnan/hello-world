/**
 * Builds the greeting screen HTML.
 * This is set directly as panel.webview.html — fully self-contained.
 */
export function buildGreetingHTML(username: string, timestamp: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BMS DocGen</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      background: #0d1117;
      color: #e6edf3;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .brand {
      font-size: 0.8rem;
      color: #58a6ff;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      animation: fadeIn 400ms ease both;
    }

    .greeting {
      font-size: 2.6rem;
      font-weight: 700;
      color: #e6edf3;
      margin-top: 32px;
      animation: fadeIn 400ms ease both;
    }

    .subtitle {
      font-size: 1rem;
      color: #58a6ff;
      margin-top: 10px;
      animation: fadeIn 400ms 700ms ease both;
    }

    .timestamp {
      font-size: 0.8rem;
      color: #8b949e;
      margin-top: 6px;
      animation: fadeIn 400ms 1100ms ease both;
    }

    .divider {
      width: 260px;
      height: 1px;
      background: #30363d;
      margin: 36px auto;
      animation: fadeIn 400ms 1400ms ease both;
    }

    .cards {
      display: flex;
      gap: 16px;
      justify-content: center;
      animation: slideUp 400ms 1700ms ease both;
    }

    .card {
      background: #161b22;
      border-radius: 12px;
      padding: 28px 20px;
      width: 150px;
      text-align: center;
      cursor: pointer;
      transition: transform 200ms ease, box-shadow 200ms ease;
    }

    .card:hover {
      transform: translateY(-5px);
    }

    .card-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 12px;
    }

    .card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: #e6edf3;
    }

    .card-subtitle {
      font-size: 0.78rem;
      color: #8b949e;
      margin-top: 4px;
    }

    .card-full {
      border: 1px solid #238636;
    }
    .card-full:hover {
      box-shadow: 0 0 24px rgba(35, 134, 54, 0.35);
    }

    .card-changes {
      border: 1px solid #1f6feb;
    }
    .card-changes:hover {
      box-shadow: 0 0 24px rgba(31, 111, 235, 0.35);
    }

    .card-close {
      border: 1px solid #30363d;
    }
    .card-close .card-icon {
      color: #6e7681;
    }
    .card-close .card-title {
      color: #8b949e;
    }
    .card-close .card-subtitle {
      color: #484f58;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="brand">⚡ BMS DocGen</div>

  <div class="greeting">Hey ${escapeHtml(username)} 👋</div>

  <div class="subtitle">BMS Doc Generator is ready</div>
  <div class="timestamp">Build detected · ${escapeHtml(timestamp)}</div>

  <div class="divider"></div>

  <div class="cards">
    <div class="card card-full" onclick="send('full')">
      <span class="card-icon">📚</span>
      <div class="card-title">Full Stack</div>
      <div class="card-subtitle">All modules</div>
    </div>

    <div class="card card-changes" onclick="send('changes')">
      <span class="card-icon">🔍</span>
      <div class="card-title">My Changes</div>
      <div class="card-subtitle">Modified files only</div>
    </div>

    <div class="card card-close" onclick="send('close')">
      <span class="card-icon">✕</span>
      <div class="card-title">Not Now</div>
      <div class="card-subtitle">Close panel</div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function send(value) {
      vscode.postMessage({ command: 'mode', value });
    }
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
