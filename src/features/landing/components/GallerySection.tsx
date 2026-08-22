import React from 'react';
import { Instagram } from 'lucide-react';
import { GalleryPhoto, BarbershopConfig } from '../../../types';
export const GallerySection: React.FC<{ galleryPhotos: GalleryPhoto[]; config: BarbershopConfig }> = ({ galleryPhotos, config }) => {
 if (!galleryPhotos.length) return null;
 return <section id="gallery-section" className="bg-brand-navy px-4 py-14 sm:py-16 lg:py-20"><div className="mx-auto max-w-6xl">
  <p className="text-xs font-bold uppercase tracking-[.16em] text-brand-copper">Galeria</p><h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Trabalhos da casa</h2>
  <div className="mt-7 grid grid-cols-2 grid-rows-2 gap-2 sm:grid-cols-4 sm:gap-3">{galleryPhotos.slice(0, 5).map((photo, index) => <figure key={photo.id} className={`relative overflow-hidden bg-slate-100 ${index === 0 ? 'col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto' : 'aspect-square'}`}><img src={photo.imageUrl} alt={photo.caption || 'Trabalho realizado na barbearia'} width="640" height="640" loading="lazy" className="h-full w-full object-cover"/>{photo.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-black/65 p-2 text-xs text-white">{photo.caption}</figcaption>}</figure>)}</div>
  {config.socialLinks.instagram && <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-white underline decoration-brand-copper decoration-2 underline-offset-4"><Instagram size={18}/>Ver mais no Instagram</a>}
 </div></section>;
};
