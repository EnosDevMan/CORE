import React, { useMemo } from 'react';
import {
  useBusinessConfig,
  useGalleryPhotos,
  useProfessionals,
  useScheduleBlocks,
  useServices,
} from '../store/useApp';
import { useBusiness } from '../core/business/hooks';
import { getPublicLayoutPreset } from '../layouts/registry';
import type { PublicSectionId } from '../layouts/types';
import { HeroSection } from '../features/landing/components/HeroSection';
import { FeaturesSection } from '../features/landing/components/FeaturesSection';
import { ServicesSection } from '../features/landing/components/ServicesSection';
import { ProfessionalsSection } from '../features/landing/components/ProfessionalsSection';
import { GallerySection } from '../features/landing/components/GallerySection';
import { FooterSection } from '../features/landing/components/FooterSection';
import '../styles/artDirections.css';

interface Props { onStartBooking: (selection?: { serviceId?: string; professionalId?: string }) => void; onOpenLogin: () => void; onOpenPrivacy: () => void; }

export const LandingPage: React.FC<Props> = ({ onStartBooking, onOpenLogin, onOpenPrivacy }) => {
  const config = useBusinessConfig();
  const professionals = useProfessionals();
  const services = useServices();
  const galleryPhotos = useGalleryPhotos();
  const scheduleBlocks = useScheduleBlocks();
  const { profile } = useBusiness();
  const layout = getPublicLayoutPreset(
    profile.themeStyleId,
    profile.nicheId === 'core_bootstrap' ? undefined : profile.nicheId,
  );

  const activeServices = useMemo(
    () => services.filter(service => service.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [services],
  );

  const categories = useMemo(() => Array.from(new Map(
    activeServices
      .map(service => service.category?.trim())
      .filter((category): category is string => typeof category === 'string' && category.length > 0 && category.toLocaleLowerCase('pt-BR') !== 'todos')
      .map(category => [category.toLocaleLowerCase('pt-BR'), category]),
  ).values()), [activeServices]);

  const activeProfessionals = useMemo(
    () => professionals.filter(professional => professional.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [professionals],
  );

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
    <div
      className="core-public-page min-h-screen overflow-x-clip"
      data-public-layout={layout.id}
      data-hero-variant={layout.heroVariant}
    >
      <HeroSection
        variant={layout.heroVariant}
        config={config}
        imageUrl={profile.coverUrl || galleryPhotos[0]?.imageUrl}
        serviceCount={activeServices.length}
        professionalCount={activeProfessionals.length}
        onStartBooking={() => onStartBooking()}
        onOpenLogin={onOpenLogin}
      />
      {layout.sectionOrder.map(renderSection)}
      <FooterSection config={config} professionals={activeProfessionals} scheduleBlocks={scheduleBlocks} onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
};
