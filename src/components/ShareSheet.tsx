import { useEffect, useRef, useState } from 'react';
import { QrCode } from './QrCode';

export type ShareAction = 'png' | 'pdf' | 'share' | 'copy';

type ShareSheetProps = {
  open: boolean;
  onClose: () => void;
  onAction: (action: ShareAction) => void;
  publicUrl: string;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

const actions: Array<{ id: ShareAction; label: string; detail: string }> = [
  { id: 'png', label: 'PNGで保存', detail: 'スマートフォンに画像を保存' },
  {
    id: 'pdf',
    label: 'PDFで保存',
    detail: 'プロフィールとポートフォリオを2ページで保存',
  },
  { id: 'share', label: 'URLをシェア', detail: '名刺URLのQRコードを表示' },
  { id: 'copy', label: 'リンクをコピー', detail: 'クリップボードへコピー' },
];

export function ShareSheet({
  open,
  onClose,
  onAction,
  publicUrl,
  returnFocusRef,
}: ShareSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const dragStartRef = useRef<{
    y: number;
    pointerId: number;
    startedAt: number;
  } | null>(null);
  const [present, setPresent] = useState(open);
  const [closing, setClosing] = useState(false);
  const [entering, setEntering] = useState(open);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showUrlQr, setShowUrlQr] = useState(false);

  useEffect(() => {
    window.clearTimeout(closeTimerRef.current);
    if (open) {
      setPresent(true);
      setClosing(false);
      setEntering(true);
      setDragY(0);
      setDragging(false);
      setShowUrlQr(false);
      return;
    }
    if (!present) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => setPresent(false), 360);
    return () => window.clearTimeout(closeTimerRef.current);
  }, [open, present]);

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), []);

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

  if (!present && !open) return null;

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      closing ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      (event.target as HTMLElement).closest(
        'button,a,input,textarea,select,[role="button"]',
      )
    ) {
      return;
    }
    dragStartRef.current = {
      y: event.clientY,
      pointerId: event.pointerId,
      startedAt: event.timeStamp,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    setDragY(Math.max(0, event.clientY - dragStart.y));
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const deltaY = event.clientY - dragStart.y;
    const elapsed = Math.max(1, event.timeStamp - dragStart.startedAt);
    const velocity = deltaY / elapsed;
    setDragY(0);
    if (deltaY > 72 || (deltaY > 28 && velocity > 0.55)) {
      onClose();
    }
  };

  const handleDragCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart || dragStart.pointerId !== event.pointerId) return;
    dragStartRef.current = null;
    setDragging(false);
    setDragY(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.animationName === 'sheet-exit' && closing) setPresent(false);
    else if (event.animationName === 'sheet-enter') setEntering(false);
  };

  const handleAction = (action: ShareAction) => {
    if (action === 'share') setShowUrlQr(true);
    onAction(action);
  };

  return (
    <div
      className={`sheet-layer${closing ? ' sheet-layer--closing' : ''}`}
      role="presentation"
    >
      <button
        type="button"
        className="sheet-layer__backdrop"
        aria-label="保存・シェアを閉じる"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className={`share-sheet${entering || open ? ' is-entering' : ''}${
          dragging ? ' is-dragging' : ''
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-heading"
        aria-hidden={closing}
        inert={closing}
        onAnimationEnd={handleAnimationEnd}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragCancel}
        style={{ '--sheet-drag-y': `${dragY}px` } as React.CSSProperties}
      >
        <div
          className={`share-sheet__handle${dragging ? ' is-dragging' : ''}`}
          aria-hidden="true"
        />
        <div className="share-sheet__heading">
          <p>KEEP IN TOUCH</p>
          <h2 id="share-heading">保存・シェア</h2>
        </div>
        {showUrlQr && (
          <section
            className="share-sheet__url-card"
            aria-labelledby="share-url-heading"
          >
            <h3 id="share-url-heading" className="share-sheet__url-label">
              名刺URL
            </h3>
            <div className="share-sheet__url-qr">
              <QrCode
                value={publicUrl}
                label="名刺URLのQRコード"
                className="share-sheet__url-qr-image"
              />
            </div>
            <p className="share-sheet__url-value">{publicUrl}</p>
          </section>
        )}
        <div className="share-sheet__actions">
          {actions.map((action) => (
            <button
              type="button"
              key={action.id}
              className="share-action"
              onClick={() => handleAction(action.id)}
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
