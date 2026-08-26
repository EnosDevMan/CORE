import { useEffect, useState } from 'react';
import { CalendarCheck2, Gem, Heart, PawPrint, Scissors, Sparkles } from 'lucide-react';
import type { NicheId, RuntimeNicheId } from '../../../niches/types';

interface NicheHeroVisualProps {
  nicheId: RuntimeNicheId;
  imageUrl?: string;
}

const CONTENT: Record<NicheId, { kicker: string; statement: string }> = {
  barbershop: { kicker: 'Precisão', statement: 'Estilo e horário sob medida.' },
  beauty_salon: { kicker: 'Experiência', statement: 'Seu momento começa aqui.' },
  nail_studio: { kicker: 'Vitrine', statement: 'Cor, forma e assinatura.' },
  pet_shop: { kicker: 'Cuidado', statement: 'Carinho também se agenda.' },
};

function DecorativeIcon({ nicheId }: { nicheId: RuntimeNicheId }) {
  if (nicheId === 'barbershop') return <Scissors />;
  if (nicheId === 'beauty_salon') return <Sparkles />;
  if (nicheId === 'nail_studio') return <Gem />;
  if (nicheId === 'pet_shop') return <PawPrint />;
  return <CalendarCheck2 />;
}

export function NicheHeroVisual({ nicheId, imageUrl }: NicheHeroVisualProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const content = nicheId === 'core_bootstrap'
    ? { kicker: 'Agenda online', statement: 'Seu atendimento, organizado.' }
    : CONTENT[nicheId];

  useEffect(() => setImageFailed(false), [imageUrl]);

  return (
    <div className="core-hero-visual" aria-hidden="true">
      <div className="core-hero-visual__orbit core-hero-visual__orbit--one" />
      <div className="core-hero-visual__orbit core-hero-visual__orbit--two" />
      <div className="core-hero-visual__media">
        {imageUrl && !imageFailed ? (
          <img src={imageUrl} alt="" loading="eager" fetchPriority="high" onError={() => setImageFailed(true)} />
        ) : (
          <div className="core-hero-visual__fallback"><DecorativeIcon nicheId={nicheId} /></div>
        )}
        <span className="core-hero-visual__stamp"><DecorativeIcon nicheId={nicheId} /></span>
      </div>
      <div className="core-hero-visual__note">
        <span>{content.kicker}</span>
        <strong>{content.statement}</strong>
      </div>
      <div className="core-hero-visual__availability">
        <CalendarCheck2 size={18} />
        <span><strong>Agenda online</strong><small>Escolha em poucos passos</small></span>
      </div>
      {nicheId === 'pet_shop' && <Heart className="core-hero-visual__heart" />}
    </div>
  );
}
