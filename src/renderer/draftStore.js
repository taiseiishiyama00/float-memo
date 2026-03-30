const DRAFT_STORAGE_KEY = 'float-memo.editor-content';

export function readDraft(storage, fallback = '') {
  const value = storage?.getItem?.(DRAFT_STORAGE_KEY);
  return typeof value === 'string' ? value : fallback;
}

export function writeDraft(storage, content) {
  storage?.setItem?.(DRAFT_STORAGE_KEY, content);
  return content;
}

export function clearDraft(storage) {
  storage?.removeItem?.(DRAFT_STORAGE_KEY);
}

export { DRAFT_STORAGE_KEY };