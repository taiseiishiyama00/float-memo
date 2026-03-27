# Float Memo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Windows上で常時最前面・最小化可能・タブ付き・自動保存・復元対応のElectronメモアプリを完成させる。

**Architecture:** ElectronのMainでウィンドウ制御と永続化、RendererでタブUIと編集状態管理を担う。保存はユーザーデータ配下の単一JSONへ原子的に書き込み、起動時にUI状態とウィンドウ状態を復元する。ロジックは可能な限り純粋関数へ分離して単体テストで担保する。

**Tech Stack:** Electron, Node.js, Vitest, Playwright (E2E smoke), plain HTML/CSS/JavaScript

---

## File Structure

- Create: package.json
- Create: .gitignore
- Create: main.js
- Create: preload.js
- Create: src/main/defaultState.js
- Create: src/main/stateStore.js
- Create: src/main/windowPlacement.js
- Create: src/renderer/index.html
- Create: src/renderer/styles.css
- Create: src/renderer/renderer.js
- Create: tests/unit/defaultState.test.js
- Create: tests/unit/stateStore.test.js
- Create: tests/unit/windowPlacement.test.js
- Create: tests/unit/tabModel.test.js
- Create: tests/smoke/app-launch.spec.js
- Create: playwright.config.js

### Task 1: Project Scaffold + Test Harness

**Files:**
- Create: package.json
- Create: .gitignore

- [ ] **Step 1: Write the failing test command expectation (no config yet)**

```bash
npm test
```

Expected: FAIL with missing package script or missing dependencies.

- [ ] **Step 2: Add minimal package and ignore config**

```json
{
  "name": "float-memo",
  "version": "1.0.0",
  "description": "Always-on-top floating memo",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "electron": "^37.1.0",
    "vitest": "^2.1.8",
    "playwright": "^1.53.2"
  }
}
```

```gitignore
node_modules/
playwright-report/
test-results/
*.log
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`
Expected: PASS with lockfile generated.

- [ ] **Step 4: Verify test command now runs test runner**

Run: `npm test`
Expected: PASS (0 tests) or FAIL only because test files are not yet created, but runner starts correctly.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize electron app and test tooling"
```

### Task 2: Default State Model (TDD)

**Files:**
- Create: src/main/defaultState.js
- Create: tests/unit/defaultState.test.js

- [ ] **Step 1: Write failing tests for default state generation**

```javascript
import { describe, it, expect } from 'vitest';
import { createDefaultState } from '../../src/main/defaultState.js';

describe('createDefaultState', () => {
  it('creates one empty tab and activeTabId', () => {
    const state = createDefaultState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].content).toBe('');
    expect(state.activeTabId).toBe(state.tabs[0].id);
  });

  it('sets appVersion and timestamps', () => {
    const state = createDefaultState();
    expect(state.appVersion).toBe(1);
    expect(typeof state.updatedAt).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/defaultState.test.js`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
export function createDefaultState() {
  const now = new Date().toISOString();
  const id = 'tab-1';
  return {
    appVersion: 1,
    window: {
      x: null,
      y: null,
      width: 420,
      height: 520,
      isMaximized: false
    },
    tabs: [
      {
        id,
        title: 'メモ1',
        content: '',
        createdAt: now,
        updatedAt: now
      }
    ],
    activeTabId: id,
    updatedAt: now
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/defaultState.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/defaultState.js tests/unit/defaultState.test.js
git commit -m "test: add and satisfy default state model tests"
```

### Task 3: Persistence Store with Recovery (TDD)

**Files:**
- Create: src/main/stateStore.js
- Create: tests/unit/stateStore.test.js
- Modify: src/main/defaultState.js

- [ ] **Step 1: Write failing persistence tests**

```javascript
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { loadState, saveStateAtomic } from '../../src/main/stateStore.js';
import { createDefaultState } from '../../src/main/defaultState.js';

describe('stateStore', () => {
  it('returns default state when file does not exist', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-'));
    const file = path.join(dir, 'state.json');
    const state = loadState(file);
    expect(state.tabs.length).toBe(1);
  });

  it('backs up broken json and returns default state', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-'));
    const file = path.join(dir, 'state.json');
    fs.writeFileSync(file, '{broken', 'utf8');
    const state = loadState(file);
    expect(state.tabs.length).toBe(1);
    expect(fs.existsSync(`${file}.bak`)).toBe(true);
  });

  it('saves state atomically', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-'));
    const file = path.join(dir, 'state.json');
    const state = createDefaultState();
    saveStateAtomic(file, state);
    const loaded = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(loaded.appVersion).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/stateStore.test.js`
Expected: FAIL with module not found.

- [ ] **Step 3: Write minimal implementation**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { createDefaultState } from './defaultState.js';

function ensureTabIntegrity(state) {
  if (!Array.isArray(state.tabs) || state.tabs.length === 0) {
    return createDefaultState();
  }
  const hasActive = state.tabs.some((t) => t.id === state.activeTabId);
  if (!hasActive) {
    state.activeTabId = state.tabs[0].id;
  }
  return state;
}

export function loadState(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return createDefaultState();
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return ensureTabIntegrity(parsed);
  } catch {
    try {
      if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, `${filePath}.bak`);
      }
    } catch {
      // ignore backup failure
    }
    return createDefaultState();
  }
}

export function saveStateAtomic(filePath, state) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempPath, filePath);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/stateStore.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/stateStore.js tests/unit/stateStore.test.js
git commit -m "test: add persistence store with backup and atomic save"
```

### Task 4: Window Placement Logic (TDD)

**Files:**
- Create: src/main/windowPlacement.js
- Create: tests/unit/windowPlacement.test.js

- [ ] **Step 1: Write failing placement tests**

```javascript
import { describe, it, expect } from 'vitest';
import { computeInitialBounds, clampBoundsToWorkArea } from '../../src/main/windowPlacement.js';

describe('windowPlacement', () => {
  it('positions initial window near bottom-right 25%', () => {
    const bounds = computeInitialBounds({ width: 1920, height: 1080 }, { width: 420, height: 520 });
    expect(bounds.x).toBeGreaterThan(1200);
    expect(bounds.y).toBeGreaterThan(500);
  });

  it('clamps out-of-screen bounds into work area', () => {
    const fixed = clampBoundsToWorkArea(
      { x: 9999, y: 9999, width: 420, height: 520 },
      { x: 0, y: 0, width: 1920, height: 1080 }
    );
    expect(fixed.x).toBeLessThanOrEqual(1500);
    expect(fixed.y).toBeLessThanOrEqual(560);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/windowPlacement.test.js`
Expected: FAIL with missing module.

- [ ] **Step 3: Write minimal implementation**

```javascript
export function computeInitialBounds(screenSize, windowSize) {
  const x = Math.round(screenSize.width * 0.75 - windowSize.width * 0.5);
  const y = Math.round(screenSize.height * 0.75 - windowSize.height * 0.5);
  return { x: Math.max(0, x), y: Math.max(0, y), width: windowSize.width, height: windowSize.height };
}

export function clampBoundsToWorkArea(bounds, workArea) {
  const maxX = workArea.x + workArea.width - bounds.width;
  const maxY = workArea.y + workArea.height - bounds.height;
  const x = Math.min(Math.max(bounds.x, workArea.x), maxX);
  const y = Math.min(Math.max(bounds.y, workArea.y), maxY);
  return { ...bounds, x, y };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/windowPlacement.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/windowPlacement.js tests/unit/windowPlacement.test.js
git commit -m "test: add window placement and clamping logic"
```

### Task 5: Renderer Tab Model (TDD)

**Files:**
- Create: tests/unit/tabModel.test.js
- Create: src/renderer/tabModel.js

- [ ] **Step 1: Write failing tests for tab operations**

```javascript
import { describe, it, expect } from 'vitest';
import { addTab, removeTab, renameTab, reorderTabs } from '../../src/renderer/tabModel.js';

describe('tab operations', () => {
  it('adds a tab and activates it', () => {
    const state = { tabs: [{ id: 'a', title: 'A', content: '' }], activeTabId: 'a' };
    const next = addTab(state);
    expect(next.tabs.length).toBe(2);
    expect(next.activeTabId).toBe(next.tabs[1].id);
  });

  it('removes active tab and selects next available', () => {
    const state = {
      tabs: [
        { id: 'a', title: 'A', content: '' },
        { id: 'b', title: 'B', content: '' }
      ],
      activeTabId: 'b'
    };
    const next = removeTab(state, 'b');
    expect(next.tabs.length).toBe(1);
    expect(next.activeTabId).toBe('a');
  });

  it('renames a tab', () => {
    const state = { tabs: [{ id: 'a', title: 'A', content: '' }], activeTabId: 'a' };
    const next = renameTab(state, 'a', 'X');
    expect(next.tabs[0].title).toBe('X');
  });

  it('reorders tabs', () => {
    const state = {
      tabs: [
        { id: 'a', title: 'A', content: '' },
        { id: 'b', title: 'B', content: '' }
      ],
      activeTabId: 'a'
    };
    const next = reorderTabs(state, 0, 1);
    expect(next.tabs[0].id).toBe('b');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/tabModel.test.js`
Expected: FAIL because functions are not exported yet.

- [ ] **Step 3: Implement minimal pure functions and export them**

```javascript
let idCounter = 1;

export function addTab(state) {
  idCounter += 1;
  const id = `tab-${idCounter}`;
  const tab = { id, title: `メモ${state.tabs.length + 1}`, content: '' };
  return { ...state, tabs: [...state.tabs, tab], activeTabId: id };
}

export function removeTab(state, id) {
  const tabs = state.tabs.filter((t) => t.id !== id);
  if (tabs.length === 0) {
    const fallback = { id: 'tab-1', title: 'メモ1', content: '' };
    return { tabs: [fallback], activeTabId: fallback.id };
  }
  const activeTabId = tabs.some((t) => t.id === state.activeTabId) ? state.activeTabId : tabs[0].id;
  return { ...state, tabs, activeTabId };
}

export function renameTab(state, id, title) {
  const tabs = state.tabs.map((t) => (t.id === id ? { ...t, title } : t));
  return { ...state, tabs };
}

export function reorderTabs(state, fromIndex, toIndex) {
  const tabs = [...state.tabs];
  const [moved] = tabs.splice(fromIndex, 1);
  tabs.splice(toIndex, 0, moved);
  return { ...state, tabs };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/tabModel.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/tabModel.js tests/unit/tabModel.test.js
git commit -m "test: implement tab model operations with unit tests"
```

### Task 6: Main/Preload/Renderer Integration

**Files:**
- Create: main.js
- Create: preload.js
- Create: src/renderer/index.html
- Create: src/renderer/styles.css
- Modify: src/renderer/renderer.js
- Modify: src/main/stateStore.js

- [ ] **Step 1: Write failing smoke test for app launch and visible editor**

Create tests/smoke/app-launch.spec.js:

```javascript
import { test, expect, _electron as electron } from '@playwright/test';

test('app launches and shows editor', async () => {
  const app = await electron.launch({ args: ['.'] });
  const window = await app.firstWindow();
  await expect(window.locator('#editor')).toBeVisible();
  await app.close();
});
```

Create playwright.config.js:

```javascript
export default {
  testDir: './tests/smoke',
  timeout: 30000
};
```

- [ ] **Step 2: Run smoke test to verify it fails**

Run: `npx playwright test tests/smoke/app-launch.spec.js`
Expected: FAIL because UI files and selectors do not exist.

- [ ] **Step 3: Implement window creation, IPC, and UI**

Create main.js:

```javascript
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadState, saveStateAtomic } from './src/main/stateStore.js';
import { createDefaultState } from './src/main/defaultState.js';
import { computeInitialBounds, clampBoundsToWorkArea } from './src/main/windowPlacement.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
let stateFile;
let inMemoryState = createDefaultState();

function resolveBounds(savedWindow) {
  const display = screen.getPrimaryDisplay();
  const workArea = display.workArea;
  if (savedWindow && Number.isFinite(savedWindow.x) && Number.isFinite(savedWindow.y)) {
    return clampBoundsToWorkArea(savedWindow, workArea);
  }
  const initial = computeInitialBounds(
    { width: workArea.width, height: workArea.height },
    { width: 420, height: 520 }
  );
  return { ...initial, x: initial.x + workArea.x, y: initial.y + workArea.y };
}

function createWindow() {
  const bounds = resolveBounds(inMemoryState.window);
  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'src/renderer/index.html'));

  win.on('close', () => {
    const b = win.getBounds();
    inMemoryState = {
      ...inMemoryState,
      window: {
        ...inMemoryState.window,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        isMaximized: win.isMaximized()
      }
    };
    saveStateAtomic(stateFile, inMemoryState);
  });
}

app.whenReady().then(() => {
  stateFile = path.join(app.getPath('userData'), 'state.json');
  inMemoryState = loadState(stateFile);
  createWindow();

  ipcMain.handle('load-state', () => inMemoryState);
  ipcMain.on('save-state', (_event, nextState) => {
    inMemoryState = { ...nextState, updatedAt: new Date().toISOString() };
    saveStateAtomic(stateFile, inMemoryState);
  });
  ipcMain.on('window-minimize', () => {
    if (win) {
      win.minimize();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

Create preload.js:

```javascript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('memoApi', {
  loadState: () => ipcRenderer.invoke('load-state'),
  saveState: (state) => ipcRenderer.send('save-state', state),
  minimizeWindow: () => ipcRenderer.send('window-minimize')
});
```

Create src/renderer/index.html:

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Float Memo</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <header class="toolbar">
      <button id="add-tab">+</button>
      <button id="rename-tab">名前変更</button>
      <button id="delete-tab">削除</button>
      <button id="minimize">最小化</button>
    </header>
    <div id="tabs" class="tabs"></div>
    <textarea id="editor" placeholder="メモを入力"></textarea>
    <script type="module" src="./renderer.js"></script>
  </body>
</html>
```

Create src/renderer/styles.css:

```css
:root {
  color-scheme: light;
  --bg: #f7f4ec;
  --panel: #efe7d8;
  --ink: #2f2416;
  --accent: #bb7f35;
}

body {
  margin: 0;
  background: radial-gradient(circle at top left, #fff6df, var(--bg));
  font-family: "Yu Gothic UI", "Meiryo", sans-serif;
  color: var(--ink);
}

.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: var(--panel);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  overflow-x: auto;
}

.tab {
  border: 1px solid #d5c4a8;
  background: #fffaf0;
  padding: 4px 8px;
  cursor: pointer;
}

.tab.active {
  border-color: var(--accent);
  background: #ffe9c8;
}

#editor {
  width: calc(100% - 16px);
  height: calc(100vh - 96px);
  margin: 8px;
  resize: none;
  border: 1px solid #ceb99a;
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
}
```

Create src/renderer/renderer.js:

```javascript
import { addTab, removeTab, renameTab, reorderTabs } from './tabModel.js';

const tabsEl = document.querySelector('#tabs');
const editorEl = document.querySelector('#editor');
const addBtn = document.querySelector('#add-tab');
const renameBtn = document.querySelector('#rename-tab');
const deleteBtn = document.querySelector('#delete-tab');
const minimizeBtn = document.querySelector('#minimize');

let state = await window.memoApi.loadState();
let saveTimer = null;

function getActiveTab() {
  return state.tabs.find((t) => t.id === state.activeTabId) ?? state.tabs[0];
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    window.memoApi.saveState(state);
  }, 500);
}

function renderTabs() {
  tabsEl.innerHTML = '';
  state.tabs.forEach((tab, index) => {
    const btn = document.createElement('button');
    btn.className = tab.id === state.activeTabId ? 'tab active' : 'tab';
    btn.textContent = tab.title;
    btn.draggable = true;
    btn.dataset.id = tab.id;
    btn.dataset.index = String(index);
    btn.addEventListener('click', () => {
      state = { ...state, activeTabId: tab.id };
      render();
      scheduleSave();
    });
    btn.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(index));
    });
    btn.addEventListener('dragover', (e) => e.preventDefault());
    btn.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = index;
      state = reorderTabs(state, from, to);
      render();
      scheduleSave();
    });
    tabsEl.appendChild(btn);
  });
}

function render() {
  renderTabs();
  const tab = getActiveTab();
  if (tab) {
    editorEl.value = tab.content;
  }
}

addBtn.addEventListener('click', () => {
  state = addTab(state);
  render();
  scheduleSave();
});

renameBtn.addEventListener('click', () => {
  const active = getActiveTab();
  const title = window.prompt('新しいタブ名', active.title);
  if (!title) return;
  state = renameTab(state, active.id, title);
  render();
  scheduleSave();
});

deleteBtn.addEventListener('click', () => {
  const active = getActiveTab();
  state = removeTab(state, active.id);
  render();
  scheduleSave();
});

minimizeBtn.addEventListener('click', () => {
  window.memoApi.minimizeWindow();
});

editorEl.addEventListener('input', () => {
  const tab = getActiveTab();
  state = {
    ...state,
    tabs: state.tabs.map((t) =>
      t.id === tab.id ? { ...t, content: editorEl.value, updatedAt: new Date().toISOString() } : t
    )
  };
  scheduleSave();
});

render();
```

Create src/renderer/tabModel.js:

```javascript
let idCounter = 1;

export function addTab(state) {
  idCounter += 1;
  const id = `tab-${idCounter}`;
  const tab = {
    id,
    title: `メモ${state.tabs.length + 1}`,
    content: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return { ...state, tabs: [...state.tabs, tab], activeTabId: id };
}

export function removeTab(state, id) {
  const tabs = state.tabs.filter((t) => t.id !== id);
  if (tabs.length === 0) {
    const now = new Date().toISOString();
    const fallback = { id: 'tab-1', title: 'メモ1', content: '', createdAt: now, updatedAt: now };
    return { ...state, tabs: [fallback], activeTabId: fallback.id };
  }
  const activeTabId = tabs.some((t) => t.id === state.activeTabId) ? state.activeTabId : tabs[0].id;
  return { ...state, tabs, activeTabId };
}

export function renameTab(state, id, title) {
  return {
    ...state,
    tabs: state.tabs.map((t) => (t.id === id ? { ...t, title, updatedAt: new Date().toISOString() } : t))
  };
}

export function reorderTabs(state, from, to) {
  if (from === to || from < 0 || to < 0 || from >= state.tabs.length || to >= state.tabs.length) {
    return state;
  }
  const tabs = [...state.tabs];
  const [moved] = tabs.splice(from, 1);
  tabs.splice(to, 0, moved);
  return { ...state, tabs };
}
```

- [ ] **Step 4: Run full unit tests and smoke test**

Run: `npm test`
Expected: PASS for all unit tests.

Run: `npx playwright test tests/smoke/app-launch.spec.js`
Expected: PASS for app launch smoke.

- [ ] **Step 5: Commit**

```bash
git add main.js preload.js src/renderer/index.html src/renderer/styles.css src/renderer/renderer.js src/renderer/tabModel.js tests/smoke/app-launch.spec.js playwright.config.js
git commit -m "feat: integrate always-on-top memo window, tabs, autosave, and restore"
```

### Task 7: Verification Checklist Before Completion

**Files:**
- Modify: README.md (if project usage docs added)

- [ ] **Step 1: Execute requirement verification commands**

Run: `npm test`
Expected: PASS with 0 failures.

Run: `npx playwright test tests/smoke/app-launch.spec.js`
Expected: PASS.

- [ ] **Step 2: Manual verification sequence**

1. `npm start`で起動
2. 他Windowをフォーカスして最前面維持を確認
3. 最小化してタスクバーから復帰
4. タブを追加・削除・改名・並び替え
5. テキスト編集後500ms待機
6. アプリ終了
7. 再起動して状態復元確認

Expected: 全要件を満たす。

- [ ] **Step 3: Final commit for docs (optional)**

```bash
git add README.md
git commit -m "docs: add run and verification instructions"
```
