import { useEffect, useState } from 'react';
import { NicheMark } from '../../features/landing/NicheMark';
import { useBusiness, useNiche } from './hooks';

type BrandSize = 'sm' | 'md' | 'lg';

interface BusinessBrandProps {
  showName?: boolean;
  size?: BrandSize;
  className?: string;
  nameClassName?: string;
}

const ICON_SIZE: Record<BrandSize, number> = { sm: 18, md: 22, lg: 30 };

/** Uses the uploaded business mark everywhere and falls back to the niche mark. */
export function BusinessBrand({
  showName = true,
  size = 'md',
  className = '',
  nameClassName = '',
}: BusinessBrandProps) {
  const { profile } = useBusiness();
  const niche = useNiche();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [profile.logoUrl]);

  return (
    <span className={`core-business-brand core-business-brand--${size} ${className}`.trim()}>
      <span className="core-brand-mark" aria-hidden="true">
        {profile.logoUrl && !imageFailed ? (
          <img src={profile.logoUrl} alt="" decoding="async" onError={() => setImageFailed(true)} />
        ) : (
          <NicheMark nicheId={niche.id} size={ICON_SIZE[size]} />
        )}
      </span>
      {showName && <span className={`core-brand-name ${nameClassName}`.trim()}>{profile.name}</span>}
    </span>
  );
}
