import { addTab, removeTab, renameTab, reorderTabs } from './tabModel.js';

const tabsEl = document.querySelector('#tabs');
const editorEl = document.querySelector('#editor');
const addBtn = document.querySelector('#add-tab');
const renameBtn = document.querySelector('#rename-tab');
const deleteBtn = document.querySelector('#delete-tab');
const minimizeBtn = document.querySelector('#minimize');

let state = await window.memoApi.loadState();
let saveTimer = null;

function normalizeLoadedState(loaded) {
  if (!loaded || !Array.isArray(loaded.tabs) || loaded.tabs.length === 0) {
    return {
      tabs: [{ id: 'tab-1', title: 'メモ1', content: '' }],
      activeTabId: 'tab-1'
    };
  }

  const tabs = loaded.tabs.map((tab, index) => ({
    id: String(tab.id ?? `tab-${index + 1}`),
    title: typeof tab.title === 'string' && tab.title.length > 0 ? tab.title : `メモ${index + 1}`,
    content: typeof tab.content === 'string' ? tab.content : ''
  }));

  const activeTabId = tabs.some((tab) => tab.id === loaded.activeTabId)
    ? loaded.activeTabId
    : tabs[0].id;

  return {
    ...loaded,
    tabs,
    activeTabId
  };
}

state = normalizeLoadedState(state);

function getActiveTab() {
  return state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0];
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
    const tabButton = document.createElement('button');
    tabButton.type = 'button';
    tabButton.className = tab.id === state.activeTabId ? 'tab active' : 'tab';
    tabButton.textContent = tab.title;
    tabButton.draggable = true;

    tabButton.addEventListener('click', () => {
      state = {
        ...state,
        activeTabId: tab.id
      };
      render();
      scheduleSave();
    });

    tabButton.addEventListener('dragstart', (event) => {
      event.dataTransfer?.setData('text/plain', String(index));
    });

    tabButton.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    tabButton.addEventListener('drop', (event) => {
      event.preventDefault();
      const from = Number(event.dataTransfer?.getData('text/plain'));
      const to = index;
      state = reorderTabs(state, from, to);
      render();
      scheduleSave();
    });

    tabsEl.appendChild(tabButton);
  });
}

function render() {
  renderTabs();
  const active = getActiveTab();
  editorEl.value = active?.content ?? '';
}

addBtn.addEventListener('click', () => {
  state = addTab(state);
  render();
  scheduleSave();
});

renameBtn.addEventListener('click', () => {
  const active = getActiveTab();
  if (!active) {
    return;
  }

  const nextTitle = window.prompt('新しいタブ名', active.title);
  if (!nextTitle) {
    return;
  }

  state = renameTab(state, active.id, nextTitle);
  render();
  scheduleSave();
});

deleteBtn.addEventListener('click', () => {
  const active = getActiveTab();
  if (!active) {
    return;
  }

  state = removeTab(state, active.id);
  render();
  scheduleSave();
});

minimizeBtn.addEventListener('click', () => {
  window.memoApi.minimizeWindow();
});

editorEl.addEventListener('input', () => {
  const active = getActiveTab();
  if (!active) {
    return;
  }

  state = {
    ...state,
    tabs: state.tabs.map((tab) =>
      tab.id === active.id ? { ...tab, content: editorEl.value, updatedAt: new Date().toISOString() } : tab
    )
  };

  scheduleSave();
});

render();
