import { cardConfig } from '../config/card';

type WaveProps = {
  active: boolean;
  edge: 'top' | 'bottom';
};

export function Wave({ active, edge }: WaveProps) {
  const waveClass = `wave wave--${edge}${active ? ' wave--active' : ''}`;
  const amplitude = cardConfig.animation.waveAmplitude;

  return (
    <svg
      aria-hidden="true"
      className={waveClass}
      viewBox="0 0 1440 180"
      preserveAspectRatio="none"
      style={
        {
          '--wave-duration': `${cardConfig.animation.waveDurationMs}ms`,
          '--wave-amplitude': amplitude,
        } as React.CSSProperties
      }
    >
      <path
        className="wave__shadow"
        d="M0 82 C180 28 320 144 518 86 S856 22 1080 91 S1280 135 1440 74 V180 H0Z"
      />
      <path
        className="wave__body"
        d="M0 67 C180 13 320 129 518 71 S856 7 1080 76 S1280 120 1440 59 V180 H0Z"
      />
    </svg>
  );
}
