import { readDraft, writeDraft } from './draftStore.js';
import { getEditorContent, updateEditorContent } from './memoState.js';

const editorEl = document.querySelector('#editor');
const draftStorage = window.localStorage;

editorEl.value = readDraft(draftStorage, '');

let state = null;
let pendingSave = Promise.resolve();

function saveCurrentContent() {
  pendingSave = pendingSave
    .catch(() => undefined)
    .then(() => window.memoApi.saveState(state));

  return pendingSave;
}

function refreshStateFromEditor() {
  writeDraft(draftStorage, editorEl.value);

  if (state) {
    state = updateEditorContent(state, editorEl.value);
  }
}

function flushCurrentContent() {
  refreshStateFromEditor();

  if (state) {
    window.memoApi.flushState(state);
  }
}

editorEl.addEventListener('input', () => {
  refreshStateFromEditor();

  if (state) {
    void saveCurrentContent();
  }
});

window.addEventListener('beforeunload', () => {
  flushCurrentContent();
});

window.addEventListener('pagehide', () => {
  flushCurrentContent();
});

try {
  state = await window.memoApi.loadState();
  const persistedContent = getEditorContent(state);
  const fallbackDraft = readDraft(draftStorage, '');
  const initialContent = persistedContent || fallbackDraft;

  editorEl.value = initialContent;

  if (initialContent !== persistedContent) {
    state = updateEditorContent(state, initialContent);
    void saveCurrentContent();
  }
} catch {
  state = null;
}
