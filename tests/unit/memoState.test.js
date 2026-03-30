import { describe, it, expect } from 'vitest';
import { getEditorContent, updateEditorContent } from '../../src/renderer/memoState.js';

describe('memoState', () => {
  it('reads the active tab content', () => {
    const state = {
      activeTabId: 'tab-2',
      tabs: [
        { id: 'tab-1', content: 'one' },
        { id: 'tab-2', content: 'two' }
      ]
    };

    expect(getEditorContent(state)).toBe('two');
  });

  it('updates the active tab content and top-level content', () => {
    const state = {
      activeTabId: 'tab-1',
      tabs: [
        { id: 'tab-1', content: 'old', updatedAt: '2026-03-30T00:00:00.000Z' },
        { id: 'tab-2', content: 'keep' }
      ]
    };

    const next = updateEditorContent(state, 'new', '2026-03-30T12:34:56.000Z');

    expect(next.content).toBe('new');
    expect(next.updatedAt).toBe('2026-03-30T12:34:56.000Z');
    expect(next.tabs[0].content).toBe('new');
    expect(next.tabs[0].updatedAt).toBe('2026-03-30T12:34:56.000Z');
    expect(next.tabs[1].content).toBe('keep');
  });
});