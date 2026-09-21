import { useEffect, useState } from 'react'
import { toDataURL } from 'qrcode'

type QrCodeProps = {
  value: string
  label: string
  className?: string
}

export function QrCode({ value, label, className }: QrCodeProps) {
  const [source, setSource] = useState('')

  useEffect(() => {
    let active = true

    void toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 360,
      color: { dark: '#123169', light: '#ffffff' },
    }).then((dataUrl) => {
      if (active) setSource(dataUrl)
    })

    return () => {
      active = false
    }
  }, [value])

  if (!source) return <div aria-label={`${label}を生成中`} className={`qr-placeholder ${className ?? ''}`} />

  return <img className={className} src={source} alt={label} />
}
