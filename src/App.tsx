import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useCallback, useRef, useState } from 'react';
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
  const [transitioning, setTransitioning] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const exportRef = useRef<HTMLElement>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const waveTimerRef = useRef<number | undefined>(undefined);

  const setCardView = (nextView: CardView) => {
    if (nextView === view || transitioning) return;
    window.clearTimeout(waveTimerRef.current);
    setTransitioning(false);
    requestAnimationFrame(() => setTransitioning(true));
    waveTimerRef.current = window.setTimeout(
      () => setTransitioning(false),
      cardConfig.animation.waveDurationMs,
    );
    setView(nextView);
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
        download(await renderExport(), 'non-business-card.png');
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
            '--page-easing': cardConfig.animation.easing,
            '--paper-texture': `url(${cardConfig.assets.paperTexture})`,
          } as React.CSSProperties
        }
      >
        <Wave active={transitioning} edge="top" />
        <header className="brand-header">
          <img src={cardConfig.assets.outlinedTitle} alt={cardConfig.title} />
          <div>
            <p className="brand-header__kicker">A LITTLE HELLO</p>
            <p>{cardConfig.person.message}</p>
          </div>
        </header>

        <div className="card-viewport" aria-live="polite">
          <div
            className={`card-track ${transitioning ? 'card-track--moving' : ''}`}
          >
            <CardContent view={view} />
          </div>
        </div>

        <Wave active={transitioning} edge="bottom" />
        <nav className="bottom-nav" aria-label="名刺のメニュー">
          <button
            type="button"
            className={view === 'profile' ? 'is-current' : ''}
            aria-current={view === 'profile' ? 'page' : undefined}
            onClick={() => setCardView('profile')}
          >
            <span aria-hidden="true">●</span>プロフィール
          </button>
          <button
            type="button"
            className={view === 'portfolio' ? 'is-current' : ''}
            aria-current={view === 'portfolio' ? 'page' : undefined}
            onClick={() => setCardView('portfolio')}
          >
            <span aria-hidden="true">↗</span>ポートフォリオ
          </button>
          <button
            type="button"
            ref={shareButtonRef}
            onClick={() => setSheetOpen(true)}
          >
            <span aria-hidden="true">↓</span>保存・シェア
          </button>
        </nav>
      </article>

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
