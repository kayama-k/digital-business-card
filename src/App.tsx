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
  const [cardFlipped, setCardFlipped] = useState(false);
  const [transition, setTransition] = useState<{
    from: CardView;
    to: CardView;
  } | null>(null);
  const [waveActive, setWaveActive] = useState(false);
  const [waveRun, setWaveRun] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const profileExportRef = useRef<HTMLElement>(null);
  const portfolioExportRef = useRef<HTMLElement>(null);
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
    if (transition) return;
    if (nextView === view) {
      if (cardFlipped) setCardFlipped(false);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setView(nextView);
      setCardFlipped(false);
      return;
    }

    window.clearTimeout(pageTimerRef.current);
    window.clearTimeout(waveTimerRef.current);
    setCardFlipped(false);
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
    `${selectedView === 'profile' ? 'プロフィール 1 / 2' : 'ポートフォリオ 2 / 2'}` +
    `${cardFlipped ? '、名刺を反転中' : ''}`;

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

  const renderExport = useCallback(async (element: HTMLElement | null) => {
    if (!element) throw new Error('保存用カードを準備できませんでした。');
    return toPng(element, {
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
        const profileImage = await renderExport(profileExportRef.current);
        const portfolioImage = await renderExport(portfolioExportRef.current);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [1024, 1536],
        });
        pdf.addImage(profileImage, 'PNG', 0, 0, 1024, 1536);
        pdf.addPage([1024, 1536], 'portrait');
        pdf.addImage(portfolioImage, 'PNG', 0, 0, 1024, 1536);
        await pdf.save('non-business-card.pdf', { returnPromise: true });
        showNotice('PDFを保存しました。');
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
        id="business-card"
        className={`business-card business-card--${view}${cardFlipped ? ' business-card--flipped' : ''}`}
        style={
          {
            '--page-duration': `${cardConfig.animation.pageDurationMs}ms`,
            '--page-delay': `${cardConfig.animation.start.pageDelayMs}ms`,
            '--page-easing': cardConfig.animation.easing,
            '--flip-duration': `${cardConfig.animation.flipDurationMs}ms`,
            '--flip-easing': cardConfig.animation.flipEasing,
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
        <p className="business-card__copyright">
          © {cardConfig.copyrightYear} {cardConfig.businessName}
        </p>
      </article>
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

      <nav className="app-nav" aria-label="名刺のメニュー">
        <button
          type="button"
          className={
            selectedView === 'profile' && !cardFlipped ? 'is-current' : ''
          }
          aria-current={selectedView === 'profile' ? 'page' : undefined}
          onClick={() => setCardView('profile')}
        >
          <span className="app-nav__icon" aria-hidden="true">
            <img src={cardConfig.assets.navProfile} alt="" />
          </span>
          <span className="app-nav__label">プロフィール</span>
        </button>
        <button
          type="button"
          className={
            selectedView === 'portfolio' && !cardFlipped ? 'is-current' : ''
          }
          aria-current={selectedView === 'portfolio' ? 'page' : undefined}
          onClick={() => setCardView('portfolio')}
        >
          <span className="app-nav__icon" aria-hidden="true">
            <img src={cardConfig.assets.navPortfolio} alt="" />
          </span>
          <span className="app-nav__label">ポートフォリオ</span>
        </button>
        <button
          type="button"
          ref={shareButtonRef}
          onClick={() => setSheetOpen(true)}
        >
          <span className="app-nav__icon" aria-hidden="true">
            <img src={cardConfig.assets.navSave} alt="" />
          </span>
          <span className="app-nav__label">保存・シェア</span>
        </button>
        <button
          type="button"
          className={cardFlipped ? 'is-current' : ''}
          aria-pressed={cardFlipped}
          aria-controls="business-card"
          onClick={() => {
            if (!transition) setCardFlipped((flipped) => !flipped);
          }}
        >
          <span className="app-nav__icon" aria-hidden="true">
            <img src={cardConfig.assets.navFlip} alt="" />
          </span>
          <span className="app-nav__label">回転</span>
        </button>
      </nav>
      <p className="sr-only" aria-live="polite">
        {pageLabel}
      </p>

      <div className="export-stage">
        <ExportCard ref={profileExportRef} view="profile" />
        <ExportCard ref={portfolioExportRef} view="portfolio" />
      </div>
      <ShareSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAction={onShareAction}
        publicUrl={cardConfig.urls.publicCard}
        returnFocusRef={shareButtonRef}
      />
      <p className="toast" role="status" aria-live="polite">
        {notice}
      </p>
    </main>
  );
}
