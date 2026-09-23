import { useEffect, useId, useRef } from 'react';
import { cardConfig } from '../config/card';

type WaveProps = {
  active: boolean;
  edge: 'top' | 'bottom';
  run?: number;
};

type WavePoint = {
  horizontal: number;
  vertical: number;
};

const waveStops = [0, 0.26, 0.58, 0.82, 1] as const;

const upperFigmaPath =
  'M600.726 311.443C1008.21 396.68 1126.62 120.1 1229.79 11.0875L-336.454 -197.209L-133.604 406.493C132.146 176.95 468.596 283.805 600.726 311.443Z';
const lowerFigmaPath =
  'M369.294 175.807C-104.157 109.396 -216.891 448.202 -326 586.576L1483.97 700.037L1202 0C916.74 295.521 522.814 197.341 369.294 175.807Z';

const cubic = (value: number, first: number, second: number) =>
  3 * (1 - value) ** 2 * value * first +
  3 * (1 - value) * value ** 2 * second +
  value ** 3;

function ease(progress: number, easing: string) {
  const values = easing.match(/-?\d*\.?\d+/g)?.map(Number);
  if (values?.length !== 4) return progress;
  const [x1, y1, x2, y2] = values;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 14; index += 1) {
    const middle = (low + high) / 2;
    if (cubic(middle, x1, x2) < progress) low = middle;
    else high = middle;
  }
  return cubic((low + high) / 2, y1, y2);
}

function createTangents(points: WavePoint[], tension: number) {
  return points.map((_point, index) => {
    if (index === 0 || index === points.length - 1) {
      return { horizontal: 0, vertical: 0 };
    }
    const previous = points[index - 1];
    const next = points[index + 1];
    const duration = waveStops[index + 1] - waveStops[index - 1];
    return {
      horizontal:
        ((next.horizontal - previous.horizontal) / duration) * tension,
      vertical: ((next.vertical - previous.vertical) / duration) * tension,
    };
  });
}

function interpolate(
  progress: number,
  points: WavePoint[],
  tangents: WavePoint[],
) {
  const end = waveStops.findIndex((stop) => stop >= progress);
  if (end <= 0) return points[0];
  const start = end - 1;
  const duration = waveStops[end] - waveStops[start];
  const range = (progress - waveStops[start]) / duration;
  const squared = range ** 2;
  const cubed = range ** 3;
  const startWeight = 2 * cubed - 3 * squared + 1;
  const startTangentWeight = cubed - 2 * squared + range;
  const endWeight = -2 * cubed + 3 * squared;
  const endTangentWeight = cubed - squared;
  return {
    horizontal:
      points[start].horizontal * startWeight +
      tangents[start].horizontal * duration * startTangentWeight +
      points[end].horizontal * endWeight +
      tangents[end].horizontal * duration * endTangentWeight,
    vertical:
      points[start].vertical * startWeight +
      tangents[start].vertical * duration * startTangentWeight +
      points[end].vertical * endWeight +
      tangents[end].vertical * duration * endTangentWeight,
  };
}

function bluePath(isUpperWave: boolean, point: WavePoint) {
  const { horizontal, vertical } = point;
  if (isUpperWave) {
    return `M-160 0H1240V11.0875C${1126.62 + horizontal * 0.5} ${120.1 + vertical * 0.35} ${1008.21 - horizontal} ${396.68 + vertical * 0.75} ${600.726 - horizontal * 0.2} ${311.443 + vertical}C${468.596 - horizontal * 0.35} ${283.805 + vertical} ${132.146 + horizontal} ${176.95 + vertical * 0.5} ${-133.604 + horizontal} 406.493L-160 407Z`;
  }
  return `M-340 402H1240L1202 0C${916.74 + horizontal} ${295.521 - vertical * 0.5} ${522.814 - horizontal * 0.35} ${197.341 - vertical} ${369.294 - horizontal * 0.2} ${175.807 - vertical}C${-104.157 - horizontal} ${109.396 - vertical * 0.6} ${-216.891 + horizontal * 0.5} ${448.202 - vertical * 0.4} ${-326 + horizontal} 586.576L-340 402Z`;
}

export function Wave({ active, edge, run = 0 }: WaveProps) {
  const bluePathRef = useRef<SVGPathElement>(null);
  const isUpperWave = edge === 'bottom';
  const waveHeight = isUpperWave ? 407 : 402;
  const patternId = useId().replaceAll(':', '');
  const bluePatternId = `${patternId}-blue`;
  const clipPathId = `${patternId}-clip`;
  const figmaPath = isUpperWave ? upperFigmaPath : lowerFigmaPath;
  const initialPath = bluePath(isUpperWave, { horizontal: 0, vertical: 0 });
  const {
    waveAmplitude,
    waveCurveTension,
    waveDecay,
    waveDurationMs,
    easing,
    start,
  } = cardConfig.animation;

  useEffect(() => {
    const path = bluePathRef.current;
    if (!path) return;
    const setPath = (point: WavePoint) =>
      path.setAttribute('d', bluePath(isUpperWave, point));
    setPath({ horizontal: 0, vertical: 0 });
    if (!active) return;

    const points: WavePoint[] = [
      { horizontal: 0, vertical: 0 },
      { horizontal: -waveAmplitude * 0.64, vertical: waveAmplitude },
      { horizontal: waveAmplitude * 0.53, vertical: -waveAmplitude * 0.53 },
      {
        horizontal: -waveAmplitude * waveDecay * 0.8,
        vertical: waveAmplitude * waveDecay,
      },
      { horizontal: 0, vertical: 0 },
    ];
    const tangents = createTangents(points, waveCurveTension);
    let frameId = 0;
    let startedAt: number | undefined;
    const animate = (now: number) => {
      startedAt ??= now;
      const elapsed = now - startedAt - start.waveDelayMs;
      const progress = Math.min(1, Math.max(0, elapsed / waveDurationMs));
      setPath(interpolate(ease(progress, easing), points, tangents));
      if (progress < 1) frameId = window.requestAnimationFrame(animate);
    };
    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [
    active,
    easing,
    isUpperWave,
    start.waveDelayMs,
    waveAmplitude,
    waveCurveTension,
    waveDecay,
    waveDurationMs,
  ]);

  return (
    <svg
      aria-hidden="true"
      className={`wave wave--${edge}${active ? ' wave--active' : ''}`}
      data-figma-path={figmaPath}
      data-wave-duration={`${waveDurationMs}ms`}
      data-wave-iterations="1"
      data-wave-mode="curve"
      data-wave-interpolation="cubic-hermite"
      data-wave-run={run}
      viewBox={isUpperWave ? '0 0 1024 407' : '0 0 1024 402'}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={bluePatternId}
          patternUnits="userSpaceOnUse"
          width="1024"
          height={waveHeight}
        >
          <image
            href={cardConfig.assets.blueTexture}
            width="1024"
            height="1536"
            y={isUpperWave ? 0 : -1134}
          />
        </pattern>
        <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
          <path ref={bluePathRef} className="wave__clip" d={initialPath} />
        </clipPath>
      </defs>
      <rect
        className="wave__body"
        width="1024"
        height={waveHeight}
        fill={`url(#${bluePatternId})`}
        clipPath={`url(#${clipPathId})`}
      />
    </svg>
  );
}
