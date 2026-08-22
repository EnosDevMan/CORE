import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useBookingFlow } from '../features/booking/hooks/useBookingFlow';
import { ServiceSelectionStep } from '../features/booking/components/ServiceSelectionStep';
import { BarberSelectionStep } from '../features/booking/components/BarberSelectionStep';
import { DateTimeSelectionStep } from '../features/booking/components/DateTimeSelectionStep';
import { ReviewStep } from '../features/booking/components/ReviewStep';
import { SuccessStep } from '../features/booking/components/SuccessStep';

interface BookingFlowProps {
  onSuccess?: (bookingId: string) => void;
  onNavigateToView: (view: 'home' | 'admin' | 'customer', id?: string) => void;
  initialServiceId?: string;
  initialBarberId?: string;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ onSuccess, onNavigateToView, initialServiceId, initialBarberId }) => {
  const {
    step,
    services,
    barbers,
    config,
    currentUser,
    
    selectedServices,
    totalDuration,
    totalPrice,
    toggleService,
    
    selectedBarber,
    selectBarber,
    
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    availableTimes,
    loadingTimes,
    slotsError,
    
    custName, setCustName,
    custPhone, setCustPhone,
    notes, setNotes,
    
    errorMsg,
    completedBooking,
    copiedPix,
    copyPix,
    
    isProcessing,
    processingStatus,
    
    handleNext,
    handleBack,
    handleConfirm
  } = useBookingFlow(onSuccess, initialServiceId, initialBarberId);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-8 sm:px-6">
      {/* Header with Title and Progress */}
      {step < 5 && (
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">
            {step === 1 && 'O que vamos fazer hoje?'}
            {step === 2 && 'Quem vai te atender?'}
            {step === 3 && 'Escolha a data e o horário'}
            {step === 4 && 'Revise as informações'}
          </h2>
          
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 h-0.5 bg-indigo-600 -z-10 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {[1, 2, 3, 4].map(s => (
              <div 
                key={s} 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  step > s 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                    : step === s
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-4 ring-white'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {step > s ? <CheckCircle size={14} /> : s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {errorMsg}
        </div>
      )}

      {/* Steps Content */}
      <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
        {step === 1 && (
          <ServiceSelectionStep 
            services={services}
            selectedServices={selectedServices}
            toggleService={toggleService}
          />
        )}
        
        {step === 2 && (
          <BarberSelectionStep 
            barbers={barbers}
            selectedBarber={selectedBarber}
            selectBarber={selectBarber}
          />
        )}
        
        {step === 3 && (
          <DateTimeSelectionStep 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            availableTimes={availableTimes}
            loadingTimes={loadingTimes}
            slotsError={slotsError}
            bookingWindowDays={config.bookingWindowDays}
          />
        )}
        
        {step === 4 && (
          <ReviewStep 
            currentUser={currentUser}
            custName={custName} setCustName={setCustName}
            custPhone={custPhone} setCustPhone={setCustPhone}
            notes={notes} setNotes={setNotes}
            selectedBarber={selectedBarber}
            selectedServices={selectedServices}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
          />
        )}
        
        {step === 5 && completedBooking && (
          <SuccessStep 
            booking={completedBooking}
            config={config}
            copiedPix={copiedPix}
            copyPix={copyPix}
            onNavigateToView={onNavigateToView}
            barberName={selectedBarber?.name}
            serviceNames={selectedServices.map(s => s.name).join(', ')}
          />
        )}

        {/* Footer Actions */}
        {step < 5 && (
          <div className="flex items-center gap-3 mt-10 pt-6 border-t border-slate-100">
            <button
              onClick={step === 1 ? () => onNavigateToView('home') : handleBack}
              disabled={isProcessing}
              aria-label="Voltar" className="min-h-12 min-w-12 px-3 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <ArrowLeft size={20} />
            </button>
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && selectedServices.length === 0) ||
                  (step === 2 && !selectedBarber) ||
                  (step === 3 && (!selectedDate || !selectedTime || loadingTimes))
                }
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white py-3 px-6 rounded-xl font-bold transition-all"
              >
                Continuar
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white py-3 px-6 rounded-xl font-bold transition-all shadow-lg shadow-slate-900/20"
              >
                {isProcessing ? processingStatus : 'Confirmar Agendamento'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
