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
  person: {
    name: 'しおれもん@長野',
    reading: 'SALTY / LEMON',
    role: 'デザインを学ぶビギナー',
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
  assets: {
    profileIllustration: assetUrl('images/profile.png'),
    outlinedTitle: assetUrl('images/image_title.svg'),
    paperTexture: assetUrl('images/paper-texture.jpg'),
  },
  animation: {
    waveDurationMs: 1300,
    waveAmplitude: 19,
    waveDecay: 'long',
    easing: 'cubic-bezier(0.45, 0, 0.15, 1)',
    pageDurationMs: 540,
    start: 'simultaneous',
  },
} as const;

export type CardConfig = typeof cardConfig;
