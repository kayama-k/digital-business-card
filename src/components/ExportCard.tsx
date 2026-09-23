import { forwardRef } from 'react';
import { cardConfig } from '../config/card';
import { QrCode } from './QrCode';
import { Wave } from './Wave';

export const ExportCard = forwardRef<HTMLElement>(function ExportCard(_, ref) {
  const { person, urls, assets } = cardConfig;

  return (
    <article
      ref={ref}
      className="export-card"
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
        <p className="export-card__label">{person.role}</p>
        <div className="export-card__portrait">
          <img src={assets.profileIllustration} alt="" />
        </div>
        <h2>{person.name}</h2>
        <p className="export-card__reading">{person.reading}</p>
      </section>
      <footer className="export-card__footer">
        <div>
          <p>PORTFOLIO</p>
          <span>{urls.portfolio}</span>
        </div>
        <div className="export-card__qr">
          <QrCode value={urls.portfolio} label="ポートフォリオを開くQRコード" />
        </div>
        <Wave active={false} edge="top" />
      </footer>
    </article>
  );
});
