import fs from 'node:fs';
import path from 'node:path';
import { createDefaultState } from './defaultState.js';

function ensureTabIntegrity(state) {
  if (!Array.isArray(state.tabs) || state.tabs.length === 0) {
    return createDefaultState();
  }

  const hasActive = state.tabs.some((tab) => tab.id === state.activeTabId);
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
