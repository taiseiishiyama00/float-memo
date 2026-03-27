# Float Memo Design

## 1. Goal
Windows上で動作する、常に最前面に表示できるフローティングメモアプリを提供する。以下を満たす。

- 他Windowをフォーカスしても最前面維持
- 最小化可能
- タブ機能あり
- 自動保存のみ（明示保存UIなし）
- 次回起動時に状態復元
- 初期位置は画面右下25%付近

## 2. Decision Summary
採用方式: Electron + ローカルJSON単一ファイル保存

理由:
- 要件達成に必要十分で実装が最短
- UI状態とデータ状態の復元を一元管理しやすい
- 将来拡張時もJSONスキーマ更新で追従しやすい

## 3. Architecture

### 3.1 Main Process Responsibilities
- BrowserWindow作成とウィンドウ制御
- 常時最前面設定（alwaysOnTop）
- 初期位置計算（右下25%付近）
- 画面外座標の補正
- 保存ファイルの読み書き
- IPCエンドポイント提供

### 3.2 Renderer Process Responsibilities
- タブ付きメモUI描画
- タブ操作（追加、削除、名前変更、並び替え）
- 本文編集
- 500msデバウンス後の保存要求送信

### 3.3 IPC Contract
- loadState: 起動時状態ロード
- saveState: 現在状態の保存要求
- minimizeWindow: 最小化要求

## 4. Data Flow

### 4.1 Startup Flow
1. Mainが保存JSONを読み込む
2. ファイル未存在または破損時はデフォルト状態を生成
3. ウィンドウ位置/サイズを復元し、画面外なら補正
4. 補正不能時は右下25%付近へフォールバック
5. Rendererへ初期状態を渡して描画

### 4.2 Edit and Save Flow
1. Rendererで状態更新（タブ操作、本文変更）
2. 500msデバウンス後にsaveStateを送信
3. Mainが一時ファイルへ書き込み後、renameで原子的保存
4. 保存失敗時はUI操作を止めず、次回変更時に再試行

### 4.3 Restore Flow
1. activeTabIdを優先復元
2. 不正IDなら先頭タブを選択
3. タブ0件なら空タブを1件自動生成

## 5. Persistent Schema
```json
{
  "appVersion": 1,
  "window": {
    "x": 100,
    "y": 100,
    "width": 420,
    "height": 520,
    "isMaximized": false
  },
  "tabs": [
    {
      "id": "tab-1",
      "title": "メモ1",
      "content": "",
      "createdAt": "2026-03-27T00:00:00.000Z",
      "updatedAt": "2026-03-27T00:00:00.000Z"
    }
  ],
  "activeTabId": "tab-1",
  "updatedAt": "2026-03-27T00:00:00.000Z"
}
```

## 6. Error Handling
- 読み込み失敗: デフォルト起動し、既存ファイルは .bak に退避
- 保存失敗: 編集継続、警告表示、次回変更で再保存
- IPC異常: 最後のメモリ状態を維持し、1秒後に1回再送
- 座標異常: 画面内へ補正、不可なら右下25%へ
- タブ整合性異常: activeTab補正、0件時タブ再生成

## 7. Testing Strategy

### 7.1 Unit Tests
- 状態管理: タブ追加、削除、改名、並び替え、activeTab切替
- 永続化: 正常保存、破損JSON読み込み、原子的保存
- 復元: 画面外座標補正、不正activeTabId補正

### 7.2 Integration Tests
- 起動 -> 編集 -> 自動保存 -> 再起動で復元確認
- 常時最前面、最小化、復帰の基本動作確認

### 7.3 Manual Checks
- 他Windowフォーカス後も前面維持
- 最小化後にタスクバーから復帰可能
- タブ並び替え後、順序が再起動後も一致
- 本文、選択タブ、ウィンドウ位置/サイズが一致

## 8. Scope Boundaries
今回の実装に含めない:
- 通知領域常駐
- クラウド同期
- 全文検索
- 暗号化

## 9. Open Decisions
なし。実装に必要な仕様は確定。
