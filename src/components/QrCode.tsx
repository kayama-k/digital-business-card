import { toDataURL } from 'qrcode';
import { useEffect, useState } from 'react';

type QrCodeProps = {
  value: string;
  label: string;
  className?: string;
};

const sources = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function loadQrCode(value: string) {
  const cached = sources.get(value);
  if (cached) return Promise.resolve(cached);

  let request = pending.get(value);
  if (!request) {
    request = toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 360,
      color: { dark: '#000000', light: '#ffffff' },
    }).then((dataUrl) => {
      sources.set(value, dataUrl);
      pending.delete(value);
      return dataUrl;
    });
    pending.set(value, request);
  }
  return request;
}

export function QrCode({ value, label, className }: QrCodeProps) {
  const [source, setSource] = useState(() => sources.get(value) ?? '');

  useEffect(() => {
    let active = true;

    void loadQrCode(value).then((dataUrl) => {
      if (active) setSource(dataUrl);
    });

    return () => {
      active = false;
    };
  }, [value]);

  if (!source)
    return (
      <div
        role="status"
        aria-label={`${label}を生成中`}
        className={`qr-placeholder ${className ?? ''}`}
      />
    );

  return <img className={className} src={source} alt={label} />;
}
