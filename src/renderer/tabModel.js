let idCounter = 1;

export function addTab(state) {
  idCounter += 1;
  const id = `tab-${idCounter}`;
  const tab = {
    id,
    title: `メモ${state.tabs.length + 1}`,
    content: ''
  };

  return {
    ...state,
    tabs: [...state.tabs, tab],
    activeTabId: id
  };
}

export function removeTab(state, id) {
  const tabs = state.tabs.filter((tab) => tab.id !== id);

  if (tabs.length === 0) {
    const fallback = { id: 'tab-1', title: 'メモ1', content: '' };
    return {
      tabs: [fallback],
      activeTabId: fallback.id
    };
  }

  const activeTabId = tabs.some((tab) => tab.id === state.activeTabId)
    ? state.activeTabId
    : tabs[0].id;

  return {
    ...state,
    tabs,
    activeTabId
  };
}

export function renameTab(state, id, title) {
  const tabs = state.tabs.map((tab) => (tab.id === id ? { ...tab, title } : tab));
  return {
    ...state,
    tabs
  };
}

export function reorderTabs(state, fromIndex, toIndex) {
  const tabs = [...state.tabs];
  const [moved] = tabs.splice(fromIndex, 1);
  tabs.splice(toIndex, 0, moved);

  return {
    ...state,
    tabs
  };
}
