import { useEffect, useId, useRef, useState } from 'react';
import { Check, Loader2, Minus, Plus, X } from 'lucide-react';
import { useModalAccessibility } from '../../../hooks/useModalAccessibility';
import { calculateSquareCrop, LOGO_OUTPUT_SIZE, type LogoCropOptions } from '../../../core/business/logoCrop';

interface LogoCropDialogProps {
  file: File;
  saving: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (options: LogoCropOptions) => void;
}

export function LogoCropDialog({ file, saving, error, onCancel, onConfirm }: LogoCropDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [imageReady, setImageReady] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleId = useId();
  const modalRef = useModalAccessibility<HTMLDivElement>(true, saving ? () => undefined : onCancel);

  useEffect(() => {
    const nextUrl = URL.createObjectURL(file);
    const image = new Image();
    let active = true;
    setImageReady(false);
    setPreviewError('');
    image.onload = () => {
      if (!active) return;
      sourceImageRef.current = image;
      setImageReady(true);
    };
    image.onerror = () => {
      if (!active) return;
      sourceImageRef.current = null;
      setPreviewError('Não foi possível abrir esta imagem. Escolha outro arquivo JPG, PNG ou WebP.');
    };
    image.src = nextUrl;
    return () => {
      active = false;
      sourceImageRef.current = null;
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  useEffect(() => {
    const image = sourceImageRef.current;
    const canvas = canvasRef.current;
    if (!imageReady || !image || !canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const crop = calculateSquareCrop(image.naturalWidth, image.naturalHeight, { zoom, positionX, positionY });
    context.clearRect(0, 0, LOGO_OUTPUT_SIZE, LOGO_OUTPUT_SIZE);
    context.drawImage(image, crop.sourceX, crop.sourceY, crop.sourceSize, crop.sourceSize, 0, 0, LOGO_OUTPUT_SIZE, LOGO_OUTPUT_SIZE);
  }, [imageReady, positionX, positionY, zoom]);

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onCancel();
      }}
    >
      <div className="core-logo-editor max-h-[96vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-slate-400">Identidade visual</p>
            <h2 id={titleId} className="mt-1 text-xl font-black text-slate-900">Encaixe sua logo</h2>
            <p className="mt-1 text-sm text-slate-500">Ajuste o zoom e o foco. O resultado será otimizado em 512 × 512 px.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="Fechar editor">
            <X size={21} />
          </button>
        </header>

        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(260px,1fr)_minmax(240px,.85fr)] sm:p-7">
          <div className="mx-auto w-full max-w-sm">
            <div className="core-logo-crop-preview relative aspect-square overflow-hidden bg-slate-100 shadow-inner" aria-label="Prévia do recorte">
              <canvas ref={canvasRef} width={LOGO_OUTPUT_SIZE} height={LOGO_OUTPUT_SIZE} role="img" aria-label="Prévia exata da logo recortada" className="h-full w-full" />
              {!imageReady && !previewError && (
                <div className="absolute inset-0 grid place-items-center bg-slate-100 text-slate-500" role="status">
                  <span className="flex items-center gap-2 text-sm font-bold"><Loader2 className="animate-spin" size={18} /> Preparando prévia...</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 border-[3px] border-white/90 shadow-[inset_0_0_0_1px_rgb(15_23_42/.12)]" />
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">Tudo dentro do quadro será exibido no site e usado como ícone da página.</p>
          </div>

          <div className="space-y-5">
            {(previewError || error) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{previewError || error}</p>}
            <label className="block text-sm font-bold text-slate-700">
              <span className="flex items-center justify-between"><span>Zoom</span><span className="font-mono text-xs text-slate-500">{zoom.toFixed(1)}×</span></span>
              <span className="mt-3 flex items-center gap-3">
                <Minus size={16} aria-hidden="true" />
                <input data-modal-initial-focus type="range" min="1" max="3" step="0.1" value={zoom} onChange={event => setZoom(Number(event.target.value))} className="w-full accent-current" />
                <Plus size={16} aria-hidden="true" />
              </span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Foco horizontal
              <input type="range" min="0" max="100" value={positionX} onChange={event => setPositionX(Number(event.target.value))} className="mt-3 w-full accent-current" />
              <span className="mt-1 flex justify-between text-[11px] font-medium text-slate-400"><span>Esquerda</span><span>Direita</span></span>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Foco vertical
              <input type="range" min="0" max="100" value={positionY} onChange={event => setPositionY(Number(event.target.value))} className="mt-3 w-full accent-current" />
              <span className="mt-1 flex justify-between text-[11px] font-medium text-slate-400"><span>Topo</span><span>Base</span></span>
            </label>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Cancelar</button>
              <button type="button" onClick={() => onConfirm({ zoom, positionX, positionY })} disabled={saving || !imageReady || Boolean(previewError)} className="core-button-primary min-h-11 justify-center px-5 text-sm font-bold disabled:opacity-50">
                <Check size={17} /> {saving ? 'Otimizando e enviando...' : 'Usar esta logo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
