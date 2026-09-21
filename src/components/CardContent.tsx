import { QrCode } from './QrCode'
import { cardConfig } from '../config/card'

export type CardView = 'profile' | 'portfolio'

type CardContentProps = {
  view: CardView
}

export function CardContent({ view }: CardContentProps) {
  const { person, urls, assets } = cardConfig

  if (view === 'portfolio') {
    return (
      <section aria-labelledby="portfolio-heading" className="card-page portfolio-page">
        <p className="eyebrow">PORTFOLIO</p>
        <div className="portfolio-page__body">
          <p className="portfolio-page__intro">つくったもの、考えたこと。<br />よかったら、のぞいてください。</p>
          <div className="qr-frame">
            <QrCode value={urls.portfolio} label="ポートフォリオへ移動するQRコード" className="qr-code" />
          </div>
          <h2 id="portfolio-heading">PORTFOLIO</h2>
          <a className="portfolio-link" href={urls.portfolio} target="_blank" rel="noreferrer">
            <span>{urls.portfolio.replace(/^https:\/\//, '')}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="profile-heading" className="card-page profile-page">
      <p className="eyebrow">BEGINNER</p>
      <div className="profile-page__art">
        <span className="lemon lemon--one" aria-hidden="true" />
        <span className="lemon lemon--two" aria-hidden="true" />
        <img src={assets.profileIllustration} alt={`${person.name}のプロフィールイラスト`} />
      </div>
      <div className="profile-page__copy">
        <p className="profile-page__role">{person.role}</p>
        <h2 id="profile-heading">{person.name}</h2>
        <p className="profile-page__reading">{person.reading}</p>
        <p className="profile-page__location">{person.location}</p>
      </div>
    </section>
  )
}
