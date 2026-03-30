import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('memoApi', {
  loadState: () => ipcRenderer.invoke('load-state'),
  saveState: (state) => ipcRenderer.invoke('save-state', state),
  flushState: (state) => ipcRenderer.sendSync('save-state-sync', state),
  minimizeWindow: () => ipcRenderer.send('window-minimize')
});
