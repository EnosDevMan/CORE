import React from 'react';
import { Instagram } from 'lucide-react';
import { GalleryPhoto, BusinessConfig } from '../../../types';
import { useNiche } from '../../../core/business/hooks';
import type { SectionStyle } from '../../../layouts/types';

const figureRadius: Record<SectionStyle, string> = {
  structured: '',
  editorial: 'rounded-[var(--core-radius)]',
  showcase: 'rounded-[calc(var(--core-radius)*1.35)]',
  friendly: 'rounded-[calc(var(--core-radius)*1.7)]',
};

export const GallerySection: React.FC<{ galleryPhotos: GalleryPhoto[]; config: BusinessConfig; style: SectionStyle }> = ({ galleryPhotos, config, style }) => {
  const niche = useNiche();
  if (!galleryPhotos.length) return null;
  const sectionClass = style === 'editorial' ? 'core-public-page' : style === 'friendly' ? 'core-public-secondary' : 'core-public-primary';
  return <section id="gallery-section" className={`${sectionClass} px-4 py-14 sm:py-16 lg:py-20`} data-section-style={style}><div className="mx-auto max-w-6xl">
    <div className={style === 'editorial' ? 'text-center' : ''}><p className={`text-xs font-bold uppercase tracking-[.16em] ${style === 'editorial' ? 'core-public-primary-text' : 'opacity-80'}`}>Galeria</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{niche.landing.galleryTitle}</h2></div>
    <div className={`mt-7 grid gap-2 sm:gap-3 ${style === 'editorial' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 grid-rows-2 sm:grid-cols-4'}`}>{galleryPhotos.slice(0, 6).map((photo, index) => <figure key={photo.id} className={`relative overflow-hidden bg-[var(--core-muted)] ${figureRadius[style]} ${style !== 'editorial' && index === 0 ? 'col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto' : 'aspect-square'}`}><img src={photo.imageUrl} alt={photo.caption || 'Trabalho realizado pelo estabelecimento'} width="640" height="640" loading="lazy" className="h-full w-full object-cover"/>{photo.caption && <figcaption className="absolute inset-x-0 bottom-0 bg-black/65 p-2 text-xs text-white">{photo.caption}</figcaption>}</figure>)}</div>
    {config.socialLinks.instagram && <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="core-public-ring mt-6 inline-flex min-h-11 items-center gap-2 font-bold underline decoration-current decoration-2 underline-offset-4"><Instagram size={18}/>Ver mais no Instagram</a>}
  </div></section>;
};
