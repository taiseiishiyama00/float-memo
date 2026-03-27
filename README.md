# Float Memo

Windows向けのフローティングメモアプリです。

## 開発起動

```powershell
npm install
npm start
```

## テスト

```powershell
npm test
```

## Windows EXEビルド手順

1. `ELECTRON_SKIP_BINARY_DOWNLOAD` を無効化する（設定済みなら削除）。
2. 依存関係をインストールし直す。
3. Windows向けインストーラEXEをビルドする。

```powershell
Remove-Item Env:ELECTRON_SKIP_BINARY_DOWNLOAD -ErrorAction SilentlyContinue
npm install
npm run dist:win
```

成功時の成果物:

- `dist` 配下に `FloatMemo Setup *.exe` が生成されます。

## 失敗時の復旧

Electronバイナリ取得がネットワーク都合で失敗する場合は、次を試してください。

```powershell
npm uninstall electron
$env:ELECTRON_SKIP_BINARY_DOWNLOAD=$null
npm install electron@^37.10.3 --save-dev
npm run dist:win
```

`Cannot create symbolic link` で失敗する場合は、次のどちらかが必要です。

- Windowsの開発者モードを有効化する
- 管理者権限でPowerShellを開いてビルドする

このプロジェクトは `signAndEditExecutable=false` を設定済みです。それでも同エラーが出る場合は上記の権限設定を実施してください。

それでも失敗する場合は、プロキシ/社内証明書/ファイアウォールの影響を確認してください。
