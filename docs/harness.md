# 最小ハーネス

第1段階の静的なデジタル名刺では、最も影響が大きい「秘密情報の公開」と「壊れた名刺の公開」を防ぐ。人を日常的なボトルネックにしないため、通常の変更は自動検証で完結させる。

## 3つのルール

| 種類 | ルール | 実装 |
| --- | --- | --- |
| 安全 | 公開してよい情報だけをリポジトリとブラウザ成果物に含める。 | `.gitignore` と `npm run check:public`。GitHub側ではSecret Scanning／Push Protectionを有効にする。 |
| 品質 | 型、未使用コード、書式、主要操作、出力結果を自動で検証する。 | TypeScript strict設定、BiomeのLint／Formatter、Playwright E2E、`npm run verify`。 |
| 公開 | 検証済み成果物だけを公開する。 | GitHub Actionsで `npm ci` と `npm run verify` を実行してからGitHub Pagesへ配信する。 |

## 日常の作業

1. 小さな変更を実装し、必要なら対応するE2Eを更新する。
2. `npm run verify` を実行する。
3. 成功した変更を確認して反映する。

`npm run dev` は標準のVite開発サーバーを起動する。依存を同期する必要がある場合は、開発サーバーを人が終了してから `npm ci` を実行する。`npm run test:e2e` は、空いているポート4174に起動した自分自身のPreviewだけを終了する。他のプロセスを自動終了する仕組みは持たない。

E2Eはモバイル幅でChromium、Firefox、WebKitを対象に実行する。WebKitはSafariに近い検証であり、iPhone Safariそのものではない。

## モバイル実機の公開ゲート

公開前に、実機のiPhone SafariとAndroid Chromeの**両方**で次を確認する。いずれかに問題があれば公開しない。

1. プロフィール／ポートフォリオの表示と切替
2. 保存・シェアシートの表示・閉じる操作
3. URLシェアとリンクコピーのフォールバック
4. PNG・PDF保存操作の開始、生成ファイルを開けること、エラー表示がないこと

GitHub Pagesの公開ワークフローは自動実行しない。上記を確認した後に、GitHub Actionsの **Deploy GitHub Pages** を手動実行し、`mobile_output_checked` を有効にして公開する。Chromium・Firefox・WebKitの自動検証が成功していることも公開条件とする。

## 初回公開時のGitHub設定

リポジトリ管理者は、最初の公開前にGitHubのSecret ScanningとPush Protectionを有効にする。これはGitHubのリポジトリ設定で行う一度だけの作業であり、リポジトリ内のCIから有効化・検証はできない。`npm run check:public` はその補助策であり、GitHub側の検出を置き換えない。

## 最小コードレビュー

普段の文言・素材・小規模レイアウト変更は追加レビュー不要とする。次の場合だけ、依頼内容、公開情報、検証結果、残るリスクを短く確認する。

- GitHub Actions、Pages、公開URL、公開範囲の変更
- 秘密情報、環境変数、外部サービス連携に関わる変更
- 複数コンポーネントをまたぐ大きなリファクタリング
- 自動検証が失敗した、または成功結果を説明できない変更

詳細な確認項目は `docs/code-review.md` を正とする。必要時は読み取り専用のサブエージェントを使えるが、必須ではない。

## 保留するもの

視覚回帰テストはデザインカンプ承認後に導入する。`npm run format` は書式だけを安全に自動整形する。意味のある構造変更は自動適用せず、テスト成功後に差分確認する。依存や設計判断の詳細ログは、新しい依存または公開方式を採用するときだけ `docs/decision-log.md` に追記する。
