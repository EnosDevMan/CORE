from pathlib import Path
import re


def edit(path, fn):
    p = Path(path)
    before = p.read_text()
    after = fn(before)
    if after == before:
        raise SystemExit(f'No change applied to {path}')
    p.write_text(after)


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)


# Granular store actions for screens that do not need the entire app state.
edit('src/store/useApp.tsx', lambda text: replace_once(
    text,
    "export const useUpdateBookingStatus = () => useDataStore(state => state.updateBookingStatus);\n",
    "export const useUpdateBookingStatus = () => useDataStore(state => state.updateBookingStatus);\n"
    "export const useUpdateUserRole = () => useDataStore(state => state.updateUserRole);\n"
    "export const useDeleteUserAccount = () => useDataStore(state => state.deleteUserAccount);\n"
    "export const useDeactivateService = () => useDataStore(state => state.deactivateService);\n"
    "export const useUpdateProfessional = () => useDataStore(state => state.updateProfessional);\n",
    'useApp action selectors'
))


def services_tab(text):
    text = replace_once(text,
        "import { useApp } from '../../../store/useApp';",
        "import { useDeactivateService, useServices } from '../../../store/useApp';",
        'AdminServicesTab import')
    return replace_once(text,
        "  const { services, deactivateService } = useApp();",
        "  const services = useServices();\n  const deactivateService = useDeactivateService();",
        'AdminServicesTab selector')
edit('src/features/admin/components/AdminServicesTab.tsx', services_tab)


def accounts_tab(text):
    text = replace_once(text,
        "import { useApp } from '../../../store/useApp';",
        "import { useCurrentUser, useDeleteUserAccount, useUpdateUserRole, useUsers } from '../../../store/useApp';",
        'AdminAccountsTab import')
    return replace_once(text,
        "  const { users, currentUser, updateUserRole, deleteUserAccount } = useApp();",
        "  const users = useUsers();\n  const currentUser = useCurrentUser();\n  const updateUserRole = useUpdateUserRole();\n  const deleteUserAccount = useDeleteUserAccount();",
        'AdminAccountsTab selector')
edit('src/features/admin/components/AdminAccountsTab.tsx', accounts_tab)


def agenda_tab(text):
    text = replace_once(text,
        "import React, { useState } from 'react';",
        "import React, { useMemo, useState } from 'react';",
        'AdminAgendaTab React import')
    text = replace_once(text,
        "import { useApp } from '../../../store/useApp';",
        "import { useBookings, useProfessionals, useServices, useUpdateBookingStatus } from '../../../store/useApp';",
        'AdminAgendaTab store import')
    text = replace_once(text,
        "  const { bookings, professionals, services, updateBookingStatus } = useApp();",
        "  const bookings = useBookings();\n  const professionals = useProfessionals();\n  const services = useServices();\n  const updateBookingStatus = useUpdateBookingStatus();",
        'AdminAgendaTab selector')
    pattern = re.compile(r"  const filteredBookings = bookings\.filter\(b => \{.*?\n  \}\)\.sort\(\(a, b\) => `\$\{a\.date\}\$\{a\.time\}`\.localeCompare\(`\$\{b\.date\}\$\{b\.time\}`\)\);", re.S)
    replacement = '''  const normalizedSearch = useMemo(() => search.trim().toLocaleLowerCase('pt-BR'), [search]);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const start = new Date(`${dateFilter}T12:00:00`);
    const end = new Date(start);
    if (period === 'tomorrow') {
      start.setDate(start.getDate() + 1);
      end.setDate(end.getDate() + 1);
    } else if (period === 'week') {
      end.setDate(end.getDate() + 6);
    } else if (period === 'month') {
      end.setMonth(end.getMonth() + 1, 0);
    }
    const toYmd = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { rangeStart: toYmd(start), rangeEnd: toYmd(end) };
  }, [dateFilter, period]);

  const filteredBookings = useMemo(() => bookings.filter(booking => {
    const matchDate = booking.date >= rangeStart && booking.date <= rangeEnd;
    const matchProfessional = professionalFilter === 'all' || booking.professionalId === professionalFilter;
    const matchStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchSearch = !normalizedSearch || `${booking.customerName} ${booking.customerPhone} ${getSharedServiceName(services, booking.serviceId)}`
      .toLocaleLowerCase('pt-BR')
      .includes(normalizedSearch);
    return matchDate && matchProfessional && matchStatus && matchSearch;
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)), [
    bookings,
    normalizedSearch,
    professionalFilter,
    rangeEnd,
    rangeStart,
    services,
    statusFilter,
  ]);'''
    text, count = pattern.subn(replacement, text, count=1)
    if count != 1:
        raise SystemExit(f'AdminAgendaTab filter: expected one match, got {count}')
    return text
edit('src/features/admin/components/AdminAgendaTab.tsx', agenda_tab)


def professional_hook(text):
    text = replace_once(text,
        "import { useApp } from '../../../store/useApp';",
        "import { useBookings, useBusinessConfig, useCurrentUser, useProfessionals, useServices, useUpdateBookingStatus, useUpdateProfessional } from '../../../store/useApp';",
        'ProfessionalDashboard import')
    old = '''  const {
    bookings,
    services,
    professionals: professionals,
    currentUser,
    updateBookingStatus,
    updateProfessional: updateProfessional,
    config,
  } = useApp();'''
    new = '''  const bookings = useBookings();
  const services = useServices();
  const professionals = useProfessionals();
  const currentUser = useCurrentUser();
  const updateBookingStatus = useUpdateBookingStatus();
  const updateProfessional = useUpdateProfessional();
  const config = useBusinessConfig();'''
    text = replace_once(text, old, new, 'ProfessionalDashboard selectors')
    text = replace_once(text,
        "  const activeProfessional = professionals.find(b => b.id === activeProfessionalId);\n  const professionalBookings = bookings.filter(b => b.professionalId === activeProfessionalId);",
        "  const activeProfessional = useMemo(() => professionals.find(b => b.id === activeProfessionalId), [activeProfessionalId, professionals]);\n  const professionalBookings = useMemo(() => bookings.filter(b => b.professionalId === activeProfessionalId), [activeProfessionalId, bookings]);",
        'ProfessionalDashboard memoized professional data')
    text = replace_once(text,
        "  const todayBookings = sortedBookings.filter(b => b.date === todayStr);\n  // \"Cancelado\" fica de fora destas duas listas: não há nada a fazer numa\n  // reserva futura cancelada, e um cancelamento não é um \"trabalho\n  // realizado\" no histórico. Continua existindo na base de dados/relatórios\n  // do admin, só não polui a visão operacional do dia a dia do profissional.\n  const futureBookings = sortedBookings.filter(b => b.date > todayStr && b.status !== 'Cancelado');\n  const pastBookings = sortedBookings.filter(b => b.date < todayStr && b.status !== 'Cancelado');",
        "  const { todayBookings, futureBookings, pastBookings } = useMemo(() => ({\n    todayBookings: sortedBookings.filter(booking => booking.date === todayStr),\n    // Cancelados permanecem no banco/relatórios, mas não poluem a operação diária.\n    futureBookings: sortedBookings.filter(booking => booking.date > todayStr && booking.status !== 'Cancelado'),\n    pastBookings: sortedBookings.filter(booking => booking.date < todayStr && booking.status !== 'Cancelado'),\n  }), [sortedBookings, todayStr]);",
        'ProfessionalDashboard partition memo')
    text = replace_once(text,
        "  const totalEarnings = professionalBookings\n    .filter(b => b.status === 'Concluído')\n    .reduce((sum, b) => sum + b.value, 0);",
        "  const totalEarnings = useMemo(() => professionalBookings\n    .filter(booking => booking.status === 'Concluído')\n    .reduce((sum, booking) => sum + booking.value, 0), [professionalBookings]);",
        'ProfessionalDashboard earnings memo')
    return text
edit('src/features/professional-dashboard/hooks/useProfessionalDashboard.ts', professional_hook)


def overview(text):
    text = replace_once(text,
        "import { getBusinessTodayStr } from '../../../utils/validation';",
        "import { getBusinessNow, getBusinessTodayStr } from '../../../utils/validation';",
        'AdminOverview timezone import')
    text = replace_once(text,
        "    () => users.filter(user => isCustomerRole(user.role) && user.createdAt?.slice(0, 10) === todayStr).length,\n    [todayStr, users],",
        "    () => users.filter(user => isCustomerRole(user.role)\n      && Boolean(user.createdAt)\n      && getBusinessNow(profile.timezone, new Date(user.createdAt as string)).dateStr === todayStr).length,\n    [profile.timezone, todayStr, users],",
        'AdminOverview customer date')
    old = '''                  {renderActions(booking) && (
                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">{renderActions(booking)}</div>
                  )}'''
    new = '''                  {booking.status !== 'Concluído' && booking.status !== 'Cancelado' && booking.status !== 'Não compareceu' && (
                    <div className="pt-1.5 border-t border-slate-100 flex justify-end">{renderActions(booking)}</div>
                  )}'''
    return replace_once(text, old, new, 'AdminOverview duplicate actions')
edit('src/features/admin/components/AdminOverviewTab.tsx', overview)
