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
