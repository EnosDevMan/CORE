import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useBusinessConfig } from '../store/useApp';
import { PRIVACY_POLICY_VERSION_LABEL } from '../legal';

interface PrivacyPolicyPageProps { onBack: () => void; }
type PolicySection = { title: string; paragraphs?: string[]; items?: string[] };
type PolicyContent = { notice: string; sections: PolicySection[] };

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  const config = useBusinessConfig();
  const [content, setContent] = useState<PolicyContent | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    void fetch('/privacy-policy-content.json')
      .then(response => {
        if (!response.ok) throw new Error('policy');
        return response.json() as Promise<PolicyContent>;
      })
      .then(value => { if (active) setContent(value); })
      .catch(() => { if (active) { setContent(null); setFailed(true); } });
    return () => { active = false; };
  }, [attempt]);

  const text = (value: string) => value
    .replace('{{business}}', config.name || 'nosso estabelecimento')
    .replace('{{address}}', config.address ? ` (${config.address})` : '')
    .replace('{{phone}}', config.phone || '(contato a informar)');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-8">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><ShieldCheck size={20} /></div>
        <h1 className="text-2xl font-extrabold text-slate-900">Termos de Uso e Política de Privacidade</h1>
      </div>
      <p className="text-sm text-slate-400 mb-8">Versão técnica: {PRIVACY_POLICY_VERSION_LABEL}. Revisão jurídica pendente.</p>

      {failed ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Não foi possível carregar a política de privacidade.{' '}
          <button type="button" className="font-bold underline" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>
        </div>
      ) : !content ? (
        <p className="text-sm text-slate-500" role="status">Carregando política de privacidade...</p>
      ) : (
        <>
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 leading-relaxed"><strong>Aviso:</strong> {content.notice}</div>
          <div className="prose prose-slate prose-sm max-w-none space-y-6 text-slate-700 leading-relaxed">
            {content.sections.map(section => (
              <section key={section.title}>
                <h2 className="text-base font-bold text-slate-900 mb-2">{section.title}</h2>
                {section.items && <ul className="list-disc pl-5 space-y-1">{section.items.map(item => <li key={item}>{text(item)}</li>)}</ul>}
                {section.paragraphs?.map(paragraph => <p key={paragraph} className={section.items ? 'mt-2' : undefined}>{text(paragraph)}</p>)}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
