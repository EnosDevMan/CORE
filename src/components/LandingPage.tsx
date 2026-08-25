import React from 'react';
import { useApp } from '../store/useApp';
import { HeroSection } from '../features/landing/components/HeroSection';
import { FeaturesSection } from '../features/landing/components/FeaturesSection';
import { ServicesSection } from '../features/landing/components/ServicesSection';
import { ProfessionalsSection } from '../features/landing/components/ProfessionalsSection';
import { GallerySection } from '../features/landing/components/GallerySection';
import { FooterSection } from '../features/landing/components/FooterSection';

interface Props { onStartBooking: (selection?: { serviceId?: string; professionalId?: string }) => void; onOpenLogin: () => void; onOpenPrivacy: () => void; }
export const LandingPage: React.FC<Props> = ({ onStartBooking, onOpenLogin, onOpenPrivacy }) => {
  const { config, professionals, services, galleryPhotos, scheduleBlocks } = useApp();
  const activeServices = services.filter(s => s.active !== false).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
  const categories = [...new Set(activeServices.map(s => s.category).filter(Boolean))];
  const activeProfessionals = professionals.filter(b => b.active).sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
  return <div className="core-public-page min-h-screen overflow-x-clip"><HeroSection config={config} onStartBooking={() => onStartBooking()} onOpenLogin={onOpenLogin}/><FeaturesSection config={config}/><ServicesSection categories={categories} activeServices={activeServices} onSelectService={serviceId => onStartBooking({ serviceId })}/><GallerySection galleryPhotos={galleryPhotos} config={config}/><ProfessionalsSection activeProfessionals={activeProfessionals} onSelectProfessional={professionalId => onStartBooking({ professionalId })}/><FooterSection config={config} professionals={activeProfessionals} scheduleBlocks={scheduleBlocks} onOpenPrivacy={onOpenPrivacy}/></div>;
};
