const editorEl = document.querySelector('#editor');

let state = await window.memoApi.loadState();
let saveTimer = null;

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    window.memoApi.saveState(state);
  }, 500);
}

function init() {
  if (state && typeof state.content === 'string') {
    editorEl.value = state.content;
  }
}

editorEl.addEventListener('input', () => {
  state = {
    ...state,
    content: editorEl.value,
    updatedAt: new Date().toISOString()
  };
  scheduleSave();
});

init();
