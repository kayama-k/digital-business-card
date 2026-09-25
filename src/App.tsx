import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CardContent, type CardView } from './components/CardContent';
import { ExportCard } from './components/ExportCard';
import { type ShareAction, ShareSheet } from './components/ShareSheet';
import { Wave } from './components/Wave';
import { cardConfig } from './config/card';

const download = (href: string, filename: string) => {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
};

export default function App() {
  const [view, setView] = useState<CardView>('profile');
  const [transition, setTransition] = useState<{
    from: CardView;
    to: CardView;
  } | null>(null);
  const [waveActive, setWaveActive] = useState(false);
  const [waveRun, setWaveRun] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const exportRef = useRef<HTMLElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const pageTimerRef = useRef<number | undefined>(undefined);
  const waveTimerRef = useRef<number | undefined>(undefined);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(pageTimerRef.current);
      window.clearTimeout(waveTimerRef.current);
    },
    [],
  );

  const setCardView = (nextView: CardView) => {
    if (nextView === view || transition) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setView(nextView);
      return;
    }

    window.clearTimeout(pageTimerRef.current);
    window.clearTimeout(waveTimerRef.current);
    setTransition({ from: view, to: nextView });
    setWaveActive(true);
    setWaveRun((currentRun) => currentRun + 1);
    pageTimerRef.current = window.setTimeout(() => {
      setView(nextView);
      setTransition(null);
    }, cardConfig.animation.start.pageDelayMs +
      cardConfig.animation.pageDurationMs);
    waveTimerRef.current = window.setTimeout(
      () => setWaveActive(false),
      cardConfig.animation.start.waveDelayMs +
        cardConfig.animation.waveDurationMs,
    );
  };

  const selectedView = transition?.to ?? view;
  const pageLabel =
    selectedView === 'profile' ? 'プロフィール 1 / 2' : 'ポートフォリオ 2 / 2';

  const handleSwipeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      (event.target as HTMLElement).closest('a,button,input,textarea,select')
    ) {
      swipeStartRef.current = null;
      return;
    }
    swipeStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handleSwipeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || transition) return;
    if ((event.target as HTMLElement).closest('a,button,input,textarea,select'))
      return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 28 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25)
      return;
    setCardView(deltaX < 0 ? 'portfolio' : 'profile');
  };

  const renderExport = useCallback(async () => {
    if (!exportRef.current)
      throw new Error('保存用カードを準備できませんでした。');
    return toPng(exportRef.current, {
      cacheBust: true,
      width: 1024,
      height: 1536,
      pixelRatio: 1,
    });
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3400);
  };

  const onShareAction = async (action: ShareAction) => {
    try {
      if (action === 'png') {
        download(cardConfig.preparedPng, 'non-business-card.png');
        showNotice('PNGを保存しました。');
      }
      if (action === 'pdf') {
        const image = await renderExport();
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [1024, 1536],
        });
        pdf.addImage(image, 'PNG', 0, 0, 1024, 1536);
        pdf.save('non-business-card.pdf');
        showNotice('PDFを保存しました。');
      }
      if (action === 'share') {
        if (navigator.share) {
          await navigator.share({
            title: cardConfig.title,
            text: 'ただの、自己紹介。',
            url: cardConfig.urls.publicCard,
          });
          showNotice('共有しました。');
        } else {
          await navigator.clipboard.writeText(cardConfig.urls.publicCard);
          showNotice('共有機能がないため、リンクをコピーしました。');
        }
      }
      if (action === 'copy') {
        await navigator.clipboard.writeText(cardConfig.urls.publicCard);
        showNotice('リンクをコピーしました。');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      showNotice('操作を完了できませんでした。もう一度お試しください。');
    }
  };

  return (
    <main className="app-shell">
      <article
        className={`business-card business-card--${view}`}
        style={
          {
            '--page-duration': `${cardConfig.animation.pageDurationMs}ms`,
            '--page-delay': `${cardConfig.animation.start.pageDelayMs}ms`,
            '--page-easing': cardConfig.animation.easing,
            '--paper-texture': `url(${cardConfig.assets.paperTexture})`,
          } as React.CSSProperties
        }
      >
        <header className="brand-header">
          <img src={cardConfig.assets.outlinedTitle} alt={cardConfig.title} />
          <div>
            <p className="brand-header__kicker">A LITTLE HELLO</p>
            <p className="brand-header__subtitle">
              {cardConfig.person.message}
            </p>
          </div>
        </header>
        <Wave
          key={`bottom-${waveRun}`}
          active={waveActive}
          edge="bottom"
          run={waveRun}
        />

        <section
          className="card-viewport"
          aria-label="名刺のカルーセル"
          aria-live="polite"
          onPointerDown={handleSwipeStart}
          onPointerUp={handleSwipeEnd}
          onPointerCancel={() => {
            swipeStartRef.current = null;
          }}
        >
          {transition && (
            <div
              key="leaving"
              className={`card-track card-track--leaving card-track--${transition.to === 'portfolio' ? 'left' : 'right'}`}
              aria-hidden="true"
              inert
            >
              <CardContent view={transition.from} />
            </div>
          )}
          <div
            key="current"
            className={`card-track${transition ? ` card-track--entering card-track--${transition.to === 'portfolio' ? 'right' : 'left'}` : ''}`}
          >
            <CardContent view={transition?.to ?? view} />
          </div>
        </section>

        <Wave
          key={`top-${waveRun}`}
          active={waveActive}
          edge="top"
          run={waveRun}
        />
        <div className="carousel-indicator" aria-hidden="true">
          <span
            className={`carousel-indicator__item${selectedView === 'profile' ? ' is-current' : ''}`}
          >
            {selectedView === 'profile' ? '▶' : '◀'}
          </span>
          <span
            className={`carousel-indicator__item${selectedView === 'portfolio' ? ' is-current' : ''}`}
          >
            {selectedView === 'profile' ? '▶' : '◀'}
          </span>
        </div>
      </article>

      <nav className="app-nav" aria-label="名刺のメニュー">
        <button
          type="button"
          className={selectedView === 'profile' ? 'is-current' : ''}
          aria-current={selectedView === 'profile' ? 'page' : undefined}
          onClick={() => setCardView('profile')}
        >
          <span className="app-nav__icon" aria-hidden="true">
            ●
          </span>
          <span className="app-nav__label">プロフィール</span>
        </button>
        <button
          type="button"
          className={selectedView === 'portfolio' ? 'is-current' : ''}
          aria-current={selectedView === 'portfolio' ? 'page' : undefined}
          onClick={() => setCardView('portfolio')}
        >
          <span className="app-nav__icon" aria-hidden="true">
            ↗
          </span>
          <span className="app-nav__label">ポートフォリオ</span>
        </button>
        <button
          type="button"
          ref={shareButtonRef}
          onClick={() => setSheetOpen(true)}
        >
          <span className="app-nav__icon" aria-hidden="true">
            ↓
          </span>
          <span className="app-nav__label">保存・シェア</span>
        </button>
      </nav>
      <p className="sr-only" aria-live="polite">
        {pageLabel}
      </p>

      <div className="export-stage">
        <ExportCard ref={exportRef} />
      </div>
      <ShareSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAction={onShareAction}
        returnFocusRef={shareButtonRef}
      />
      <p className="toast" role="status" aria-live="polite">
        {notice}
      </p>
    </main>
  );
}
