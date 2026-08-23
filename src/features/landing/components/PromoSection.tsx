import React from 'react';
import { Calendar } from 'lucide-react';

interface PromoSectionProps {
  onStartBooking: () => void;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ onStartBooking }) => {
  return (
    <section className="bg-indigo-600 py-16 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
      <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <span className="inline-block bg-indigo-500 text-indigo-50 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 border border-indigo-400">
            Oferta Especial
          </span>
          <h3 className="text-white text-2xl md:text-3xl font-black font-sans leading-tight">
            Primeira vez conosco? Aproveite Agendamento Grátis!
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl font-light mt-2">
            Você paga o valor do procedimento diretamente no estabelecimento após o serviço concluído. Sem taxas ocultas de reserva online!
          </p>
        </div>
        <button
          onClick={onStartBooking}
          className="bg-white hover:bg-indigo-50 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm transition-all hover:scale-[1.02] shrink-0 shadow-lg cursor-pointer flex items-center gap-2"
        >
          <Calendar size={16} className="text-indigo-600" /> Agendar Agora Mesmo
        </button>
      </div>
    </section>
  );
};
