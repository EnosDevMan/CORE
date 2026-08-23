import { useMemo, useState, type FormEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Field } from '../../../components/ui/Field';
import type { UserRole } from '../../../types';
import { NICHE_REGISTRY } from '../../../niches/registry';
import type { NicheId } from '../../../niches/types';
import { THEME_REGISTRY } from '../../../themes/registry';
import type { ThemeId } from '../../../themes/types';
import { onboardingService } from '../services/onboardingService';
import { shouldClaimInstallation } from '../../../auth/authorization';

type Step = 'niche' | 'business' | 'theme' | 'hours' | 'services' | 'team' | 'booking' | 'review';
const steps: readonly Step[] = ['niche', 'business', 'theme', 'hours', 'services', 'team', 'booking', 'review'];
const weekdays = [{ id:1,label:'Seg' },{ id:2,label:'Ter' },{ id:3,label:'Qua' },{ id:4,label:'Qui' },{ id:5,label:'Sex' },{ id:6,label:'Sáb' },{ id:0,label:'Dom' }];

export function OnboardingWizard({ currentRole }: { currentRole: UserRole }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [nicheId, setNicheId] = useState<NicheId>('barbershop');
  const [themeId, setThemeId] = useState<ThemeId>('minimal_light');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [open, setOpen] = useState('09:00');
  const [close, setClose] = useState('18:00');
  const [daysOpen, setDaysOpen] = useState([1, 2, 3, 4, 5, 6]);
  const [services, setServices] = useState(() => [...NICHE_REGISTRY.barbershop.serviceSuggestions]);
  const [professionals, setProfessionals] = useState([{ name: '' }]);
  const [intervalMinutes, setIntervalMinutes] = useState(30);
  const [bookingWindowDays, setBookingWindowDays] = useState(30);
  const [ownerSetupCode, setOwnerSetupCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step = steps[stepIndex];
  const niche = NICHE_REGISTRY[nicheId];
  const themes = useMemo(() => Object.values(THEME_REGISTRY).filter(theme => theme.recommendedNiches.includes(nicheId) || theme.category === 'universal'), [nicheId]);
  const validHours = open < close && daysOpen.length > 0;
  const requiresOwnerClaim = shouldClaimInstallation(currentRole);
  const canContinue = step !== 'business' || (
    businessName.trim().length >= 2
    && (!requiresOwnerClaim || /^[a-f0-9]{64}$/i.test(ownerSetupCode.trim()))
  );

  const chooseNiche = (id: NicheId) => {
    setNicheId(id);
    setThemeId('minimal_light');
    setServices(NICHE_REGISTRY[id].serviceSuggestions.map(item => ({ ...item })));
  };
  const next = () => setStepIndex(index => Math.min(index + 1, steps.length - 1));
  const back = () => setStepIndex(index => Math.max(index - 1, 0));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (step !== 'review') { next(); return; }
    setSaving(true); setError(null);
    try {
      await onboardingService.complete({ businessName, nicheId, themeId, phone, address,
        capabilities: niche.recommendedCapabilities, businessHours: { open, close, daysOpen },
        services: services.filter(item => item.name.trim().length >= 2),
        professionals: professionals.filter(item => item.name.trim().length >= 2),
        intervalMinutes, bookingWindowDays, ownerSetupCode }, requiresOwnerClaim);
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a configuração.');
      setSaving(false);
    }
  };

  return <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:py-12"><form onSubmit={submit} className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-xl flex-col rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:min-h-0 sm:p-8">
    <header className="mb-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Configuração inicial</p><h1 className="mt-2 text-2xl font-black">Prepare seu novo negócio</h1><p className="mt-1 text-sm text-slate-400">Etapa {stepIndex + 1} de {steps.length}</p><div className="mt-4 flex gap-1" aria-hidden="true">{steps.map((item,index)=><span key={item} className={`h-1.5 flex-1 rounded-full ${index<=stepIndex?'bg-amber-400':'bg-slate-700'}`} />)}</div></header>
    <section className="flex-1">
      {step==='niche' && <fieldset><legend className="mb-4 text-lg font-bold">Qual é o seu segmento?</legend><div className="grid gap-3 sm:grid-cols-2">{Object.values(NICHE_REGISTRY).map(item=><label key={item.id} className={`cursor-pointer rounded-2xl border p-4 ${nicheId===item.id?'border-amber-400 bg-amber-400/10':'border-slate-700'}`}><input className="sr-only" type="radio" name="niche" checked={nicheId===item.id} onChange={()=>chooseNiche(item.id)} /><strong>{item.name}</strong><span className="mt-1 block text-sm text-slate-400">{item.professionalLabel} · {item.customerLabel}</span></label>)}</div></fieldset>}
      {step==='business' && <div className="space-y-4"><Field label="Nome do negócio" required minLength={2} value={businessName} onChange={e=>setBusinessName(e.target.value)} autoComplete="organization" />{requiresOwnerClaim && <Field label="Código de instalação do proprietário" hint="Gerado no SQL Editor do Supabase; válido por 24 horas." required minLength={64} maxLength={64} value={ownerSetupCode} onChange={e=>setOwnerSetupCode(e.target.value)} autoComplete="off" />}<Field label="Telefone" hint="Opcional" value={phone} onChange={e=>setPhone(e.target.value)} inputMode="tel" /><Field label="Endereço" hint="Opcional" value={address} onChange={e=>setAddress(e.target.value)} /></div>}
      {step==='theme' && <fieldset><legend className="mb-4 text-lg font-bold">Escolha uma identidade visual</legend><div className="grid gap-3 sm:grid-cols-2">{themes.map(item=><label key={item.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${themeId===item.id?'border-amber-400':'border-slate-700'}`}><input className="sr-only" type="radio" checked={themeId===item.id} onChange={()=>setThemeId(item.id)} /><span className="h-10 w-10 rounded-full" style={{background:item.tokens.primary}} /><strong>{item.name}</strong>{themeId===item.id&&<Check className="ml-auto text-amber-400" />}</label>)}</div></fieldset>}
      {step==='hours' && <div><h2 className="mb-4 text-lg font-bold">Horários de funcionamento</h2><div className="grid grid-cols-2 gap-3"><Field label="Abertura" type="time" value={open} onChange={e=>setOpen(e.target.value)} /><Field label="Fechamento" type="time" value={close} onChange={e=>setClose(e.target.value)} /></div><fieldset className="mt-5"><legend className="mb-3 text-sm font-bold">Dias abertos</legend><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{weekdays.map(day=><label key={day.id} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-bold ${daysOpen.includes(day.id)?'border-amber-400 bg-amber-400/10':'border-slate-700'}`}><input className="sr-only" type="checkbox" checked={daysOpen.includes(day.id)} onChange={()=>setDaysOpen(current=>current.includes(day.id)?current.filter(id=>id!==day.id):[...current,day.id])} />{day.label}</label>)}</div></fieldset>{!validHours&&<p role="alert" className="mt-3 text-sm text-red-300">Escolha ao menos um dia e um fechamento posterior à abertura.</p>}</div>}
      {step==='services' && <div><h2 className="text-lg font-bold">Serviços iniciais</h2><p className="mb-4 text-sm text-slate-400">Sugestões do nicho; edite ou remova livremente.</p><div className="space-y-3">{services.map((item,index)=><div key={index} className="grid grid-cols-[1fr_90px_44px] gap-2"><input aria-label={`Serviço ${index+1}`} className="ui-input" value={item.name} onChange={e=>setServices(current=>current.map((value,i)=>i===index?{...value,name:e.target.value}:value))} /><input aria-label={`Duração do serviço ${index+1}`} type="number" min={5} max={480} className="ui-input" value={item.duration} onChange={e=>setServices(current=>current.map((value,i)=>i===index?{...value,duration:Number(e.target.value)}:value))} /><Button variant="ghost" aria-label={`Remover ${item.name}`} onClick={()=>setServices(current=>current.filter((_,i)=>i!==index))}><Trash2 size={18}/></Button></div>)}</div><Button variant="secondary" className="mt-3" onClick={()=>setServices(current=>[...current,{name:'',duration:30,category:''}])}><Plus size={18}/> Adicionar</Button></div>}
      {step==='team' && <div><h2 className="text-lg font-bold">{niche.professionalLabel}</h2><p className="mb-4 text-sm text-slate-400">Opcional. Você poderá vincular contas e agendas depois.</p><div className="space-y-3">{professionals.map((item,index)=><div key={index} className="flex gap-2"><input aria-label={`Profissional ${index+1}`} className="ui-input" value={item.name} onChange={e=>setProfessionals(current=>current.map((value,i)=>i===index?{name:e.target.value}:value))} /><Button variant="ghost" aria-label="Remover profissional" onClick={()=>setProfessionals(current=>current.filter((_,i)=>i!==index))}><Trash2 size={18}/></Button></div>)}</div><Button variant="secondary" className="mt-3" onClick={()=>setProfessionals(current=>[...current,{name:''}])}><Plus size={18}/> Adicionar</Button></div>}
      {step==='booking' && <div className="space-y-4"><h2 className="text-lg font-bold">Regras da agenda</h2><Field label="Intervalo da grade (minutos)" type="number" min={5} max={480} value={intervalMinutes} onChange={e=>setIntervalMinutes(Number(e.target.value))} /><Field label="Janela para agendar (dias)" type="number" min={1} max={365} value={bookingWindowDays} onChange={e=>setBookingWindowDays(Number(e.target.value))} /></div>}
      {step==='review' && <div><h2 className="text-lg font-bold">Revise a instalação</h2><dl className="mt-4 divide-y divide-slate-700 rounded-2xl border border-slate-700 px-4">{[['Negócio',businessName],['Nicho',niche.name],['Tema',THEME_REGISTRY[themeId].name],['Horário',`${open}–${close}`],['Serviços',String(services.filter(s=>s.name.trim()).length)],['Equipe',String(professionals.filter(p=>p.name.trim()).length)]].map(([term,value])=><div className="py-3" key={term}><dt className="text-xs text-slate-400">{term}</dt><dd className="font-bold">{value}</dd></div>)}</dl>{error&&<p role="alert" className="mt-4 rounded-xl bg-red-950 p-3 text-sm text-red-200">{error}</p>}</div>}
    </section>
    <footer className="mt-8 flex gap-3 border-t border-slate-800 pt-5">{stepIndex>0&&<Button variant="ghost" onClick={back} fullWidth><ChevronLeft size={18}/>Voltar</Button>}<Button type="submit" disabled={saving||!canContinue||(step==='hours'&&!validHours)} fullWidth>{saving?<LoaderCircle className="animate-spin" aria-label="Salvando"/>:step==='review'?'Concluir':<>Continuar<ChevronRight size={18}/></>}</Button></footer>
  </form></main>;
}
