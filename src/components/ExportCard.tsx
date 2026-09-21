import { QrCode } from './QrCode'
import { cardConfig } from '../config/card'

export function ExportCard() {
  const { person, urls, title } = cardConfig

  return (
    <article className="export-card" aria-hidden="true">
      <div className="export-card__ribbon">{title}</div>
      <p className="export-card__copy">ただの、自己紹介。</p>
      <div className="export-card__portrait">
        <img src={cardConfig.assets.profileIllustration} alt="" />
      </div>
      <p className="export-card__label">BEGINNER</p>
      <h2>{person.name}</h2>
      <p className="export-card__reading">{person.reading}</p>
      <p className="export-card__message">デザインを通じて、またつながりたい。</p>
      <div className="export-card__qr">
        <QrCode value={urls.publicCard} label="デジタル名刺を開くQRコード" />
        <span>SCAN ME</span>
      </div>
    </article>
  )
}
