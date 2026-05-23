const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps', 'web', 'src', 'index.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newCss = `
      :root {
        --bg-base: #09090b;
        --bg-surface: #18181b;
        --bg-surface-hover: #27272a;
        --bg-panel: rgba(24, 24, 27, 0.6);
        --text-primary: #fafafa;
        --text-secondary: #a1a1aa;
        --text-muted: #71717a;
        --brand-500: #6366f1;
        --brand-600: #4f46e5;
        --brand-glow: rgba(99, 102, 241, 0.4);
        --accent-500: #0ea5e9;
        --success: #10b981;
        --danger: #ef4444;
        --warning: #f59e0b;
        --border-color: rgba(255, 255, 255, 0.08);
        --border-color-hover: rgba(255, 255, 255, 0.15);
        --ring-color: rgba(99, 102, 241, 0.5);
        
        --radius-sm: 6px;
        --radius-md: 12px;
        --radius-lg: 16px;
        --radius-xl: 24px;
        
        --space-1: 0.5rem;
        --space-2: 1rem;
        --space-3: 1.5rem;
        --space-4: 2rem;
        
        --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        --shadow-glow: 0 0 20px var(--brand-glow);
        
        --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
        --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      * { box-sizing: border-box; }
      
      body {
        margin: 0;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--text-primary);
        background-color: var(--bg-base);
        background-image: 
          radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.12), transparent 40%),
          radial-gradient(circle at 85% 30%, rgba(14, 165, 233, 0.1), transparent 40%);
        background-attachment: fixed;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        line-height: 1.5;
      }

      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

      h1, h2, h3, h4, h5, h6 { color: var(--text-primary); margin-top: 0; font-weight: 600; letter-spacing: -0.025em; }
      h1 { font-size: 1.75rem; }
      h2 { font-size: 1.25rem; }
      h3 { font-size: 1.1rem; }
      p { margin-top: 0; margin-bottom: 1rem; color: var(--text-secondary); }
      .hint { color: var(--text-muted); font-size: 0.875rem; }

      .app { 
        display: grid; 
        grid-template-columns: 260px 1fr; 
        min-height: 100vh; 
        transition: var(--transition-normal);
      }
      body.route-auth .app { grid-template-columns: 1fr; }
      body.route-auth .sidebar,
      body.route-auth .topbar,
      body.route-auth #status,
      body.route-auth #route-state,
      body.route-auth #active-org-wrap,
      body.route-auth #dashboard-flow-stepper {
        display: none !important;
      }
      body.route-auth .content-body {
        max-width: 1000px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
      }

      .sidebar {
        background: rgba(9, 9, 11, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-right: 1px solid var(--border-color);
        padding: var(--space-3);
        display: flex;
        flex-direction: column;
        z-index: 10;
      }
      .brand {
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
        margin: 0 0 2rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        letter-spacing: -0.02em;
      }
      .brand::before {
        content: '';
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--brand-500), var(--accent-500));
        box-shadow: 0 0 10px var(--brand-500);
      }
      
      .nav { display: grid; gap: 0.25rem; }
      .nav button {
        text-align: left;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-sm);
        border: 1px solid transparent;
        background: transparent;
        color: var(--text-secondary);
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition-fast);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
      }
      .nav button:hover {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
      }
      .nav button.active-nav {
        background: rgba(99, 102, 241, 0.1);
        color: var(--brand-500);
        border-color: rgba(99, 102, 241, 0.2);
      }

      .content { display: flex; flex-direction: column; min-width: 0; padding: 0; }
      .topbar {
        height: 64px;
        background: rgba(9, 9, 11, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-4);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .topbar strong { font-weight: 600; letter-spacing: -0.01em; }
      .topbar .meta { 
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary); 
        font-size: 0.875rem; 
        background: rgba(255,255,255,0.03);
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        border: 1px solid var(--border-color);
      }
      .topbar .meta span { color: var(--text-primary); font-weight: 500; }
      
      .content-body {
        padding: var(--space-4);
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        animation: fade-in 0.3s ease-out;
      }
      .page-title { font-size: 1.5rem; margin-bottom: 0.25rem; margin-top: 0; }

      .card {
        background: var(--bg-panel);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: var(--space-3);
        box-shadow: var(--shadow-md);
        transition: var(--transition-normal);
        position: relative;
        overflow: hidden;
      }
      .card::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      }
      .card:hover {
        border-color: var(--border-color-hover);
        box-shadow: var(--shadow-lg);
      }

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin-top: 0.75rem;
        margin-bottom: 0.25rem;
      }
      input, select, textarea {
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.875rem;
        transition: var(--transition-fast);
        margin-top: 0;
      }
      input::placeholder, textarea::placeholder { color: var(--text-muted); }
      input:hover, select:hover, textarea:hover { border-color: rgba(255, 255, 255, 0.2); }
      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: var(--brand-500);
        box-shadow: 0 0 0 2px var(--ring-color);
        background: rgba(0, 0, 0, 0.4);
      }
      textarea { min-height: 80px; resize: vertical; }

      button { font-family: inherit; margin: 0; }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition-fast);
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        margin-top: 0.75rem;
      }
      .btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--border-color-hover);
      }
      .btn:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--ring-color);
      }
      .btn:active { transform: scale(0.98); }
      
      .btn-primary {
        background: var(--brand-500);
        border-color: var(--brand-600);
        color: white;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1);
      }
      .btn-primary:hover {
        background: var(--brand-600);
        box-shadow: 0 4px 12px var(--brand-glow);
      }

      .flow-stepper {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0 1.5rem;
        background: rgba(0,0,0,0.2);
        padding: 0.25rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
      }
      .flow-step {
        flex: 1;
        text-align: center;
        padding: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-muted);
        border-radius: var(--radius-sm);
        transition: var(--transition-normal);
      }
      .flow-step.active {
        background: rgba(255,255,255,0.1);
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);
      }
      .flow-step.done { color: var(--success); }

      .status {
        margin-top: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
        border: 1px solid var(--border-color);
        background: rgba(255,255,255,0.03);
        display: none;
      }
      .status:empty { display: none; }
      .status:not(:empty) { display: block; animation: slide-down 0.2s ease-out; }
      .status-error { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: #fca5a5; }
      .status-success { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #6ee7b7; }

      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.125rem 0.625rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-color);
        color: var(--text-secondary);
      }
      .chip strong { color: var(--text-primary); margin-left: 0.25rem; }

      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; margin-top: 1rem; }
      
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
      }
      .kpi-card {
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        transition: var(--transition-fast);
      }
      .kpi-card:hover { border-color: var(--brand-500); transform: translateY(-2px); }
      .kpi-card small { color: var(--text-secondary); font-size: 0.875rem; font-weight: 500; display: block; }
      .kpi-card strong { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin-top: 0.25rem; display: block; }

      .panel-title { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
      .panel-title h2 { margin: 0; }
      .panel-title .btn { margin-top: 0; }

      .quick-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
      ul { padding-left: 1.25rem; }

      .report-list { list-style: none; padding: 0; margin: 1rem 0; display: grid; gap: 0.5rem; }
      .report-row {
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 0.75rem 1rem;
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 1rem;
        align-items: center;
        transition: var(--transition-fast);
        cursor: pointer;
      }
      .report-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); transform: translateX(2px); }
      .report-main { display: grid; gap: 0.25rem; }
      .report-main .open-btn {
        background: none; border: none; padding: 0; margin: 0;
        font-size: 1rem; font-weight: 600; color: var(--text-primary);
        cursor: pointer; text-align: left;
      }
      .report-main .open-btn:hover { color: var(--brand-500); }
      .report-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem; }
      
      .pill {
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid var(--border-color);
        background: rgba(255,255,255,0.05);
      }
      .pill.priority-critical { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); }
      .pill.priority-high { background: rgba(245, 158, 11, 0.1); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.2); }
      .pill.priority-medium { background: rgba(59, 130, 246, 0.1); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.2); }
      .pill.priority-low { background: rgba(107, 114, 128, 0.1); color: #d1d5db; border: 1px solid rgba(107, 114, 128, 0.2); }
      .pill.status-open { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.2); }
      .pill.status-in_progress { background: rgba(99, 102, 241, 0.1); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.2); }

      .auth-layout {
        display: grid;
        grid-template-columns: 1fr 400px;
        gap: 3rem;
        width: 100%;
        max-width: 1000px;
        margin-top: 1rem;
      }
      .auth-hero {
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
      }
      .auth-blob {
        position: absolute;
        right: 0;
        top: -10%;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%);
        filter: blur(40px);
        animation: blob-float 8s infinite alternate;
        z-index: -1;
      }
      @keyframes blob-float {
        0% { transform: translate(0, 0) scale(1); }
        100% { transform: translate(-30px, 20px) scale(1.1); }
      }
      .auth-eyebrow {
        display: inline-flex;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        background: rgba(99, 102, 241, 0.1);
        color: var(--brand-500);
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        width: fit-content;
        border: 1px solid rgba(99, 102, 241, 0.2);
        align-items: center;
      }
      .auth-hero h2 { font-size: 3rem; line-height: 1.1; margin-bottom: 1.5rem; font-weight: 800; letter-spacing: -0.04em; }
      .auth-hero p { font-size: 1.125rem; color: var(--text-secondary); max-width: 480px; line-height: 1.6; }
      .auth-hero-points { margin-top: 2rem; list-style: none; padding: 0; }
      .auth-hero-points li {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        color: var(--text-primary);
        font-size: 1rem;
      }
      .auth-hero-points li::before {
        content: '\\2713'; /* checkmark */
        color: var(--brand-500);
        font-weight: bold;
        background: rgba(99,102,241,0.1);
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
      }
      
      .auth-stack {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .auth-card {
        background: rgba(24, 24, 27, 0.7);
        padding: 2.5rem 2rem;
        border-radius: var(--radius-xl);
      }
      .auth-tabs {
        display: flex;
        background: rgba(0,0,0,0.2);
        padding: 0.25rem;
        border-radius: var(--radius-md);
        margin-bottom: 1.5rem;
      }
      .auth-tab {
        flex: 1;
        padding: 0.5rem;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-weight: 600;
        border-radius: var(--radius-sm);
        margin: 0;
      }
      .auth-tab.active {
        background: var(--bg-surface-hover);
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);
      }
      .auth-panel { display: none; animation: fade-in 0.3s; }
      .auth-panel.active { display: block; }
      .auth-panel h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
      .auth-actions { display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; }

      .input-icon { position: relative; display: block; margin-top: 0.25rem; }
      .input-icon .icon {
        position: absolute;
        left: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        display: flex;
        align-items: center;
      }
      .input-icon .icon svg { width: 1.25rem; height: 1.25rem; }
      .input-icon input { padding-left: 2.5rem; margin-top: 0; }

      .detail-layout {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 1.5rem;
        margin-top: 1rem;
      }
      .detail-canvas {
        background: #000;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        aspect-ratio: 16/9;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        overflow: hidden;
        position: relative;
        box-shadow: inset 0 0 40px rgba(0,0,0,0.8);
        padding: 1rem;
      }
      .detail-tabs {
        display: flex;
        gap: 0.5rem;
        border-bottom: 1px solid var(--border-color);
        margin-top: 1rem;
        padding-bottom: 0.5rem;
      }
      .detail-tab {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        padding: 0.5rem 1rem;
        font-weight: 600;
        margin: 0;
        border-radius: var(--radius-sm);
      }
      .detail-tab:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
      .detail-tab.active {
        background: rgba(99, 102, 241, 0.1);
        color: var(--brand-500);
      }
      .detail-panel { display: none; padding-top: 1rem; animation: fade-in 0.2s; }
      .detail-panel.active { display: block; }

      .detail-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; max-height: 400px; overflow-y: auto; }
      .detail-item {
        padding: 0.75rem;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      .network-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
      .network-box {
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 1rem;
      }
      .network-box h4 { margin-top: 0; margin-bottom: 1rem; }
      .detail { font-family: monospace; font-size: 0.8rem; white-space: pre-wrap; word-break: break-all; color: var(--text-secondary); }

      .org-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-top: 1rem;
      }
      .org-stack { display: flex; flex-direction: column; gap: 1.5rem; }
      .org-empty {
        text-align: center;
        padding: 3rem 2rem;
        border: 1px dashed var(--brand-500);
        background: rgba(99, 102, 241, 0.05);
      }
      .org-summary { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
      
      .org-list { list-style: none; padding: 0; margin: 1rem 0; display: grid; gap: 0.5rem; }
      .org-row {
        padding: 1rem;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: var(--transition-fast);
      }
      .org-row:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2); }
      .org-row.active {
        background: rgba(99, 102, 241, 0.1);
        border-color: var(--brand-500);
        box-shadow: 0 0 0 1px var(--brand-500);
      }
      .org-meta { display: flex; flex-direction: column; gap: 0.25rem; }
      .org-meta strong { font-size: 1rem; color: var(--text-primary); }
      .org-meta small { color: var(--text-muted); font-size: 0.75rem; }
      
      .role-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        background: rgba(255,255,255,0.1);
        font-weight: 600;
        text-transform: uppercase;
      }
      .role-badge.owner { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3); }
      .role-badge.admin { background: rgba(14, 165, 233, 0.2); color: #7dd3fc; border: 1px solid rgba(14, 165, 233, 0.3); }

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
        background: rgba(0,0,0,0.2);
        padding: 1rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        margin-bottom: 1rem;
        align-items: end;
      }
      .filter-grid .full { grid-column: 1 / -1; }
      
      .saved-views { list-style: none; padding: 0; margin: 1rem 0; display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .saved-views li { display: flex; align-items: center; gap: 0.5rem; }
      .saved-views .btn { margin-top: 0; }

      .route-state {
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        font-weight: 500;
        display: none;
      }
      .route-state-info { background: rgba(14, 165, 233, 0.1); border: 1px solid rgba(14, 165, 233, 0.2); color: #7dd3fc; }
      .route-state-loading { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); color: #a5b4fc; }
      .route-state-error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #fca5a5; }
      .route-state-success { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: #6ee7b7; }

      hr { border: 0; border-top: 1px solid var(--border-color); margin: 1.5rem 0; }
      code { font-family: monospace; background: rgba(0,0,0,0.3); padding: 0.125rem 0.25rem; border-radius: 4px; color: var(--accent-500); }

      @keyframes fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slide-down {
        from { opacity: 0; transform: translateY(-8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      #toast-root {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 50;
      }
      .toast {
        background: rgba(24, 24, 27, 0.9);
        backdrop-filter: blur(8px);
        border: 1px solid var(--border-color);
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        color: white;
        font-weight: 500;
        animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .toast-success { border-left: 4px solid var(--success); }
      .toast-error { border-left: 4px solid var(--danger); }
      @keyframes slide-up {
        from { opacity: 0; transform: translateY(100%) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @media (max-width: 900px) {
        .app { grid-template-columns: 1fr; }
        .sidebar { position: fixed; bottom: 0; left: 0; right: 0; flex-direction: row; padding: 0.5rem; border-right: none; border-top: 1px solid var(--border-color); z-index: 100; justify-content: space-around; }
        .brand { display: none; }
        .nav { display: flex; gap: 0.25rem; }
        .nav button { padding: 0.5rem; font-size: 0; } 
        .content-body { padding-bottom: 80px; }
        .auth-layout { grid-template-columns: 1fr; }
        .detail-layout, .org-layout { grid-template-columns: 1fr; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
`;

const startIndex = content.indexOf('<style>');
const endIndex = content.indexOf('</style>');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex + 7) + '\n' + newCss + '    ' + content.slice(endIndex);
  fs.writeFileSync(filePath, content);
  console.log('CSS updated successfully.');
} else {
  console.error('Could not find <style> tags.');
}
