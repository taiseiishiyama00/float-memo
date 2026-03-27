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