import { forwardRef } from 'react';
import { cardConfig } from '../config/card';
import type { CardView } from './CardContent';
import { QrCode } from './QrCode';
import { Wave } from './Wave';

type ExportCardProps = {
  view: CardView;
};

export const ExportCard = forwardRef<HTMLElement, ExportCardProps>(
  function ExportCard({ view }, ref) {
    const { businessName, copyrightYear, person, urls, assets } = cardConfig;

    return (
      <article
        ref={ref}
        className={`export-card export-card--${view}`}
        aria-hidden="true"
        style={
          {
            '--paper-texture': `url(${cardConfig.assets.paperTexture})`,
          } as React.CSSProperties
        }
      >
        <header className="export-card__header">
          <img src={assets.outlinedTitle} alt="" />
          <p>{person.message}</p>
          <Wave active={false} edge="bottom" />
        </header>
        <section className="export-card__body">
          {view === 'profile' ? (
            <>
              <div className="export-card__portrait">
                <img src={assets.profileIllustration} alt="" />
              </div>
              <p className="export-card__label">{person.role}</p>
              <h2>{person.name}</h2>
              <p className="export-card__reading">{person.reading}</p>
            </>
          ) : (
            <div className="export-card__portfolio">
              <h2>ポートフォリオ</h2>
              <QrCode
                value={urls.portfolio}
                label="ポートフォリオへ移動するQRコード"
                className="export-card__portfolio-qr"
              />
              <p>{urls.portfolio}</p>
            </div>
          )}
        </section>
        <footer className="export-card__footer">
          <p className="export-card__copyright">
            © {copyrightYear} {businessName}
          </p>
          <Wave active={false} edge="top" />
        </footer>
      </article>
    );
  },
);
