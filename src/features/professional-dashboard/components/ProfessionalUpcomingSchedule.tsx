import React from 'react';
import { Booking, BookingStatus } from '../../../types';
import { BookingStatusActions } from '../../../components/BookingStatusActions';

interface ProfessionalUpcomingScheduleProps {
  futureBookings: Booking[];
  getServiceName: (id: string) => string;
  getFormattedDate: (dateStr: string) => string;
  getStatusBadgeColor: (status: BookingStatus) => string;
  handleStatusChange?: (id: string, status: BookingStatus) => void | Promise<void>;
}

export const ProfessionalUpcomingSchedule: React.FC<ProfessionalUpcomingScheduleProps> = ({
  futureBookings,
  getServiceName,
  getFormattedDate,
  getStatusBadgeColor,
  handleStatusChange
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <h3 className="font-sans font-extrabold text-sm uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4">
        Próximos Dias ({futureBookings.length})
      </h3>
      {futureBookings.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {futureBookings.map(booking => (
            <div key={booking.id} className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
              <div className="flex-1">
                <p className="font-bold text-slate-900">{getServiceName(booking.serviceId)}</p>
                <p className="text-slate-400 text-xs mt-0.5 capitalize">
                  {getFormattedDate(booking.date)} às {booking.time}h • Com {booking.customerName}
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap sm:justify-end sm:shrink-0">
                {/* Status Badge */}
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border whitespace-nowrap ${getStatusBadgeColor(booking.status)}`}>
                  {booking.status}
                </span>

                {handleStatusChange && (
                  <BookingStatusActions
                    booking={booking}
                    handleStatusChange={handleStatusChange}
                    context="upcoming"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-xs py-4">Nenhum agendamento futuro marcado.</p>
      )}
    </div>
  );
};
