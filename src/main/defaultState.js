export function createDefaultState() {
  const now = new Date().toISOString();
  const id = 'tab-1';

  return {
    appVersion: 1,
    window: {
      x: null,
      y: null,
      width: 420,
      height: 520,
      isMaximized: false
    },
    tabs: [
      {
        id,
        title: 'メモ1',
        content: '',
        createdAt: now,
        updatedAt: now
      }
    ],
    activeTabId: id,
    updatedAt: now
  };
}