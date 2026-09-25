export type LinkItem = {
  label: string;
  url: string;
  description: string;
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/**
 * 名刺の文言・URL・アニメーション調整値の唯一の参照元。
 * 画像素材は `assets` のパスだけを差し替える。
 */
export const cardConfig = {
  title: 'ノン・ビジネスカード',
  businessName: 'K.K.',
  copyrightYear: new Date().getFullYear(),
  person: {
    name: 'しおれもん@長野',
    reading: 'SALTY LEMON',
    role: 'ビギナー',
    message: 'ただの、自己紹介。',
    location: 'Nagano, Japan',
  },
  urls: {
    publicCard: 'https://kayama-k.github.io/digital-business-card/',
    portfolio: 'https://spicysugar.studio.site',
  },
  links: [
    {
      label: 'Portfolio',
      url: 'https://spicysugar.studio.site',
      description: '制作と活動の記録',
    },
  ] satisfies LinkItem[],
  preparedPng: assetUrl('images/non-business-card.png'),
  assets: {
    profileIllustration: assetUrl('images/profile.png'),
    outlinedTitle: assetUrl('images/image_title.svg'),
    paperTexture: assetUrl('images/base.png'),
    blueTexture: assetUrl('images/base-blue.png'),
    navProfile: assetUrl('images/nav-profile.png'),
    navPortfolio: assetUrl('images/nav-portfolio.png'),
    navSave: assetUrl('images/nav-save.png'),
    navFlip: assetUrl('images/nav-flip.png'),
  },
  animation: {
    waveDurationMs: 1300,
    waveAmplitude: 19,
    // 最後の小さな揺れを最初の揺れの何割残すか。0.21 は長い余韻。
    waveDecay: 0.21,
    // 中間の波形ポイントをつなぐ接線の強さ。小さいほど穏やかに収束する。
    waveCurveTension: 0.55,
    easing: 'cubic-bezier(0.45, 0, 0.15, 1)',
    pageDurationMs: 540,
    flipDurationMs: 720,
    flipEasing: 'cubic-bezier(0.42, 0, 0.58, 1)',
    start: {
      pageDelayMs: 0,
      waveDelayMs: 0,
    },
  },
} as const;

export type CardConfig = typeof cardConfig;
