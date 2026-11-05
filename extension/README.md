# comment-remover — VS Code extension

JavaScript / UserScript からコメントだけを削除する VS Code 拡張です。
文字列・テンプレートリテラル・正規表現リテラルをコメントと誤認せず、
`// ==/UserScript==` ヘッダーを保護します。

> このソースは、インストール済みの `undefined_publisher.comment-remover v0.1.3` から復元したものです。
> Web 版（ブラウザだけで動くツール）はリポジトリ直下にあります → https://imu31465.github.io/comment-remover/

## 使い方

1. 対象の JavaScript / `.user.js` を VS Code で開く
2. コマンドパレット（`Ctrl+Shift+P`）から **Remove Comments (Keep UserScript)** を実行

コメントが削除され、UserScript ヘッダー（`// ==/UserScript==` 行まで）はそのまま残ります。

## 開発

- `F5`（実行とデバッグ → Run Extension）で拡張機能開発ホストが起動します
- ビルド不要（素の JavaScript）

## パッケージ / インストール

```powershell
npx @vscode/vsce package
code --install-extension comment-remover-0.1.3.vsix
```

`publisher` を設定していないため、インストール名は `undefined_publisher.comment-remover` になります。

## ロジック

`extension.js` の `removeComments()` が本体です。
Web 版の `test/parity.test.mjs` が、この関数と Web 版の出力が完全一致することを検証します。
