import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('memoApi', {
  loadState: () => ipcRenderer.invoke('load-state'),
  saveState: (state) => ipcRenderer.send('save-state', state),
  minimizeWindow: () => ipcRenderer.send('window-minimize')
});
