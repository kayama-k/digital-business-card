# デザインQA — idea3_profile

更新日: 2026-09-22

## 参照した表示レイヤー

- `base`: 1024×1536、画像塗り100%と白塗り100%。`public/images/base.png` はこの表示状態をFigmaから1倍で書き出したもの。
- `両端あしらい上部` と `両端あしらい下部`: 各 `Vector 3` の輪郭をFigmaからSVGで書き出し、`Wave.tsx` に転記。塗りは `#3E8AB0`、紙面への乗算は `base-blue.png` に再現。
- `background_building` は非表示のため参照しない。

## 修正と目視確認

- 以前の「passed」判定は誤り。48pxの汎用波と、非表示レイヤー由来の画像を薄く重ねた背景はカンプと一致していなかった。
- 画面上のプロフィールとポートフォリオを、`docs/design-comps/` の各カンプと比較。上部・下部の独立した波、紙目、青色、タイトル、中央要素、ナビゲーションの位置を調整した。
- Chromeで保存用PNGを実際に出力して確認。SVGが黒く書き出される問題を修正し、上下の青面にも紙目が現れることを確認した。
- `npm run verify` で表示素材と波形、PNG/PDF保存、主要導線をChromium・Firefox・WebKitで検証する。

## 残る確認

- 実機のフォント描画と安全領域は未確認。OSによる文字幅の差は残り得る。
- 保存用名刺の本文・QRなどは別フレームのカンプに合わせた実装であり、今回の主対象は `idea3_profile` の表示レイヤー構造。

## 2026-09-23 — profile reference QA

### 比較対象と正規化

- Source visual truth: `C:\Users\beefs\OneDrive\デスクトップ\ITスクール\イラストアイデア\デジタル名刺\deta\image\idea3_profile.png`
- Source pixels: 2048×3072。2:3のため、4分の1に縮小して512×768 CSS px相当へ正規化した。
- Implementation screenshot: `C:\Users\beefs\Documents\Codex\2026-09-22\c-users-beefs-documents-codex-2026-3\outputs\digital-business-card-profile-reference.png`
- Implementation viewport: 512×824 CSS px（カード要素は512×768、deviceScaleFactor 1）。初期プロフィール表示、アニメーション停止前の通常状態。
- Full-view comparison: `C:\Users\beefs\Documents\Codex\2026-09-22\c-users-beefs-documents-codex-2026-3\work\profile-reference-final-comparison.png`。左が正規化済み参照、右が実装。
- Focused comparison: この画面はプロフィール本文と下部ナビの文字サイズ・字間が主な差分だったため、同一の横並び比較でイラスト、役割、氏名、英字名、3ボタンを拡大して確認した。

### 比較履歴

- [P1 → fixed] 役割がイラストより上にあり、参照の情報順と異なっていた。プロフィール本文をカード幅基準の配置へ切り替え、`illustration → role → name → reading` の順に修正した。
- [P1 → fixed] 英字名が本文領域の下端で切れるケースがあった。プロフィール表示時だけ本文領域を拡張し、`SALTY LEMON` が波の手前で完全に表示されるようにした。
- [P2 → fixed] 役割、氏名、英字名、下部メニューの文字が参照より大きく、字間も異なっていた。各要素を個別に調整し、英字名は参照どおりスラッシュなしの `SALTY LEMON` に統一した。
- [P2 → fixed] サブタイトルは読点専用の手動マージンを廃止し、`font-feature-settings: "palt", "kern"` と `font-kerning: normal` を適用。参照画像を512px幅へ正規化して文字列の実測幅を合わせ、`letter-spacing: 0.26em` と視覚中心の補正を設定した。
- [P2 → fixed] サブタイトルのウェイトを `800` から `700` へ下げ、参照画像の細さに合わせた。位置・字間・中央位置は維持した。
- [P2 → fixed] ポートフォリオ見出しをカード幅の5%へ縮小し、QRコードのサイズは維持。QR下端からURLまでの余白をカード幅の3%へ広げ、参照画像と同じ間隔に調整した。

### 最終確認

- Fonts and typography: 役割・氏名・英字名・メニューを個別にサイズ、太さ、行高、字間で調整。OSのフォントレンダリングによる細部のアンチエイリアス差のみで、折返し・切れはない。
- Spacing and layout rhythm: イラストはカード幅の36%で中央配置。役割、氏名、英字名は参照と同じ縦順・中央揃えで、下部の波とナビに干渉しない。
- Colors and visual tokens: 青い紙目、白い紙面、黄色のイラスト背景、選択中ボタンのグレーは参照素材・既存トークンを保持した。
- Image quality and asset fidelity: タイトル画像、プロフィールイラスト、紙目、波形は既存の実画像／Figma書き出し素材をそのまま使用。代替のCSSアートやプレースホルダーはない。
- Copy and content: 表記は参照に合わせて `SALTY LEMON` に変更。操作ラベルとアクセシブルな代替テキストは維持した。
- States and accessibility: プロフィール／ポートフォリオ切替、保存・シェア、キーボードフォーカス、動きを抑える設定をE2Eで確認。ボタンは表示領域内に収まる。

### 実装チェックリスト

- [x] 添付画像と同一の2:3カード比率で比較
- [x] イラスト・役割・氏名・英字名の順、位置、幅を検証
- [x] 下部ナビの文字幅と余白を確認
- [x] Chromium・Firefox・WebKitのE2E、品質検査、本番ビルドを実行

final result: passed

## 2026-09-23 — カルーセル表示と下部ナビ

- 名刺内に、操作対象ではない2ページ位置インジケーターを追加。プロフィール時は右向き、ポートフォリオ時は左向きで、現在ページを黄色で表示。
- 名刺外にプロフィール／ポートフォリオ／保存・シェアの3ボタンを分離。各ボタンはアイコンを上、ラベルを下に配置し、現在ページをグレーで強調。
- 名刺本体は縦横比2:3を維持し、下部ナビの幅を名刺幅に同期。短い画面でも名刺とナビが縦に収まるよう高さ制約を調整。
- カード領域の横スワイプでプロフィールとポートフォリオを切り替え。リンクやボタン上のドラッグはページ切替に使わない。
- Chromiumの横スワイプ検証、位置インジケーターの非操作属性、320×568／844×390の配置検証を追加し、対象テストは合格。
- 位置確認矢印は、現在ページを示す黄色側を4.8cqwへ拡大し、矢印全体を下部波形内で上方向へ6%位置に調整。

## 2026-09-24 — Figmaメニュー更新と反転モーション

### 比較対象

- Source visual truth: `C:\Users\beefs\Downloads\Frame 3_icon_button.png`（通常）および `C:\Users\beefs\Downloads\Frame 3_icon_button_reverse.png`（反転）。
- Figma browser frames: `Frame 3_icon_button`（`1550:272`）および `Frame 3_icon_button_reverse`（`1556:263`）、file key `wBIQdELnH2eoJJGGV077V4`。Figma MCPの取得上限に達したため、Chrome上のFigmaで確認した。
- Implementation: ローカルChromeプレビュー `http://127.0.0.1:5173/digital-business-card/`。通常プロフィール、反転プロフィール、通常ポートフォリオ、反転ポートフォリオの各状態を目視。ブラウザー画像はツール上で確認し、画像ファイルとしては保存していない。

### 変更と確認

- Figmaのプロフィール／ポートフォリオ／保存・シェア／反転の各アイコンを書き出し、4項目ナビとアイコン周囲の選択表示を実装。
- 反転はカード面を平面上で180度、`720ms`・`cubic-bezier(0.42, 0, 0.58, 1)` で回転（3D反転や鏡映なし）。ナビとページ矢印はカード外に保ち、正位置のまま表示。プロフィール／ポートフォリオを選ぶと通常向きへ戻る。動きを抑えるOS設定では既存の共通ルールにより即時に近い切替。
- ページ位置矢印は選択中の黄色サイズを維持し、非選択の黒矢印を `0.65em` に縮小。添付カンプとChromeプレビューで見た目を確認。
- メニューの選択背景を小さく透明な円からグレーの円へ `320ms` でフェード、`420ms` で拡大するようにし、押下時の縮小も `260ms` のイージングに調整。Chromeでプロフィール／反転の選択切替を確認。

## 2026-09-25 — 下部メニューをフッター化

- 4項目メニューをカードの直後に続く通常フローから分離し、画面下端のフッターとして扱うレイアウトに変更。カードとページ位置インジケーターはフッターの上に配置する。
- フッター背景を画面幅いっぱいにし、上端の境界線と薄い影でコンテンツ領域から分ける。下端は端末の安全領域を考慮する。
- Chromeのローカルプレビューで、画面最下部への配置、4項目の表示、カード／ページ矢印との非重複を目視確認。短い画面ではコンテンツをスクロール可能にする。
- Chromeで反転のON/OFF、ポートフォリオとの相互切替、反転選択の表示を確認。`npm run build` 成功。500kB超のバンドルサイズ注意は表示されたが、ビルドは完了。

final result: passed

## 2026-09-25 — コピーライトをFigmaへ反映

- `Frame 3_icon_button`（`1550:272`）と `Frame 3_icon_button_reverse`（`1556:263`）に `© 2026 SOUR＆SOUR` を追加。両フレームで検索結果が2件となることを確認。
- Noto Sans JP Medium、20px、白、文字間隔2%に統一。通常版は下端の青い領域内に配置し、反転版はカードの回転に合わせて上端に180°回転して配置。
- Figma MCPの呼び出し上限により、Chrome上のFigmaで編集と目視確認を実施。

## 2026-09-25 — 趣味をプロフィールとFigmaへ反映

- 名前・英字表記の下に程よい間隔を取り、下部波形の手前に「趣味：ふらふら遠出」を配置。設定値を共通化し、保存用画像にも反映。
- 通常版・反転版の両Figmaフレームへ趣味テキストを追加。反転版はカードの向きに合わせて文字も180°回転。
- 添付カンプに合わせ、名前→英字表記→趣味の順へ変更。アプリでは趣味を下部波形の手前に配置し、コピーライトとの間に余白を確保。`npm run build` 成功。
- Figma MCP上限のため、Chrome経由でフレームを編集・確認。

## 2026-09-25 — 趣味テキストの下端クリップを修正

- 趣味テキストに明示的な行高と下側の余白を設定し、字形の下端が欠けないように調整。プロフィール表示と保存用カードの両方へ適用。
- Figmaの通常版・反転版はテキスト枠を高さ自動調整、行間150%に変更。通常版は波形との重なりを避けるため少し上へ移動。

## 2026-09-26 — プロフィール／ポートフォリオの2ページPDF

### 比較対象と正規化

- Source visual truth: `C:\Users\beefs\AppData\Local\Temp\codex-clipboard-044b4aca-3e8c-4121-a854-e9d8f4ef675b.png`。プロフィール面とポートフォリオ面の2枚を、それぞれ286×430px相当（2:3）で切り出して比較。
- Implementation: `C:\Users\beefs\Downloads\non-business-card (2).pdf`。PDFは2ページ、各ページは1365.33×2048pt（2:3）。Chromiumで実際に保存されたファイルをPopplerで各800×1200pxにレンダリング。
- Full and focused comparison: `C:\Users\beefs\Documents\Codex\2026-09-26\new-chat\work\pdf-pair-comparison.png`。上段がプロフィール、下段がポートフォリオ。各段で左が添付参照、右がPDFページ。

### 比較履歴

- [P1 → fixed] 先行のPDFはプロフィールのみの1ページだった。添付を確認し直し、PDFをプロフィール→ポートフォリオの2ページに変更。
- [P1 → fixed] プロフィール面のフッターにポートフォリオURLとQRを置いていたが、今回の参照ではプロフィール面はコピーライトのみ。URLとQRをポートフォリオ面に集約。
- [P1 → fixed] ポートフォリオ面は見出し・中央QR・URLを縦に並べ、上部タイトル、上下の波形、紙目、コピーライトをプロフィール面と統一。
- PDFの説明を2ページ構成へ更新し、保存後の成功表示はjsPDFの保存Promiseを待ってから出す。

### 最終確認

- Fonts and typography: 肩書き・氏名・英字名、ポートフォリオ見出し・URLの大きさ、行間、中央揃えを参照と照合。文字の欠けや折返しなし。
- Spacing and layout rhythm: 2ページとも2:3。プロフィールはイラストから英字名までの順序を維持し、ポートフォリオは見出し→QR→URL。本文と下部波形は重ならない。
- Colors and visual tokens: 青い上下波形、白い紙面、黄色のイラスト背景、紙目、黒文字を参照と照合。
- Image quality and asset fidelity: 既存タイトル画像、プロフィールイラスト、QR、波形、紙目を使用。QRはポートフォリオURLを値として生成。
- Copy and content: プロフィール／ポートフォリオを1ページずつ、プロフィール側はコピーライトのみ、ポートフォリオ側にURLとQRを配置。
- States and accessibility: アプリ内のPDF保存操作で実ファイルがDownloadsに作成され、2ページとして開けることを確認。E2EのPDF期待ページ数を2へ更新。E2E自体は未実行。

### 実装チェックリスト

- [x] 添付の2枚を同一比較画像にまとめて照合
- [x] PDFの2ページ、各ページ比率、ページ順を確認
- [x] ダウンロード先 `C:\Users\beefs\Downloads\non-business-card (2).pdf` を実ファイルで確認
- [x] `npm run build` 成功（500kB超チャンクの既存注意あり）
- [ ] E2Eテストは未実行

final result: passed

## 2026-09-26 — PDF見出しサブタイトルの文字サイズ

### 比較対象と正規化

- Source visual truth: `C:\Users\beefs\AppData\Local\Temp\codex-clipboard-044b4aca-3e8c-4121-a854-e9d8f4ef675b.png`（761×511px）。プロフィール面の286×430px領域を比較対象とした。
- Implementation: `C:\Users\beefs\Downloads\non-business-card (3).pdf` の1ページ目。PDFの各ページは1365.33×2048pt、レンダリングは800×1200px。参照・実装ともに2:3で、比較時にカード領域を286×430pxへ正規化。deviceScaleFactorは対象外（PDFページのラスター画像）。
- State: PDFのプロフィール面・ポートフォリオ面。重点対象は両ページ上部の `ただの、自己紹介。`。
- Full-view comparison: `C:\Users\beefs\Documents\Codex\2026-09-26\new-chat\work\pdf-pair-fontsize-comparison.png`。各段で左が参照、右がPDFページ。
- Focused comparison: `C:\Users\beefs\Documents\Codex\2026-09-26\new-chat\work\subtitle-size-after.png`。上部のタイトルとサブタイトルを拡大して比較。

### 比較履歴

- [P2 → fixed] 初回比較では実装のサブタイトルが参照より大きく、カード幅に対する可視文字列幅も広かった。参照の文字領域は約97×11px（286×430pxのカード内）、47px設定の実装は正規化前に約329×35px（800×1200px内）。
- `src/figma-visible-layers.css` と `src/styles.css` の保存カード見出しを40pxへ統一。再出力後は約281×30pxとなり、カード比で参照の文字サイズ・幅に近づいた。再比較画像で上下位置、中央揃え、行の収まりも確認。

### 最終確認

- Fonts and typography: 40px、ウェイト800、既存の字間を維持。参照と同じカード比へ縮尺を揃え、サイズと文字列幅を目視・画素範囲で照合。切れや折返しなし。
- Spacing and layout rhythm: 見出しの位置は保持し、プロフィール／ポートフォリオ各ページの中央配置を維持。
- Colors and visual tokens: 青いヘッダーと白いサブタイトルの配色を維持。
- Image quality and asset fidelity: タイトル素材、波形、紙目、イラストは変更なし。
- Copy and content: `ただの、自己紹介。` の表記を維持。

### 実装チェックリスト

- [x] 参照・実装を同じ2:3カード比に正規化
- [x] 全体比較とサブタイトル拡大比較を同一ターンで確認
- [x] 2ページPDFを更新し、2ページ構成を維持
- [x] `npm run build` と `git diff --check` 成功

final result: passed
