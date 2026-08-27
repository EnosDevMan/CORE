import React, { useEffect, useState } from 'react';
import { ChevronDown, Save } from 'lucide-react';
import { useBusiness, useNiche } from '../../../core/business/hooks';
import { useApp } from '../../../store/useApp';
import type { DailyWorkingHours } from '../../../types';
import { getErrorMessage } from '../../../utils/errors';
import { resolveDailyHours } from '../../../utils/scheduling';
import { parseBRNumber, validateOptionalHttpUrl, validatePhoneBR } from '../../../utils/validation';
import { ScheduleBlockForm } from './agenda/ScheduleBlockForm';

interface AdminSettingsTabProps {
  showFeedback: (msg: string, isError: boolean) => void;
}

const WEEK_DAYS = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terça' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
] as const;

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-base font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:text-sm';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-slate-700';

const FormSection: React.FC<{
  id: string;
  title: string;
  expandedSection: string | null;
  setExpandedSection: (id: string | null) => void;
  children: React.ReactNode;
}> = ({ id, title, expandedSection, setExpandedSection, children }) => {
  const isExpanded = expandedSection === id;
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`settings-section-${id}`}
        onClick={() => setExpandedSection(isExpanded ? null : id)}
        className="flex w-full items-center justify-between border-b border-slate-100 bg-slate-50/60 p-4 text-left transition-colors hover:bg-slate-50 md:p-6"
      >
        <h3 className="font-extrabold text-slate-900 md:text-lg">{title}</h3>
        <ChevronDown size={18} className={`text-slate-400 transition-transform md:hidden ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      <div id={`settings-section-${id}`} className={`${isExpanded ? 'block' : 'hidden'} md:block`}>
        <div className="space-y-6 p-5 md:p-6">{children}</div>
      </div>
    </section>
  );
};

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ showFeedback }) => {
  const { config, updateConfig } = useApp();
  const { refreshRuntime } = useBusiness();
  const niche = useNiche();
  const [confName, setConfName] = useState('');
  const [confAddress, setConfAddress] = useState('');
  const [confPhone, setConfPhone] = useState('');
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DailyWorkingHours>>({});
  const [confFee, setConfFee] = useState('0');
  const [confPixKey, setConfPixKey] = useState('');
  const [confInterval, setConfInterval] = useState('30');
  const [confBookingWindowDays, setConfBookingWindowDays] = useState('30');
  const [confMinimumNotice, setConfMinimumNotice] = useState('30');
  const [confCancellationNotice, setConfCancellationNotice] = useState('0');
  const [confInsta, setConfInsta] = useState('');
  const [confFb, setConfFb] = useState('');
  const [confHeroTitle, setConfHeroTitle] = useState('');
  const [confHeroSubtitle, setConfHeroSubtitle] = useState('');
  const [confHeroDescription, setConfHeroDescription] = useState('');
  const [confAboutText, setConfAboutText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  useEffect(() => {
    setConfName(config.name);
    setConfAddress(config.address);
    setConfPhone(config.phone);
    setWeeklySchedule(Object.fromEntries(WEEK_DAYS.map(day => [day.id, resolveDailyHours(config.workingHours, day.id)])));
    setConfFee(config.bookingFee.toString());
    setConfPixKey(config.pixKey || '');
    setConfInterval(config.intervalMinutes.toString());
    setConfBookingWindowDays(config.bookingWindowDays.toString());
    setConfMinimumNotice((config.minimumNoticeMinutes ?? 30).toString());
    setConfCancellationNotice((config.cancellationNoticeMinutes ?? 0).toString());
    setConfInsta(config.socialLinks.instagram || '');
    setConfFb(config.socialLinks.facebook || '');
    setConfHeroTitle(config.heroTitle || '');
    setConfHeroSubtitle(config.heroSubtitle || '');
    setConfHeroDescription(config.heroDescription || '');
    setConfAboutText(config.aboutText || '');
  }, [config]);

  const updateDay = (day: number, patch: Partial<DailyWorkingHours>) => {
    setWeeklySchedule(current => ({
      ...current,
      [day]: { ...resolveDailyHours(config.workingHours, day), ...current[day], ...patch },
    }));
  };

  const handleSaveConfig = async () => {
    if (isSaving) return;
    const intervalMinutes = Number(confInterval);
    const bookingFee = parseBRNumber(confFee);
    const bookingWindowDays = Number(confBookingWindowDays);
    const minimumNoticeMinutes = Number(confMinimumNotice);
    const cancellationNoticeMinutes = Number(confCancellationNotice);

    if (!confName.trim() || !confAddress.trim() || !confPhone.trim()) {
      showFeedback('Preencha nome, endereço e telefone do estabelecimento.', true);
      return;
    }
    if (confName.trim().length < 2 || confName.trim().length > 100) {
      showFeedback('O nome do estabelecimento deve ter entre 2 e 100 caracteres.', true);
      return;
    }
    if (confAddress.trim().length > 500 || confPhone.trim().length > 32 || !validatePhoneBR(confPhone)) {
      showFeedback('Revise o endereço e informe um telefone brasileiro válido com DDD.', true);
      return;
    }
    if (confPixKey.trim().length > 320 || confHeroTitle.trim().length > 160
      || confHeroSubtitle.trim().length > 240 || confHeroDescription.trim().length > 1000
      || confAboutText.trim().length > 2000 || confInsta.trim().length > 2048 || confFb.trim().length > 2048) {
      showFeedback('Um dos textos ultrapassa o limite permitido.', true);
      return;
    }
    if (!validateOptionalHttpUrl(confInsta) || !validateOptionalHttpUrl(confFb)) {
      showFeedback('Informe links completos e válidos para as redes sociais.', true);
      return;
    }
    if (!Number.isInteger(intervalMinutes) || intervalMinutes < 5 || intervalMinutes > 480) {
      showFeedback('O intervalo dos horários deve ficar entre 5 e 480 minutos.', true);
      return;
    }
    if (!Number.isInteger(bookingWindowDays) || bookingWindowDays < 1 || bookingWindowDays > 365) {
      showFeedback('A janela de agendamento deve ficar entre 1 e 365 dias.', true);
      return;
    }
    if (!Number.isInteger(minimumNoticeMinutes) || minimumNoticeMinutes < 0 || minimumNoticeMinutes > 525600
      || !Number.isInteger(cancellationNoticeMinutes) || cancellationNoticeMinutes < 0 || cancellationNoticeMinutes > 525600) {
      showFeedback('Revise os prazos de antecedência da agenda.', true);
      return;
    }
    if (!Number.isFinite(bookingFee) || bookingFee < 0 || bookingFee > 99_999_999.99) {
      showFeedback('Informe uma taxa de reserva válida.', true);
      return;
    }
    if (bookingFee > 0 && !confPixKey.trim()) {
      showFeedback('Informe uma chave PIX para cobrar taxa de reserva.', true);
      return;
    }

    const invalidDay = WEEK_DAYS.find(day => {
      const hours = weeklySchedule[day.id] ?? resolveDailyHours(config.workingHours, day.id);
      return !hours.closed && (!hours.open || !hours.close || hours.open >= hours.close);
    });
    if (invalidDay) {
      showFeedback(`O horário de ${invalidDay.label} precisa abrir antes do fechamento.`, true);
      return;
    }

    try {
      setIsSaving(true);
      const normalizedSchedule = Object.fromEntries(WEEK_DAYS.map(day => [day.id, weeklySchedule[day.id] ?? resolveDailyHours(config.workingHours, day.id)]));
      const firstOpenDay = WEEK_DAYS.find(day => !normalizedSchedule[day.id].closed);
      const legacyHours = firstOpenDay ? normalizedSchedule[firstOpenDay.id] : normalizedSchedule[1];
      await updateConfig({
        name: confName.trim(),
        address: confAddress.trim(),
        phone: confPhone.trim(),
        workingHours: {
          open: legacyHours.open,
          close: legacyHours.close,
          daysOpen: WEEK_DAYS.filter(day => !normalizedSchedule[day.id].closed).map(day => day.id).sort(),
          weeklySchedule: normalizedSchedule,
        },
        bookingFee,
        pixKey: confPixKey.trim(),
        intervalMinutes,
        bookingWindowDays,
        minimumNoticeMinutes,
        cancellationNoticeMinutes,
        socialLinks: {
          ...config.socialLinks,
          instagram: confInsta.trim(),
          facebook: confFb.trim(),
        },
        heroTitle: confHeroTitle.trim(),
        heroSubtitle: confHeroSubtitle.trim(),
        heroDescription: confHeroDescription.trim(),
        aboutText: confAboutText.trim(),
        logo: config.logo,
      });
      // Some public chrome (brand name, metadata, canonical contact identity)
      // comes from business_profile rather than the legacy config store. The DB
      // synchronizes both records atomically; force a canonical runtime read so
      // the same open tab reflects the confirmed owner change immediately.
      await refreshRuntime();
      showFeedback('Configurações salvas com sucesso!', false);
    } catch (error) {
      showFeedback(getErrorMessage(error, 'Erro ao salvar configurações.'), true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="sticky top-0 z-10 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Configurações do negócio</h2>
            <p className="mt-1 text-sm text-slate-500">Dados, agenda, pagamentos e conteúdo público de {niche.name}.</p>
          </div>
          <button type="button" onClick={handleSaveConfig} disabled={isSaving} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 font-bold text-white shadow-md shadow-slate-900/10 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>

      <FormSection id="basic" title="Informações básicas" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2"><label className={labelClass}>Nome do estabelecimento</label><input aria-label="Nome do estabelecimento" minLength={2} maxLength={100} value={confName} onChange={event => setConfName(event.target.value)} className={inputClass} /></div>
          <div className="space-y-2"><label className={labelClass}>Endereço completo</label><input aria-label="Endereço completo" maxLength={500} value={confAddress} onChange={event => setConfAddress(event.target.value)} className={inputClass} /></div>
          <div className="space-y-2"><label className={labelClass}>Telefone / WhatsApp</label><input type="tel" aria-label="Telefone do estabelecimento" maxLength={32} value={confPhone} onChange={event => setConfPhone(event.target.value)} className={inputClass} /></div>
        </div>
      </FormSection>

      <FormSection id="schedule" title="Horários e agendamento" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
        <div>
          <label className={labelClass}>Agenda semanal do estabelecimento</label>
          <p className="mt-1 text-xs text-slate-500">Defina o funcionamento geral. A disponibilidade individual continua configurada para cada integrante da equipe.</p>
        </div>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {WEEK_DAYS.map(day => {
            const hours = weeklySchedule[day.id] ?? resolveDailyHours(config.workingHours, day.id);
            return (
              <div key={day.id} className="grid grid-cols-1 items-center gap-3 bg-white p-3 sm:grid-cols-[8rem_1fr]">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-800"><input type="checkbox" checked={!hours.closed} onChange={event => updateDay(day.id, { closed: !event.target.checked })} />{day.label}</label>
                {hours.closed ? <span className="text-xs font-semibold text-slate-400">Fechado</span> : <div className="grid grid-cols-2 gap-2"><input aria-label={`Abertura ${day.label}`} type="time" value={hours.open} onChange={event => updateDay(day.id, { open: event.target.value })} className={inputClass} /><input aria-label={`Fechamento ${day.label}`} type="time" value={hours.close} onChange={event => updateDay(day.id, { close: event.target.value })} className={inputClass} /></div>}
              </div>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label className={labelClass}>Intervalo dos horários (min)</label><input type="number" aria-label="Intervalo dos horários em minutos" min="5" max="480" step="5" value={confInterval} onChange={event => setConfInterval(event.target.value)} className={inputClass} /></div>
          <div className="space-y-2"><label className={labelClass}>Agenda aberta por (dias)</label><input type="number" aria-label="Janela de agendamento em dias" min="1" max="365" value={confBookingWindowDays} onChange={event => setConfBookingWindowDays(event.target.value)} className={inputClass} /></div>
          <div className="space-y-2"><label className={labelClass}>Antecedência mínima (min)</label><input type="number" aria-label="Antecedência mínima para agendar em minutos" min="0" max="525600" value={confMinimumNotice} onChange={event => setConfMinimumNotice(event.target.value)} className={inputClass} /></div>
          <div className="space-y-2"><label className={labelClass}>Prazo para cancelar (min)</label><input type="number" aria-label="Antecedência mínima para cancelamento em minutos" min="0" max="525600" value={confCancellationNotice} onChange={event => setConfCancellationNotice(event.target.value)} className={inputClass} /></div>
        </div>
      </FormSection>

      <FormSection id="blocks" title="Intervalos, bloqueios e datas especiais" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
        <p className="text-sm text-slate-500">Centralize indisponibilidades do estabelecimento e da equipe sem ocupar a agenda de atendimentos.</p>
        <ScheduleBlockForm showFeedback={showFeedback} />
      </FormSection>

      <FormSection id="payment" title="Pagamento e taxas" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><label className={labelClass}>Taxa de reserva (R$)</label><input aria-label="Taxa de reserva" inputMode="decimal" maxLength={32} value={confFee} onChange={event => setConfFee(event.target.value)} className={inputClass} placeholder="0,00" /><p className="text-xs text-slate-500">Use 0 para desativar a cobrança.</p></div>
          <div className="space-y-2"><label className={labelClass}>Chave PIX recebedora</label><input aria-label="Chave PIX recebedora" maxLength={320} value={confPixKey} onChange={event => setConfPixKey(event.target.value)} className={inputClass} placeholder="CNPJ, e-mail, celular ou chave aleatória" /><p className="text-xs text-slate-500">Chave única usada nos agendamentos com taxa.</p></div>
        </div>
      </FormSection>

      <FormSection id="customization" title="Conteúdo do site" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
        <p className="text-sm text-slate-500">Deixe os campos de apresentação vazios para usar o texto profissional sugerido para {niche.name}. O que você preencher terá prioridade.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2"><label className={labelClass}>Título principal</label><input aria-label="Título principal" maxLength={160} value={confHeroTitle} onChange={event => setConfHeroTitle(event.target.value)} className={inputClass} placeholder="Ex.: Cuidado e qualidade no seu horário" /></div>
          <div className="space-y-2 lg:col-span-2"><label className={labelClass}>Subtítulo</label><input aria-label="Subtítulo" maxLength={240} value={confHeroSubtitle} onChange={event => setConfHeroSubtitle(event.target.value)} className={inputClass} placeholder="Ex.: Atendimento profissional com hora marcada" /></div>
          <div className="space-y-2 lg:col-span-2"><label className={labelClass}>Descrição curta</label><textarea aria-label="Descrição curta" maxLength={1000} value={confHeroDescription} onChange={event => setConfHeroDescription(event.target.value)} className={`${inputClass} min-h-24`} placeholder="Conte brevemente o que torna seu atendimento especial." /></div>
          <div className="space-y-2 lg:col-span-2"><label className={labelClass}>Texto sobre o negócio</label><textarea aria-label="Texto sobre nós" maxLength={2000} value={confAboutText} onChange={event => setConfAboutText(event.target.value)} className={`${inputClass} min-h-28`} placeholder="Apresente sua história, proposta e diferenciais." /></div>
          <div className="space-y-2"><label className={labelClass}>Instagram</label><input type="url" aria-label="Link do Instagram" maxLength={2048} value={confInsta} onChange={event => setConfInsta(event.target.value)} className={inputClass} placeholder="https://instagram.com/..." /></div>
          <div className="space-y-2"><label className={labelClass}>Facebook</label><input type="url" aria-label="Link do Facebook" maxLength={2048} value={confFb} onChange={event => setConfFb(event.target.value)} className={inputClass} placeholder="https://facebook.com/..." /></div>
        </div>
      </FormSection>
    </div>
  );
};
