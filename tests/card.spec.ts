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

test('プロフィールは参照レイアウトの順でイラストとテキストを配置する', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Figma参照の512px幅で位置を確認する。');

  await page.setViewportSize({ width: 512, height: 824 });
  await page.goto('./');
  const layout = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      if (!rect) throw new Error(`${selector} が見つかりません。`);
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    };
    return {
      card: bounds('.business-card'),
      subtitle: bounds('.brand-header > div'),
      illustration: bounds('.profile-page__art img'),
      name: bounds('.profile-page h2'),
      reading: bounds('.profile-page__reading'),
      role: bounds('.profile-page > .eyebrow'),
      viewport: bounds('.card-viewport'),
    };
  });

  expect(layout.illustration.width / layout.card.width).toBeCloseTo(0.36, 2);
  expect(layout.subtitle.width / layout.card.width).toBeCloseTo(693 / 1024, 3);
  expect(layout.subtitle.left + layout.subtitle.right).toBeCloseTo(
    layout.card.left + layout.card.right,
    0,
  );
  expect(layout.illustration.left + layout.illustration.right).toBeCloseTo(
    layout.card.left + layout.card.right,
    0,
  );
  expect(layout.role.top).toBeGreaterThan(layout.illustration.bottom);
  expect(layout.name.top).toBeGreaterThan(layout.role.bottom);
  expect(layout.reading.top).toBeGreaterThan(layout.name.bottom);
  expect(layout.reading.bottom).toBeLessThanOrEqual(layout.viewport.bottom);
  expect(layout.name.left + layout.name.right).toBeCloseTo(
    layout.card.left + layout.card.right,
    0,
  );
  const nameTypography = await page
    .locator('.profile-page h2')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        featureSettings: style.fontFeatureSettings,
        fontKerning: style.fontKerning,
        fontSize: Number.parseFloat(style.fontSize),
        letterSpacing: Number.parseFloat(style.letterSpacing),
      };
    });
  expect(nameTypography.featureSettings).toContain('palt');
  expect(nameTypography.featureSettings).toContain('kern');
  expect(nameTypography.fontKerning).toBe('normal');
  expect(nameTypography.letterSpacing / nameTypography.fontSize).toBeCloseTo(
    0.04,
    2,
  );
  await expect(
    page.locator('.card-viewport .profile-page__reading'),
  ).toHaveText('SALTY LEMON');
  const subtitleTypography = await page
    .locator('.brand-header__subtitle')
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        featureSettings: style.fontFeatureSettings,
        fontKerning: style.fontKerning,
        fontWeight: style.fontWeight,
        letterSpacing: Number.parseFloat(style.letterSpacing),
        left: Number.parseFloat(style.left),
        fontSize: Number.parseFloat(style.fontSize),
        text: element.textContent,
      };
    });
  expect(subtitleTypography.text).toBe('ただの、自己紹介。');
  expect(subtitleTypography.featureSettings).toContain('palt');
  expect(subtitleTypography.featureSettings).toContain('kern');
  expect(subtitleTypography.fontKerning).toBe('normal');
  expect(subtitleTypography.fontWeight).toBe('700');
  expect(
    subtitleTypography.letterSpacing / subtitleTypography.fontSize,
  ).toBeCloseTo(0.26, 2);
  expect(subtitleTypography.left / layout.card.width).toBeCloseTo(0.0065, 2);
});

test('すべての画面で紙の名刺らしい2:3比率を保つ', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Pixel 5 の実機相当設定で確認する。');

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('./');
    const card = await page.locator('.business-card').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      };
    });
    expect(card.width / card.height).toBeCloseTo(2 / 3, 2);
    expect(card.left + card.right).toBeCloseTo(viewport.width, 0);
    const nav = await page.locator('.app-nav').evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { bottom: rect.bottom, top: rect.top, width: rect.width };
    });
    expect(nav.width).toBeCloseTo(viewport.width, 0);
    expect(card.bottom).toBeLessThanOrEqual(nav.top);
    expect(nav.bottom).toBeLessThanOrEqual(viewport.height);
  }
});

test('名刺は横スワイプで切り替わり、ページ位置インジケーターは操作対象にならない', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', '横スワイプの実機相当設定で確認する。');

  await page.goto('./');
  const viewport = page.locator('.card-viewport');
  const bounds = await viewport.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds) throw new Error('カルーセル領域の座標を取得できませんでした。');
  await expect(page.locator('.carousel-indicator')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await page.mouse.move(
    bounds.x + bounds.width * 0.72,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width * 0.6,
    bounds.y + bounds.height / 2,
  );
  expect(
    await viewport
      .locator('.card-track')
      .last()
      .evaluate((element) => getComputedStyle(element).transform),
  ).not.toBe('none');
  await page.mouse.move(
    bounds.x + bounds.width * 0.2,
    bounds.y + bounds.height / 2,
    {
      steps: 6,
    },
  );
  await page.mouse.up();
  await expect(page.locator('.portfolio-page')).toBeVisible();
  await expect(page.locator('.carousel-indicator__item.is-current')).toHaveText(
    '◀',
  );
});

test('表示中のbase背景とFigmaの上下波形を使う', async ({ page }) => {
  await page.goto('./');

  const card = page.locator('.business-card');
  await expect(card).toHaveCSS('background-image', /images\/base\.png/);
  const waves = card.locator('svg.wave');
  await expect(waves).toHaveCount(2);
  await expect(waves.nth(0)).toHaveAttribute(
    'data-figma-path',
    /^M600\.726 311\.443/,
  );
  await expect(waves.nth(1)).toHaveAttribute(
    'data-figma-path',
    /^M369\.294 175\.807/,
  );
  await expect(waves.locator('clipPath .wave__clip')).toHaveCount(2);
  await expect(waves.locator('.wave__paper')).toHaveCount(0);
  expect(
    await waves.evaluateAll((elements) =>
      elements.every(
        (element) =>
          element.getAttribute('data-wave-interpolation') === 'cubic-hermite',
      ),
    ),
  ).toBe(true);
  const blueBodies = waves.locator('.wave__body');
  await expect(blueBodies).toHaveCount(2);
  expect(
    await blueBodies.evaluateAll((elements) =>
      elements.every((element) =>
        /^url\(#.+-clip\)$/.test(element.getAttribute('clip-path') ?? ''),
      ),
    ),
  ).toBe(true);
});

test('画面切替では旧画面と新画面が指定方向へ同時に動き、波は1回で止まる', async ({
  page,
}) => {
  await page.goto('./');

  for (const step of [
    {
      button: 'ポートフォリオ',
      leaving: 'card-exit-left',
      entering: 'card-enter-right',
      exitTransform: '-100%',
      entryTransform: '100%',
    },
    {
      button: 'プロフィール',
      leaving: 'card-exit-right',
      entering: 'card-enter-left',
      exitTransform: '100%',
      entryTransform: '-100%',
    },
  ]) {
    const button = page.getByRole('button', { name: step.button });
    await button.evaluate(() => {
      delete document.documentElement.dataset.motionSnapshot;
      const card = document.querySelector('.business-card');
      if (!card) throw new Error('名刺が見つかりません。');
      const observer = new MutationObserver(() => {
        const leaving = card.querySelector<HTMLElement>('.card-track--leaving');
        const entering = card.querySelector<HTMLElement>(
          '.card-track--entering',
        );
        const wave = card.querySelector<SVGSVGElement>('.wave--active');
        if (!leaving || !entering || !wave) return;
        const exitEffect = leaving.getAnimations()[0]?.effect;
        const entryEffect = entering.getAnimations()[0]?.effect;
        document.documentElement.dataset.motionSnapshot = JSON.stringify({
          leavingName: getComputedStyle(leaving).animationName,
          enteringName: getComputedStyle(entering).animationName,
          pageDuration: getComputedStyle(leaving).animationDuration,
          exitTransform:
            exitEffect instanceof KeyframeEffect
              ? exitEffect.getKeyframes().at(-1)?.transform
              : null,
          entryTransform:
            entryEffect instanceof KeyframeEffect
              ? entryEffect.getKeyframes()[0]?.transform
              : null,
          waveCount: card.querySelectorAll('.wave--active').length,
          waveDuration: wave.dataset.waveDuration,
          waveIterations: wave.dataset.waveIterations,
          waveMode: wave.dataset.waveMode,
        });
        observer.disconnect();
      });
      observer.observe(card, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    });
    await button.click();
    await page.waitForFunction(() =>
      Boolean(document.documentElement.dataset.motionSnapshot),
    );
    const snapshot = await page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.motionSnapshot ?? '{}'),
    );
    expect(snapshot.leavingName).toBe(step.leaving);
    expect(snapshot.enteringName).toBe(step.entering);
    expect(snapshot.pageDuration).toBe('0.42s');
    expect(snapshot.exitTransform).toContain(step.exitTransform);
    expect(snapshot.entryTransform).toContain(step.entryTransform);
    expect(snapshot.waveCount).toBe(2);
    expect(snapshot.waveDuration).toBe('1300ms');
    expect(snapshot.waveIterations).toBe('1');
    expect(snapshot.waveMode).toBe('curve');

    const leaving = page.locator('.card-track--leaving');
    const waves = page.locator('.business-card > .wave--active');
    await expect(leaving).toHaveCount(0);
    await expect(waves).toHaveCount(0);
  }

  await page.getByRole('button', { name: '保存・シェア' }).click();
  await expect(page.locator('.business-card > .wave--active')).toHaveCount(0);
});

test('ポートフォリオ遷移中にQRを作り直さない', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.export-card__portfolio-qr')).toHaveAttribute(
    'src',
    /^data:image\/png/,
  );
  await page.evaluate(() => {
    const viewport = document.querySelector('.card-viewport');
    if (!viewport) throw new Error('画面領域が見つかりません。');
    const observer = new MutationObserver(() => {
      const qr = viewport.querySelector<HTMLImageElement>('.qr-code');
      if (qr && viewport.querySelector('.card-track--entering')) {
        qr.dataset.persisted = 'true';
      }
      if (viewport.querySelector('.qr-placeholder')) {
        document.documentElement.dataset.qrPlaceholderSeen = 'true';
      }
    });
    observer.observe(viewport, { subtree: true, childList: true });
  });

  await page.getByRole('button', { name: 'ポートフォリオ' }).click();
  await expect(page.locator('.card-track--entering')).toHaveCount(0);
  await expect(page.locator('.card-viewport .qr-code')).toHaveAttribute(
    'data-persisted',
    'true',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.dataset.qrPlaceholderSeen,
    ),
  ).toBeUndefined();
});

test('動きを抑える設定と保存・シェア表示で波は動かない', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.getByRole('button', { name: 'ポートフォリオ' }).click();
  await expect(page.locator('.card-track')).toHaveCount(1);
  await expect(page.locator('.business-card > .wave--active')).toHaveCount(0);

  await page.getByRole('button', { name: '保存・シェア' }).click();
  await expect(
    page.getByRole('dialog', { name: '保存・シェア' }),
  ).toBeVisible();
  await expect(page.locator('.business-card > .wave--active')).toHaveCount(0);
});

test('波の余韻中も次の画面切替を受け付け、波を再始動する', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'ポートフォリオ' }).click();
  await expect(page.locator('.card-track--entering')).toHaveCount(0);

  const waves = page.locator('.business-card > .wave--active');
  await expect(waves).toHaveCount(2);
  await expect(waves.nth(0)).toHaveAttribute('data-wave-run', '1');

  await page.getByRole('button', { name: 'プロフィール' }).click();
  await expect(page.locator('.card-track--entering')).toHaveCount(1);
  await expect(waves.nth(0)).toHaveAttribute('data-wave-run', '2');
  await expect(page.locator('.card-track--entering')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'しおれもん@長野' }),
  ).toBeVisible();
});

test('ポートフォリオのリンクとQRコードを表示する', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'ポートフォリオ' }).click();

  await expect(
    page.getByRole('heading', { name: 'ポートフォリオ' }),
  ).toBeVisible();
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

  const portfolioLayout = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      if (!rect) throw new Error(`${selector} が見つかりません。`);
      return { bottom: rect.bottom, top: rect.top, width: rect.width };
    };
    const heading = document.querySelector('.portfolio-page > h2');
    if (!heading) throw new Error('ポートフォリオ見出しが見つかりません。');
    return {
      card: bounds('.business-card'),
      headingFontSize: Number.parseFloat(getComputedStyle(heading).fontSize),
      heading: bounds('.portfolio-page > h2'),
      qr: bounds('.qr-frame'),
      link: bounds('.portfolio-link'),
    };
  });
  expect(
    portfolioLayout.headingFontSize / portfolioLayout.card.width,
  ).toBeCloseTo(0.05, 2);
  expect(
    (portfolioLayout.link.top - portfolioLayout.qr.bottom) /
      portfolioLayout.card.width,
  ).toBeCloseTo(0.03, 2);
});

test('保存・シェアシートをEscで閉じ、操作元へフォーカスを戻す', async ({
  page,
}) => {
  await page.goto('./');
  const shareButton = page.getByRole('button', {
    name: '保存・シェア',
    exact: true,
  });
  await shareButton.click();

  await expect(
    page.getByRole('dialog', { name: '保存・シェア' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'PNGで保存' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(shareButton).toBeFocused();
});

test('保存・シェアシートは本体を下へスワイプして閉じられる', async ({
  page,
}) => {
  await page.goto('./');
  const shareButton = page.getByRole('button', {
    name: '保存・シェア',
    exact: true,
  });
  await shareButton.click();

  await page.waitForFunction(() => {
    const sheet = document.querySelector('.share-sheet');
    return Boolean(
      sheet
        ?.getAnimations()
        .every((animation) =>
          ['finished', 'idle'].includes(animation.playState),
        ),
    );
  });
  const dragTarget = page.getByRole('button', { name: 'PNGで保存' });
  const bounds = await dragTarget.boundingBox();
  expect(bounds).not.toBeNull();
  if (!bounds)
    throw new Error('保存・シェア操作の座標を取得できませんでした。');

  const startX = bounds.x + bounds.width / 2;
  const startY = bounds.y + bounds.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + 80, {
    steps: 3,
  });
  await page.mouse.up();

  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(shareButton).toBeFocused();
});

test('URLをシェアすると共有画面を開かず名刺URLのQRコードを表示する', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        document.documentElement.dataset.nativeShareCalled = 'true';
      },
    });
  });

  await page.goto('./');
  const dialog = page.getByRole('dialog', { name: '保存・シェア' });
  await page.getByRole('button', { name: '保存・シェア' }).click();
  await dialog.getByRole('button', { name: 'URLをシェア' }).click();

  expect(
    await page.evaluate(
      () => document.documentElement.dataset.nativeShareCalled,
    ),
  ).toBeUndefined();
  await expect(dialog.getByRole('heading', { name: '名刺URL' })).toBeVisible();
  const qrCode = dialog.getByRole('img', { name: '名刺URLのQRコード' });
  await expect(qrCode).toHaveAttribute('src', /^data:image\/png/);
  await expect
    .poll(async () => decodeQrDataUrl((await qrCode.getAttribute('src')) ?? ''))
    .toBe(publicCardUrl);
  await expect(dialog.getByText(publicCardUrl, { exact: true })).toBeVisible();
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
      const top = image.data.subarray(0, 3);
      const middleIndex = (768 * image.width + 10) * 4;
      const bottomIndex = (1535 * image.width + 10) * 4;
      expect(top[0]).toBeGreaterThan(20);
      expect(top[2]).toBeGreaterThan(100);
      expect(image.data[middleIndex]).toBeGreaterThan(200);
      expect(image.data[middleIndex + 1]).toBeGreaterThan(200);
      expect(image.data[bottomIndex + 2]).toBeGreaterThan(100);
      return;
    }

    const pdf = await PDFDocument.load(content);
    expect(pdf.getPageCount()).toBe(2);
    for (const page of pdf.getPages()) {
      const { width, height } = page.getSize();
      expect(width / height).toBeCloseTo(2 / 3, 4);
    }
  });
}
