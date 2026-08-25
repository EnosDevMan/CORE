import React, { useEffect, useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import { useApp } from '../../../store/useApp';
import { getErrorMessage } from '../../../utils/errors';
import { parseBRNumber, validateOptionalHttpUrl, validatePhoneBR } from '../../../utils/validation';
import { DailyWorkingHours } from '../../../types';
import { resolveDailyHours } from '../../../utils/scheduling';
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
];

/**
 * Precisa viver FORA de `AdminSettingsTab` (não dentro do corpo dela).
 * Antes, era definida dentro do componente e, por isso, o React recriava
 * uma FUNÇÃO/COMPONENTE NOVA a cada re-render — e como o formulário
 * re-renderiza a cada tecla digitada (estado controlado), o React tratava
 * cada `<FormSection>` como um componente diferente do anterior a cada
 * letra, desmontando e remontando o card inteiro. Isso derrubava o foco
 * do campo que estava sendo editado e, no celular, fechava o teclado a
 * cada tecla. Definindo aqui fora, a identidade do componente fica
 * estável entre renders e o React só atualiza o conteúdo, sem desmontar.
 */
const FormSection: React.FC<{
  id: string;
  title: string;
  expandedSection: string | null;
  setExpandedSection: (id: string | null) => void;
  children: React.ReactNode;
}> = ({ id, title, expandedSection, setExpandedSection, children }) => {
  const isExpanded = expandedSection === id;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`settings-section-${id}`}
        onClick={() => setExpandedSection(isExpanded ? null : id)}
        className="hidden md:block w-full text-left"
      >
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <h3 className="font-extrabold text-slate-900 text-lg">{title}</h3>
        </div>
      </button>

      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={`settings-section-${id}`}
          onClick={() => setExpandedSection(isExpanded ? null : id)}
          className="w-full text-left p-4 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
        >
          <h3 className="font-bold text-slate-900">{title}</h3>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <div id={`settings-section-${id}`} className={`overflow-hidden transition-all duration-300 md:block ${isExpanded ? 'max-h-none' : 'max-h-0 md:max-h-none'}`}>
        <div className="p-6 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ showFeedback }) => {
  const { config, updateConfig } = useApp();

  const [confName, setConfName] = useState(config.name);
  const [confAddress, setConfAddress] = useState(config.address);
  const [confPhone, setConfPhone] = useState(config.phone);
  const [weeklySchedule, setWeeklySchedule] = useState<Record<number, DailyWorkingHours>>(() =>
    Object.fromEntries(WEEK_DAYS.map(day => [day.id, resolveDailyHours(config.workingHours, day.id)]))
  );
  const [confFee, setConfFee] = useState(config.bookingFee.toString());
  const [confPixKey, setConfPixKey] = useState(config.pixKey || '');
  const [confInterval, setConfInterval] = useState(config.intervalMinutes.toString());
  const [confBookingWindowDays, setConfBookingWindowDays] = useState(config.bookingWindowDays.toString());
  const [confMinimumNotice, setConfMinimumNotice] = useState((config.minimumNoticeMinutes ?? 30).toString());
  const [confCancellationNotice, setConfCancellationNotice] = useState((config.cancellationNoticeMinutes ?? 0).toString());
  const [confInsta, setConfInsta] = useState(config.socialLinks.instagram || '');
  const [confFb, setConfFb] = useState(config.socialLinks.facebook || '');
  const [confHeroTitle, setConfHeroTitle] = useState(config.heroTitle || '');
  const [confHeroSubtitle, setConfHeroSubtitle] = useState(config.heroSubtitle || '');
  const [confHeroDescription, setConfHeroDescription] = useState(config.heroDescription || '');
  const [confAboutText, setConfAboutText] = useState(config.aboutText || '');
  const [isSaving, setIsSaving] = useState(false);

  // A configuração chega de forma assíncrona. Sem esta sincronização, abrir
  // esta aba durante o carregamento mantinha os dias do placeholder e salvar
  // qualquer outro campo podia sobrescrever a agenda semanal real.
  useEffect(() => {
    setWeeklySchedule(Object.fromEntries(
      WEEK_DAYS.map(day => [day.id, resolveDailyHours(config.workingHours, day.id)])
    ));
  }, [config.workingHours]);

  // Estado para abas expansíveis (mobile)
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  const updateDay = (day: number, patch: Partial<DailyWorkingHours>) =>
    setWeeklySchedule(current => ({ ...current, [day]: { ...current[day], ...patch } }));

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
    if (confAddress.trim().length > 500 || confPhone.trim().length > 32) {
      showFeedback('Revise o endereço (até 500 caracteres) e o telefone (até 32).', true);
      return;
    }
    if (!validatePhoneBR(confPhone)) {
      showFeedback('Informe um telefone brasileiro válido com DDD.', true);
      return;
    }
    if (confPixKey.trim().length > 320 || confHeroTitle.trim().length > 160
      || confHeroSubtitle.trim().length > 240 || confHeroDescription.trim().length > 1000
      || confAboutText.trim().length > 2000 || confInsta.trim().length > 2048
      || confFb.trim().length > 2048) {
      showFeedback('Um dos textos ultrapassa o limite permitido.', true);
      return;
    }
    if (!validateOptionalHttpUrl(confInsta) || !validateOptionalHttpUrl(confFb)) {
      showFeedback('Informe links completos e válidos para Instagram e Facebook, começando com http:// ou https://.', true);
      return;
    }
    if (!Number.isInteger(intervalMinutes) || intervalMinutes < 5 || intervalMinutes > 480) {
      showFeedback('O intervalo dos horários deve ser um número inteiro entre 5 e 480 minutos.', true);
      return;
    }
    if (!Number.isInteger(bookingWindowDays) || bookingWindowDays < 1 || bookingWindowDays > 365) {
      showFeedback('A janela de agendamento deve ser um número inteiro entre 1 e 365 dias.', true);
      return;
    }
    if (!Number.isInteger(minimumNoticeMinutes) || minimumNoticeMinutes < 0 || minimumNoticeMinutes > 525600) {
      showFeedback('A antecedência mínima deve ser um número inteiro entre 0 e 525.600 minutos.', true);
      return;
    }
    if (!Number.isInteger(cancellationNoticeMinutes) || cancellationNoticeMinutes < 0 || cancellationNoticeMinutes > 525600) {
      showFeedback('O prazo de cancelamento deve ser um número inteiro entre 0 e 525.600 minutos.', true);
      return;
    }
    if (!Number.isFinite(bookingFee) || bookingFee < 0 || bookingFee > 99_999_999.99) {
      showFeedback('A taxa de reserva deve ser um valor válido entre R$ 0,00 e R$ 99.999.999,99.', true);
      return;
    }
    if (bookingFee > 0 && !confPixKey.trim()) {
      showFeedback('Informe uma chave PIX para cobrar taxa de reserva.', true);
      return;
    }
    const invalidDay = WEEK_DAYS.find(day => {
      const hours = weeklySchedule[day.id];
      return !hours.closed && (!hours.open || !hours.close || hours.open >= hours.close);
    });
    if (invalidDay) {
      showFeedback(`O horário de ${invalidDay.label} precisa abrir antes do fechamento.`, true);
      return;
    }

    try {
      setIsSaving(true);
      const firstOpenDay = WEEK_DAYS.find(day => !weeklySchedule[day.id].closed);
      const legacyHours = firstOpenDay ? weeklySchedule[firstOpenDay.id] : weeklySchedule[1];
      await updateConfig({
        name: confName.trim(),
        address: confAddress.trim(),
        phone: confPhone.trim(),
        workingHours: {
          // Mantém o formato legado coerente mesmo quando segunda está
          // fechada; integrações antigas ainda consultam estes dois campos.
          open: legacyHours.open,
          close: legacyHours.close,
          daysOpen: WEEK_DAYS.filter(day => !weeklySchedule[day.id].closed).map(day => day.id).sort(),
          weeklySchedule
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
          facebook: confFb.trim()
        },
        heroTitle: confHeroTitle.trim(),
        heroSubtitle: confHeroSubtitle.trim(),
        heroDescription: confHeroDescription.trim(),
        aboutText: confAboutText.trim(),
        logo: config.logo
      });
      showFeedback('Configurações salvas com sucesso!', false);
    } catch (err) {
      showFeedback(getErrorMessage(err, 'Erro ao salvar configurações.'), true);
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Botão Salvar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Configurações do Salão</h2>
            <p className="text-sm text-slate-500 mt-1">Ajuste as preferências globais do sistema</p>
          </div>
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-slate-900/10 w-full sm:w-auto"
          >
            <Save size={18} />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Formulário - Grid responsivo */}
      <div className="space-y-6">
        {/* Seção 1: Informações Básicas */}
        <FormSection id="basic" title="📋 Informações Básicas" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nome do Estabelecimento</label>
              <input 
                type="text" 
                aria-label="Nome do estabelecimento"
                minLength={2}
                maxLength={100}
                value={confName} 
                onChange={e => setConfName(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Endereço Completo</label>
              <input 
                type="text" 
                aria-label="Endereço completo"
                maxLength={500}
                value={confAddress} 
                onChange={e => setConfAddress(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Telefone (WhatsApp)</label>
              <input 
                type="tel"
                aria-label="Telefone do estabelecimento"
                maxLength={32}
                value={confPhone} 
                onChange={e => setConfPhone(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
              />
            </div>
          </div>
        </FormSection>

        {/* Seção 2: Horários e Agendamento */}
        <FormSection id="schedule" title="⏰ Horários e Agendamento" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
          <div className="space-y-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Agenda semanal do estabelecimento</label>
                <p className="text-xs text-slate-500 mt-1">Defina o funcionamento geral; a disponibilidade individual continua configurada em cada barbeiro.</p>
              </div>
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {WEEK_DAYS.map(day => {
                  const hours = weeklySchedule[day.id];
                  return <div key={day.id} className="grid grid-cols-1 sm:grid-cols-[8rem_1fr] gap-3 p-3 bg-white items-center">
                    <label className="flex items-center gap-2 font-bold text-sm text-slate-800">
                      <input type="checkbox" checked={!hours.closed} onChange={event => updateDay(day.id, { closed: !event.target.checked })} />
                      {day.label}
                    </label>
                    {hours.closed ? <span className="text-xs font-semibold text-slate-400">Fechado</span> : <div className="grid grid-cols-2 gap-2 items-center">
                      <input aria-label={`Abertura ${day.label}`} type="time" value={hours.open} onChange={event => updateDay(day.id, { open: event.target.value })} className="min-w-0 w-full px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-white" />
                      <input aria-label={`Fechamento ${day.label}`} type="time" value={hours.close} onChange={event => updateDay(day.id, { close: event.target.value })} className="min-w-0 w-full px-3 py-2 border border-slate-200 rounded-lg text-base sm:text-sm bg-white" />
                    </div>}
                  </div>;
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Intervalo dos horários (min)</label>
                <input 
                  type="number" 
                  aria-label="Intervalo dos horários em minutos"
                  min="5"
                  max="480"
                  step="5"
                  value={confInterval} 
                  onChange={e => setConfInterval(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Agenda aberta por (dias)</label>
                <input
                  type="number"
                  aria-label="Janela de agendamento em dias"
                  min="1"
                  max="365"
                  step="1"
                  value={confBookingWindowDays}
                  onChange={e => setConfBookingWindowDays(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm"
                />
                <p className="text-xs text-slate-500">Inclui o dia de hoje</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Antecedência mínima (min)</label>
                <input
                  type="number"
                  aria-label="Antecedência mínima para agendar em minutos"
                  min="0"
                  max="525600"
                  step="1"
                  value={confMinimumNotice}
                  onChange={event => setConfMinimumNotice(event.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm"
                />
                <p className="text-xs text-slate-500">Use 0 para permitir reservas até o horário de início</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Prazo para cancelar (min)</label>
                <input
                  type="number"
                  aria-label="Antecedência mínima para cancelamento em minutos"
                  min="0"
                  max="525600"
                  step="1"
                  value={confCancellationNotice}
                  onChange={event => setConfCancellationNotice(event.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm"
                />
                <p className="text-xs text-slate-500">Ex.: 120 corresponde a 2 horas</p>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection id="blocks" title="🚫 Intervalos, Bloqueios e Feriados" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
          <div>
            <p className="text-sm text-slate-500 mb-5">Centralize indisponibilidades do estabelecimento e dos profissionais sem ocupar a agenda de atendimentos.</p>
            <ScheduleBlockForm showFeedback={showFeedback} />
          </div>
        </FormSection>

        {/* Seção 3: Pagamento e Taxas */}
        <FormSection id="payment" title="💳 Pagamento e Taxas" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Taxa de Reserva (R$)</label>
              <input 
                type="text" 
                aria-label="Taxa de reserva"
                maxLength={32}
                inputMode="decimal" 
                value={confFee} 
                onChange={e => setConfFee(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
                placeholder="0,00"
              />
              <p className="text-xs text-slate-500">Coloque 0 para desativar a cobrança</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chave PIX Recebedora</label>
              <input 
                type="text" 
                aria-label="Chave PIX recebedora"
                maxLength={320}
                value={confPixKey} 
                onChange={e => setConfPixKey(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
                placeholder="CNPJ, Email, Celular..." 
              />
              <p className="text-xs text-slate-500">
                Chave única usada em todos os agendamentos. Somente administradores podem alterá-la.
              </p>
            </div>
          </div>
        </FormSection>

        {/* Seção 4: Customização do Site */}
        <FormSection id="customization" title="🎨 Customização do Site" expandedSection={expandedSection} setExpandedSection={setExpandedSection}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Título Principal</label>
              <input 
                type="text" 
                aria-label="Título principal"
                maxLength={160}
                value={confHeroTitle} 
                onChange={e => setConfHeroTitle(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
                placeholder="Ex: Elevando o padrão..." 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Subtítulo</label>
              <input 
                type="text" 
                aria-label="Subtítulo"
                maxLength={240}
                value={confHeroSubtitle} 
                onChange={e => setConfHeroSubtitle(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
                placeholder="Ex: Barbearia Premium em São Paulo" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição Curta</label>
              <textarea 
                aria-label="Descrição curta"
                maxLength={1000}
                value={confHeroDescription} 
                onChange={e => setConfHeroDescription(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm min-h-[80px]" 
                placeholder="Mais que um corte de cabelo..." 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Texto &quot;Sobre Nós&quot;</label>
              <textarea 
                aria-label="Texto sobre nós"
                maxLength={2000}
                value={confAboutText} 
                onChange={e => setConfAboutText(e.target.value)} 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm min-h-[100px]" 
                placeholder="Nossa história..." 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Link Instagram</label>
                <input 
                  type="url" 
                  aria-label="Link do Instagram"
                  maxLength={2048}
                  value={confInsta} 
                  onChange={e => setConfInsta(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
                  placeholder="https://instagram.com/..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Link Facebook</label>
                <input 
                  type="url" 
                  aria-label="Link do Facebook"
                  maxLength={2048}
                  value={confFb} 
                  onChange={e => setConfFb(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-medium text-sm" 
                  placeholder="https://facebook.com/..." 
                />
              </div>
            </div>
          </div>
        </FormSection>
      </div>
    </div>
  );
};
