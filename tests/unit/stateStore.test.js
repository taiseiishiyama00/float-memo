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

  it('overwrites an existing state file on repeated saves', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-'));
    const file = path.join(dir, 'state.json');
    const first = createDefaultState();
    const second = {
      ...createDefaultState(),
      content: 'persisted text',
      tabs: [
        {
          ...createDefaultState().tabs[0],
          content: 'persisted text'
        }
      ]
    };

    saveStateAtomic(file, first);
    saveStateAtomic(file, second);

    const loaded = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(loaded.content).toBe('persisted text');
    expect(loaded.tabs[0].content).toBe('persisted text');
  });
});