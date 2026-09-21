# 技術判断ログ

更新日：2026-09-21  
目的：依存パッケージ、フレームワークAPI、設計パターンの採用根拠を追跡し、非推奨または保守されていない実装の混入を防ぐ。

## 記録ルール

新しい依存パッケージ、フレームワークAPI、または設計パターンを導入する変更ごとに、次の項目を追記する。

- 決定日
- 対象と採用内容
- 公式URL
- 採用バージョン
- サポート確認日
- 採用理由と代替案
- 検証方法・結果

過去の決定を推測して遡及記録しない。既存の要件・実装は `docs/requirements.md` と `docs/animation-spec.md` を正とし、以後の技術判断をこの文書へ記録する。

## 2026-09-21: 第1段階の検証とデプロイ

### PlaywrightによるE2Eテスト

- 公式URL: https://playwright.dev/docs/intro
- 採用バージョン: `@playwright/test` 1.63.0、`jsqr` 1.4.0、`pngjs` 7.0.0、`pdf-lib` 1.17.1
- サポート確認日: 2026-09-21
- 採用理由: モバイル幅の実ブラウザで、画面切替、保存・シェア、URLコピー、PNG/PDF出力を利用者が観測できる結果として確認するため。
- 代替案: コンポーネント単体テストのみ。ブラウザAPIとダウンロードの実効性を確認できないため採用しない。
- 検証方法: `npm run test:e2e`。本番の`dist`をVite Previewで配信し、GitHub ActionsでもChromiumを用いて実行する。PNGの寸法、PDFのページ数・比率、QRコードの復号結果まで確認する。
- 補足: WindowsでPlaywrightの標準 `webServer` がViteの子プロセスを残すことがあるため、`scripts/run-e2e.mjs` が空いているポート4174で自分自身のPreviewを直接起動・終了する。使用中のポートや他のプロセスは停止しない。

### GitHub ActionsによるGitHub Pagesデプロイ

- 公式URL: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- 採用内容: `actions/configure-pages`、`actions/upload-pages-artifact`、`actions/deploy-pages` を使い、`dist` を公開する。
- 採用バージョン: `actions/checkout@v6`、`actions/setup-node@v6`、`actions/configure-pages@v5`、`actions/upload-pages-artifact@v4`、`actions/deploy-pages@v4`、Node.js 24
- サポート確認日: 2026-09-21
- 採用理由: Viteのビルド成果物を、テスト成功後にGitHub Pagesへ公開できるため。
- 代替案: `gh-pages` ブランチへの直接書込み。ビルド・検証・公開の証跡をActionsへ集約するため採用しない。
- 検証方法: `main` への反映後に、Actionsのデプロイ結果と公開URLを確認する。

### 廃止: プロジェクト専用の依存同期

この設計は同日の最小ハーネス移行で廃止した。日常開発に専用のプロセス制御と排他ロックを導入すると、静的サイトとして必要な安全策に対して運用負荷が大きくなるためである。今後は、開発サーバーを人が終了してから通常の `npm ci` を実行する。未追跡のプロセスを自動停止しない安全方針は維持する。

- 公式URL: https://nodejs.org/api/child_process.html
- 採用内容: `npm run dev` はランダムなトークンとインスタンスIDを持つローカル専用の制御窓口を作り、`npm run deps:sync` は認証済みの終了要求を送ってから `npm ci` を実行する。PID番号だけを信頼して停止しない。
- サポート確認日: 2026-09-21
- 採用理由: ネイティブ依存がロックされるWindows環境でも、他のアプリケーションを止めずに依存同期を自動化するため。
- 代替案: 実行中のNodeプロセスを一律に終了する。別プロジェクトやユーザーの作業を中断する危険があるため採用しない。
- 検証方法: 開発サーバー起動後に `npm run deps:sync` を実行し、認証済みの追跡サーバーだけが終了して `npm ci` が成功することを確認する。起動・同期の同時実行は原子的な排他ロックで拒否し、追跡できないサーバーを自動停止しないことも確認する。

## 2026-09-21: 最小ハーネスへの縮小

### BiomeによるLint／Formatter

- 公式URL: https://biomejs.dev/guides/getting-started/
- 採用内容: `@biomejs/biome` 2.5.14 を使い、`npm run lint`、`npm run format:check`、`npm run format` を提供する。`npm run verify` はBiomeのLintと書式検証を含む。
- サポート確認日: 2026-09-22
- 採用理由: 依存を最小限に保ちながら、未使用コードなどの静的問題と書式の不一致をCIで止め、機械的な書式修正だけを安全に自動化するため。
- 代替案: ESLintとPrettierを別々に導入する。小規模な静的サイトでは設定・依存を増やさないBiomeを採用する。
- 検証方法: `npm run check:quality` と `npm run verify`。
- ルールの例外: `prefers-reduced-motion` を確実に優先するCSSの `!important` と、無関係なコンポーネント間で検出されるCSSセレクターの優先度警告は無効化する。前者はアクセシビリティ要件を、後者はコンポーネント固有のクラス名を優先するためである。

### 公開情報チェック

- 公式URL: https://nodejs.org/api/child_process.html 、https://nodejs.org/api/fs.html
- 採用内容: Node.js標準APIだけを使う `npm run check:public` を追加し、追跡済みまたは追加予定のテキストファイルに秘密鍵、代表的なGitHub・Slack・OpenAIトークン、秘密らしい `VITE_*` 変数、追跡対象の `.env` がないことを確認する。
- 採用バージョン: Node.js 24（GitHub Actionsと同じ版）
- サポート確認日: 2026-09-21
- 採用理由: 公開リポジトリと静的成果物に秘密情報を含める事故を、外部依存を増やさずに早期検出するため。
- 代替案: 秘密情報スキャナー専用サービス。リポジトリ側のSecret Scanning／Push Protectionは併用を推奨するが、日常のローカル・CI確認には最小限の標準API実装を採用する。
- 検証方法: `npm run check:public`。失敗時は `npm run verify` とGitHub Pagesデプロイを停止する。
