# comment-remover — web edition

JavaScript / UserScript からコメントだけを削除する、ブラウザだけで動くツールです。
VS Code 拡張 `comment-remover v0.1.3` の解析ロジックをそのまま移植しています。

**公開URL: https://imu31465.github.io/comment-remover/**

## 開き方

`index.html` をダブルクリックするだけです。サーバーもビルドも不要で、
完全にローカル（オフライン）で動作します。外部への通信は一切ありません。

## 機能

- **貼り付け → 自動でコメント削除**（`自動変換` をオフにすれば `変換` ボタン / `Ctrl+Enter` で実行）
- **レダクションプレビュー**: 消されるコメントが入力側で赤い取り消し線になり、
  保護される `// ==/UserScript==` ヘッダーが琥珀色で表示されます
- 文字列・テンプレートリテラル・正規表現リテラルをコメントと誤認しません
  （`https://…` や `/ab\/c/g` はそのまま残ります）
- `UserScriptヘッダーを保護` の ON / OFF 切替
- ファイルを開く（ドラッグ & ドロップ対応）、結果のコピー / 保存（`Ctrl+S`）
- ドロップしたファイル名に合わせて `<name>.cleaned.user.js` として保存

## テスト（拡張本体との出力一致検証）

インストール済みの拡張と出力が完全に一致するかを自動検証できます。

```powershell
node test/parity.test.mjs
# 拡張のパスを明示する場合:
node test/parity.test.mjs "C:\path\to\extension.js"
```

- 静的コーパス + 乱数 3,000 ケース ×（ヘッダー保護 ON / OFF）で
  旧ロジックと新ロジックの出力文字列を比較します。
- 削除範囲（ranges）が元テキストの `//` `/*` から始まることも検証します。

## デプロイ

完全な静的サイト（ビルド不要）なので、どこにでも置けます。

- **Cloudflare Pages**: フォルダをそのままアップロード、または `wrangler pages deploy .`
- **Vercel**: `vercel`（フレームワーク未指定でそのまま配信可）
- **GitHub Pages / Netlify Drop / 任意のレンタルサーバー**: `index.html` を置くだけ

## 構成

```
comment-remover-web/
├── index.html            # 本体（CSS / JS すべて内蔵）
├── preview.png           # スクリーンショット
├── README.md
└── test/
    └── parity.test.mjs   # 旧拡張とのパリティテスト
```
