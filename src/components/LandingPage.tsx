import React from 'react';
import { useApp } from '../store/useApp';
import { useNiche } from '../core/business/hooks';
import { getPublicLayoutPreset } from '../layouts/registry';
import type { PublicSectionId } from '../layouts/types';
import { HeroSection } from '../features/landing/components/HeroSection';
import { FeaturesSection } from '../features/landing/components/FeaturesSection';
import { ServicesSection } from '../features/landing/components/ServicesSection';
import { ProfessionalsSection } from '../features/landing/components/ProfessionalsSection';
import { GallerySection } from '../features/landing/components/GallerySection';
import { FooterSection } from '../features/landing/components/FooterSection';

interface Props { onStartBooking: (selection?: { serviceId?: string; professionalId?: string }) => void; onOpenLogin: () => void; onOpenPrivacy: () => void; }

export const LandingPage: React.FC<Props> = ({ onStartBooking, onOpenLogin, onOpenPrivacy }) => {
  const { config, professionals, services, galleryPhotos, scheduleBlocks } = useApp();
  const niche = useNiche();
  const layout = getPublicLayoutPreset(niche.defaultLayoutId);
  const activeServices = services.filter(s => s.active !== false).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
  const categories = [...new Set(activeServices.map(s => s.category).filter(Boolean))];
  const activeProfessionals = professionals.filter(b => b.active).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));

  const renderSection = (section: PublicSectionId) => {
    switch (section) {
      case 'features':
        return <FeaturesSection key={section} config={config} />;
      case 'services':
        return <ServicesSection key={section} style={layout.sectionStyle} categories={categories} activeServices={activeServices} onSelectService={serviceId => onStartBooking({ serviceId })} />;
      case 'gallery':
        return <GallerySection key={section} style={layout.sectionStyle} galleryPhotos={galleryPhotos} config={config} />;
      case 'professionals':
        return <ProfessionalsSection key={section} style={layout.sectionStyle} activeProfessionals={activeProfessionals} onSelectProfessional={professionalId => onStartBooking({ professionalId })} />;
    }
  };

  return (
    <div className="core-public-page min-h-screen overflow-x-clip" data-public-layout={layout.id}>
      <HeroSection variant={layout.heroVariant} config={config} onStartBooking={() => onStartBooking()} onOpenLogin={onOpenLogin} />
      {layout.sectionOrder.map(renderSection)}
      <FooterSection config={config} professionals={activeProfessionals} scheduleBlocks={scheduleBlocks} onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
};
