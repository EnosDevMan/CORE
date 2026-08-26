import { useState } from 'react';
import { ArrowUpRight, Image as ImageIcon, Instagram } from 'lucide-react';
import type { BusinessConfig, GalleryPhoto } from '../../../types';
import { useNiche } from '../../../core/business/hooks';
import type { SectionStyle } from '../../../layouts/types';

interface Props { galleryPhotos: GalleryPhoto[]; config: BusinessConfig; style: SectionStyle }

export function GallerySection({ galleryPhotos, config, style }: Props) {
  const niche = useNiche();
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  if (!galleryPhotos.length) return null;

  return (
    <section id="gallery-section" className="core-section core-gallery-section" data-section-style={style}>
      <div className="core-section__inner">
        <div className="core-section-heading">
          <div>
            <p className="core-section-kicker">Portfólio real</p>
            <h2>{niche.landing.galleryTitle}</h2>
            <p className="core-section-intro">Detalhes do espaço, da técnica e dos cuidados que fazem parte da experiência.</p>
          </div>
          {config.socialLinks.instagram && (
            <a href={config.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="core-gallery-instagram core-public-ring">
              <Instagram size={18} /> Instagram <ArrowUpRight size={16} />
            </a>
          )}
        </div>
        <div className="core-gallery-grid">
          {galleryPhotos.slice(0, 6).map((photo, index) => (
            <figure key={photo.id} data-gallery-index={index}>
              {failedImages[photo.imageUrl] ? (
                <div className="core-gallery-fallback" role="img" aria-label="Imagem do portfólio indisponível"><ImageIcon size={34} /></div>
              ) : (
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || 'Imagem do portfólio do estabelecimento'}
                  width="720"
                  height="720"
                  loading="lazy"
                  onError={() => setFailedImages(current => ({ ...current, [photo.imageUrl]: true }))}
                />
              )}
              {photo.caption && <figcaption>{photo.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
