export function getEditorContent(state) {
  const activeTab = state?.tabs?.find((tab) => tab.id === state.activeTabId);

  if (activeTab && typeof activeTab.content === 'string') {
    return activeTab.content;
  }

  if (typeof state?.content === 'string') {
    return state.content;
  }

  return '';
}

export function updateEditorContent(state, content, timestamp = new Date().toISOString()) {
  const tabs = Array.isArray(state?.tabs)
    ? state.tabs.map((tab) => {
        if (tab.id !== state.activeTabId) {
          return tab;
        }

        return {
          ...tab,
          content,
          updatedAt: timestamp
        };
      })
    : [];

  return {
    ...state,
    content,
    tabs,
    updatedAt: timestamp
  };
}