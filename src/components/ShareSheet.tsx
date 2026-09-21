import { useEffect, useRef } from 'react';

export type ShareAction = 'png' | 'pdf' | 'share' | 'copy';

type ShareSheetProps = {
  open: boolean;
  onClose: () => void;
  onAction: (action: ShareAction) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

const actions: Array<{ id: ShareAction; label: string; detail: string }> = [
  { id: 'png', label: 'PNGで保存', detail: 'スマートフォンに画像を保存' },
  { id: 'pdf', label: 'PDFで保存', detail: '1ページのPDFをダウンロード' },
  { id: 'share', label: 'URLをシェア', detail: '端末の共有メニューを開く' },
  { id: 'copy', label: 'リンクをコピー', detail: 'クリップボードへコピー' },
];

export function ShareSheet({
  open,
  onClose,
  onAction,
  returnFocusRef,
}: ShareSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const firstButton = dialog?.querySelector<HTMLButtonElement>('button');
    firstButton?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const buttons = Array.from(
        dialog.querySelectorAll<HTMLButtonElement>('button'),
      );
      const first = buttons[0];
      const last = buttons.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return;
    }
    if (wasOpenRef.current) returnFocusRef.current?.focus();
    wasOpenRef.current = false;
  }, [open, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="sheet-layer" role="presentation">
      <button
        type="button"
        className="sheet-layer__backdrop"
        aria-label="保存・シェアを閉じる"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="share-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-heading"
      >
        <div className="share-sheet__handle" aria-hidden="true" />
        <div className="share-sheet__heading">
          <p>KEEP IN TOUCH</p>
          <h2 id="share-heading">保存・シェア</h2>
        </div>
        <div className="share-sheet__actions">
          {actions.map((action) => (
            <button
              type="button"
              key={action.id}
              className="share-action"
              onClick={() => onAction(action.id)}
            >
              <span>{action.label}</span>
              <small>{action.detail}</small>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        <button type="button" className="share-sheet__close" onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
