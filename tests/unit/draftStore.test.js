import { describe, it, expect } from 'vitest';
import { readDraft, writeDraft, clearDraft, DRAFT_STORAGE_KEY } from '../../src/renderer/draftStore.js';

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
    dump() {
      return values;
    }
  };
}

describe('draftStore', () => {
  it('returns fallback when no draft is stored', () => {
    const storage = createStorage();
    expect(readDraft(storage, 'fallback')).toBe('fallback');
  });

  it('writes and reads draft content', () => {
    const storage = createStorage();
    writeDraft(storage, 'memo text');
    expect(storage.dump().get(DRAFT_STORAGE_KEY)).toBe('memo text');
    expect(readDraft(storage, '')).toBe('memo text');
  });

  it('clears a stored draft', () => {
    const storage = createStorage();
    writeDraft(storage, 'memo text');
    clearDraft(storage);
    expect(readDraft(storage, 'fallback')).toBe('fallback');
  });
});