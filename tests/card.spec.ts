import { type Download, expect, test } from '@playwright/test';
import jsQR from 'jsqr';
import { PDFDocument } from 'pdf-lib';
import { PNG } from 'pngjs';

const publicCardUrl = 'https://kayama-k.github.io/digital-business-card/';
const portfolioUrl = 'https://spicysugar.studio.site';

async function readDownload(download: Download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('ダウンロード内容を読み取れませんでした。');

  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function decodeQrDataUrl(dataUrl: string) {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('QRコード画像の形式が不正です。');

  const png = PNG.sync.read(Buffer.from(base64, 'base64'));
  const pixels = new Uint8ClampedArray(
    png.data.buffer,
    png.data.byteOffset,
    png.data.byteLength,
  );
  return jsQR(pixels, png.width, png.height)?.data;
}

test('プロフィールを初期表示する', async ({ page }) => {
  await page.goto('./');

  await expect(
    page.getByRole('heading', { name: 'しおれもん@長野' }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'しおれもん@長野のプロフィールイラスト' }),
  ).toBeVisible();
});

test('ポートフォリオのリンクとQRコードを表示する', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'ポートフォリオ' }).click();

  await expect(page.getByRole('heading', { name: 'PORTFOLIO' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /spicysugar\.studio\.site/ }),
  ).toHaveAttribute('href', portfolioUrl);
  const qrCode = page.getByRole('img', {
    name: 'ポートフォリオへ移動するQRコード',
  });
  await expect(qrCode).toHaveAttribute('src', /^data:image\/png/);
  await expect
    .poll(async () => decodeQrDataUrl((await qrCode.getAttribute('src')) ?? ''))
    .toBe(portfolioUrl);
});

test('保存・シェアシートをEscで閉じ、操作元へフォーカスを戻す', async ({
  page,
}) => {
  await page.goto('./');
  const shareButton = page.getByRole('button', { name: '保存・シェア' });
  await shareButton.click();

  await expect(
    page.getByRole('dialog', { name: '保存・シェア' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'PNGで保存' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(shareButton).toBeFocused();
});

test('Web Shareが使えない場合は公開URLをコピーする', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'share', {
      configurable: true,
      value: undefined,
    });
  });

  await page.goto('./');
  await page.getByRole('button', { name: '保存・シェア' }).click();
  await page.getByRole('button', { name: 'URLをシェア' }).click();

  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(publicCardUrl);
});

for (const action of [
  { button: 'PNGで保存', filename: 'non-business-card.png', format: 'png' },
  { button: 'PDFで保存', filename: 'non-business-card.pdf', format: 'pdf' },
]) {
  test(`${action.button}でダウンロードを開始する`, async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: '保存・シェア' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: action.button }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(action.filename);
    const content = await readDownload(download);

    if (action.format === 'png') {
      const image = PNG.sync.read(content);
      expect(image.width).toBe(1024);
      expect(image.height).toBe(1536);
      return;
    }

    const pdf = await PDFDocument.load(content);
    expect(pdf.getPageCount()).toBe(1);
    const { width, height } = pdf.getPage(0).getSize();
    expect(width / height).toBeCloseTo(2 / 3, 4);
  });
}
