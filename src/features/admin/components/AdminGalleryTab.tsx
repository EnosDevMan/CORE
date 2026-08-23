import React, { useState } from 'react';
import { Trash2, Loader2, Camera, ArrowLeft, ArrowRight, GripVertical } from 'lucide-react';
import { useApp } from '../../../store/useApp';
import { GalleryPhoto } from '../../../types';
import { removePublicImage, uploadImage } from '../../../services/storageService';
import { getErrorMessage } from '../../../utils/errors';

interface AdminGalleryTabProps {
  setSuccessMessage: (msg: string) => void;
  setErrorMessage: (msg: string) => void;
}

/**
 * Galeria de cortes exibida na home page ("Nossos Trabalhos"). Alternativa
 * a puxar posts do Instagram (que exigiria autenticação via API do
 * Instagram/Meta e manutenção de token): o admin faz upload direto das
 * fotos aqui, e elas ficam hospedadas no Supabase Storage (bucket
 * `gallery`), sem depender de nenhuma API externa.
 */
export const AdminGalleryTab: React.FC<AdminGalleryTabProps> = ({
  setSuccessMessage,
  setErrorMessage,
}) => {
  const { galleryPhotos, addGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto } = useApp();

  const [isUploading, setIsUploading] = useState(false);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sortedPhotos = [...galleryPhotos].sort((a, b) =>
    (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
    (a.createdAt || '').localeCompare(b.createdAt || '')
  );

  const persistOrder = async (photos: GalleryPhoto[]) => {
    await Promise.all(photos.map((photo, index) =>
      updateGalleryPhoto({ ...photo, order: index })
    ));
  };

  const movePhoto = async (from: number, to: number) => {
    if (to < 0 || to >= sortedPhotos.length || from === to) return;
    const reordered = [...sortedPhotos];
    const [photo] = reordered.splice(from, 1);
    reordered.splice(to, 0, photo);
    try {
      await persistOrder(reordered);
      setSuccessMessage('Ordem da galeria atualizada.');
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Não foi possível salvar a ordem.'));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `cortes/${crypto.randomUUID()}-${Date.now()}.${ext}`;
      const url = await uploadImage(file, path, 'gallery');
      await addGalleryPhoto({ imageUrl: url, caption: '', order: sortedPhotos.length });
      setSuccessMessage('Foto adicionada à galeria!');
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Não foi possível enviar a foto.'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleCaptionBlur = async (photo: GalleryPhoto) => {
    const draft = captionDrafts[photo.id];
    if (draft === undefined || draft === (photo.caption || '')) return;
    try {
      await updateGalleryPhoto({ ...photo, caption: draft });
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Não foi possível salvar a legenda.'));
    }
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    if (window.confirm('Tem certeza que deseja excluir esta foto da galeria?')) {
      try {
        // Mantém o registro caso a exclusão física falhe, evitando uma foto
        // órfã e invisível no bucket. A policy permite esta operação só ao admin.
        await removePublicImage(photo.imageUrl, 'gallery');
        await deleteGalleryPhoto(photo.id);
        setSuccessMessage('Foto removida da galeria!');
      } catch (err) {
        setErrorMessage(getErrorMessage(err, 'Erro ao remover foto.'));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Galeria de Cortes</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Fotos exibidas na home page, na seção "Nossos Trabalhos". Arraste as fotos ou use os botões para definir a ordem de exibição.
          </p>
        </div>
      </div>

      <label
        htmlFor="gallery-photo-upload"
        className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-10 px-6 text-center transition-colors ${
          isUploading
            ? 'border-slate-200 bg-slate-50 cursor-wait'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40 cursor-pointer'
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 size={24} className="animate-spin text-slate-400" />
            <span className="text-sm font-semibold text-slate-500">Enviando foto...</span>
          </>
        ) : (
          <>
            <Camera size={24} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">Enviar foto de um corte</span>
            <span className="text-xs text-slate-400">JPG, PNG ou WEBP, até 5MB</span>
          </>
        )}
        <input
          id="gallery-photo-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          disabled={isUploading}
          className="hidden"
        />
      </label>

      {sortedPhotos.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Camera size={28} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhuma foto na galeria ainda</p>
          <p className="text-xs text-slate-400 mt-1">Envie a primeira foto de um corte realizado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedPhotos.map((photo, index) => (
            <div
              draggable
              onDragStart={() => setDraggedId(photo.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                const from = sortedPhotos.findIndex(item => item.id === draggedId);
                if (from >= 0) void movePhoto(from, index);
                setDraggedId(null);
              }}
              aria-label={`Foto ${index + 1} de ${sortedPhotos.length}`}
              key={photo.id}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors"
            >
              <div className="aspect-square bg-slate-100">
                <span aria-hidden="true" className="absolute left-2 top-2 rounded bg-slate-900/70 p-1 text-white"><GripVertical size={14} /></span>
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || 'Trabalho realizado pelo estabelecimento'}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => handleDelete(photo)}
                aria-label={`Excluir foto ${index + 1}`}
                className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/70 text-white transition-colors hover:bg-rose-600"
                title="Excluir foto"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex justify-center gap-2 border-t border-slate-100 p-2">
                <button type="button" onClick={() => void movePhoto(index, index - 1)} disabled={index === 0} aria-label={`Mover foto ${index + 1} para a esquerda`} className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"><ArrowLeft size={16} /></button>
                <button type="button" onClick={() => void movePhoto(index, index + 1)} disabled={index === sortedPhotos.length - 1} aria-label={`Mover foto ${index + 1} para a direita`} className="rounded p-2 hover:bg-slate-100 disabled:opacity-30"><ArrowRight size={16} /></button>
              </div>
              <input
                aria-label={`Legenda da foto ${index + 1}`}
                type="text"
                defaultValue={photo.caption || ''}
                onChange={(e) => setCaptionDrafts(prev => ({ ...prev, [photo.id]: e.target.value }))}
                onBlur={() => handleCaptionBlur(photo)}
                placeholder="Legenda (opcional)"
                className="w-full px-3 py-2 text-xs font-medium text-slate-600 border-t border-slate-100 focus:outline-none focus:bg-slate-50"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
