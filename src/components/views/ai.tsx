'use client';

import { label } from '@/lib/format';

import { useRef, useState } from 'react';
import {
  BrainCircuit, FileSearch, Leaf, Send, ShieldCheck, Sparkles, Users, Waves,
} from 'lucide-react';
import { Callout, Panel, Pill } from '@/components/ui';
import type { AIResponse } from '@/lib/types';
import type { ViewProps } from './types';

const AGENTS = [
  { key: 'ESG Corporate Analyst', label: 'Analista ESG corporativo', icon: BrainCircuit, hint: 'Lectura integral del espacio de trabajo' },
  { key: 'Double Materiality Specialist', label: 'Especialista en materialidad', icon: Sparkles, hint: 'Dos ejes, umbrales y evidencia' },
  { key: 'Climate & Nature Analyst', label: 'Analista de clima y naturaleza', icon: Leaf, hint: 'Escenarios, GEI y dependencias' },
  { key: 'Human Rights Analyst', label: 'Analista de derechos humanos', icon: Users, hint: 'Severidad, reclamos y remediación' },
  { key: 'Disclosure Analyst', label: 'Analista de divulgación', icon: FileSearch, hint: 'Cobertura, brechas y marcos' },
  { key: 'Risk & Controls Analyst', label: 'Analista de riesgos y controles', icon: ShieldCheck, hint: 'Exposición, residual y hallazgos' },
];

const SUGGESTIONS: Record<string, string[]> = {
  'ESG Corporate Analyst': ['Resume los asuntos materiales y los IRO críticos', '¿Dónde están las principales brechas de datos?', '¿Qué debería revisar la dirección esta semana?'],
  'Double Materiality Specialist': ['¿Qué asuntos son doble material?', 'Explica por qué un impacto crítico no se compensa', '¿Cómo se relacionan los IRO con los umbrales?'],
  'Climate & Nature Analyst': ['¿Cuál es la exposición climática?', 'Resume los escenarios y sus límites', '¿Qué dependencias de naturaleza son críticas?'],
  'Human Rights Analyst': ['¿Qué riesgos de derechos humanos están abiertos?', 'Resume los reclamos y la remediación', '¿Cómo está la debida diligencia de proveedores?'],
  'Disclosure Analyst': ['¿Cuál es la cobertura por marco?', '¿Qué brechas ESRS y CDP existen?', '¿Qué evidencia falta para el reporte?'],
  'Risk & Controls Analyst': ['Resume los riesgos críticos y el residual', '¿Qué controles tienen deficiencias?', '¿Qué oportunidades de transición existen?'],
};

type Message = { role: 'user' | 'assistant'; content: string; response?: AIResponse };

function renderRich(text: string) {
  return text.split('\n\n').map((paragraph, pIdx) => {
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={pIdx}>
        {parts.map((part, idx) => part.startsWith('**') && part.endsWith('**')
          ? <strong key={idx}>{part.slice(2, -2)}</strong>
          : <span key={idx}>{part}</span>)}
      </p>
    );
  });
}

export default function AIView({ workspace, actions }: ViewProps) {
  const [agent, setAgent] = useState(AGENTS[0].key);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `**Asistente ESG de ${workspace.company.shortName}**\n\nEstoy conectado al espacio de trabajo actual: ${workspace.iros.length} IRO, ${workspace.materialityTopics.filter((t) => t.materiality !== 'not').length} asuntos materiales y ${workspace.kpis.length} indicadores.\n\nMis respuestas se basan en los registros de la base de datos y citan sus fuentes. No apruebo resultados de materialidad, no emito una opinión de aseguramiento y no sustituyo el juicio de la dirección.`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const activeAgent = AGENTS.find((a) => a.key === agent) || AGENTS[0];
  const ActiveIcon = activeAgent.icon;

  async function send(prompt: string) {
    const text = prompt.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: workspace.company.id, prompt: text, agent }),
      });
      if (!res.ok) throw new Error('No se pudo obtener respuesta');
      const data = (await res.json()) as AIResponse;
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, response: data }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: e instanceof Error ? e.message : 'Error al consultar el asistente.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Inteligencia ESG fundamentada</div>
          <h1>Inteligencia ESG</h1>
          <p>Agentes de análisis anclados a los registros del workspace. Cada respuesta identifica sus fuentes, su clasificación y sus límites. Ningún agente aprueba materialidad ni sustituye la decisión humana.</p>
        </div>
        <div className="page-head-actions">
          <Pill variant="amber">Sin modelo externo</Pill>
          <Pill variant="blue">Análisis determinista</Pill>
        </div>
      </div>

      <div className="ai-shell">
        <Panel className="ai-agents" pad tight>
          <div className="eyebrow" style={{ padding: '2px 6px 8px' }}>Agentes</div>
          {AGENTS.map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.key} className={`agent-item ${agent === a.key ? 'active' : ''}`} onClick={() => setAgent(a.key)}>
                <span className="agent-icon"><Icon size={13} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 550 }}>{a.label}</span>
                  <span style={{ display: 'block', fontSize: 8, color: 'var(--muted)' }}>{a.hint}</span>
                </span>
              </button>
            );
          })}
          <div className="divider" />
          <div className="notice" style={{ padding: '0 6px' }}>
            Los agentes leen el workspace seleccionado. No acceden a datos de otras empresas ni a sistemas externos.
          </div>
        </Panel>

        <Panel className="ai-chat flush">
          <div className="panel-header" style={{ paddingBottom: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--green-soft)', color: '#6fbf8f' }}><ActiveIcon size={15} /></div>
            <div>
              <h3>{activeAgent.label}</h3>
              <p>{workspace.company.name} · {activeAgent.hint}</p>
            </div>
            <div className="panel-actions"><Pill variant="green">Conectado al workspace</Pill></div>
          </div>
          <div className="ai-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-msg ${label(m.role)}`}>
                {m.role === 'assistant' ? (
                  <>
                    {renderRich(m.content)}
                    {m.response && (
                      <>
                        <div className="ai-source-list">
                          {m.response.sources.map((s) => <span key={s.label} className="ai-source">{s.label}: {s.value}</span>)}
                        </div>
                        <div className="row wrap" style={{ marginTop: 8, gap: 5 }}>
                          <Pill variant={m.response.confidence === 'High' ? 'green' : m.response.confidence === 'Medium' ? 'amber' : 'red'}>{m.response.confidence} confianza</Pill>
                          <Pill variant="gray">{m.response.classification}</Pill>
                        </div>
                        {m.response.suggestedActions.length > 0 && (
                          <div className="ai-source-list" style={{ marginTop: 6 }}>
                            {m.response.suggestedActions.map((a) => <button key={a} className="ai-suggestion" onClick={() => send(a)}>{a}</button>)}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : m.content}
              </div>
            ))}
            {loading && <div className="ai-msg assistant"><span className="micro">Analizando los registros del workspace…</span></div>}
            <div ref={endRef} />
          </div>
          <div className="ai-suggestions">
            {(SUGGESTIONS[agent] || SUGGESTIONS['ESG Corporate Analyst']).map((s) => (
              <button key={s} className="ai-suggestion" onClick={() => send(s)} disabled={loading}>{s}</button>
            ))}
          </div>
          <div className="ai-compose">
            <textarea
              placeholder={`Pregunta sobre ${workspace.company.shortName}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
            />
            <button className="btn primary" onClick={() => send(input)} disabled={loading || !input.trim()}><Send size={13} /></button>
          </div>
        </Panel>
      </div>

      <div className="grid grid-3" style={{ marginTop: 14 }}>
        <Panel pad>
          <div className="section-head"><div><h3>Cómo funciona</h3><p>Arquitectura de la capa de análisis.</p></div><BrainCircuit size={15} className="muted" /></div>
          <p style={{ fontSize: 10.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Las respuestas se generan con reglas deterministas sobre SQLite. La plataforma clasifica la consulta, selecciona registros, calcula agregados y construye una explicación con fuentes. No se envía información a un proveedor externo de modelos.
          </p>
          <div className="divider" />
          <div className="notice">La capa está diseñada para sustituirse por un proveedor de modelos con recuperación documental, manteniendo las mismas reglas de citación y límites.</div>
        </Panel>
        <Panel pad>
          <div className="section-head"><div><h3>Salvaguardas</h3><p>Qué no hace el asistente.</p></div><ShieldCheck size={15} className="muted" /></div>
          <div className="stack" style={{ gap: 7 }}>
            <div className="callout"><ShieldCheck size={15} /><div>No aprueba asuntos materiales ni cierra hallazgos.</div></div>
            <div className="callout"><ShieldCheck size={15} /><div>No inventa datos fuera del workspace.</div></div>
            <div className="callout"><ShieldCheck size={15} /><div>No emite una opinión de aseguramiento.</div></div>
          </div>
        </Panel>
        <Panel pad>
          <div className="section-head"><div><h3>Contexto disponible</h3><p>Lo que el agente puede leer.</p></div><Waves size={15} className="muted" /></div>
          <div className="metric-strip" style={{ marginBottom: 10 }}>
            <div><div className="label">IRO</div><div className="value">{workspace.iros.length}</div></div>
            <div><div className="label">KPIs</div><div className="value">{workspace.kpis.length}</div></div>
            <div><div className="label">Divulgaciones</div><div className="value">{workspace.disclosures.length}</div></div>
          </div>
          <div className="notice">El agente no tiene memoria entre sesiones ni modifica la base de datos, salvo el registro de la consulta en el audit trail.</div>
        </Panel>
      </div>
    </div>
  );
}
