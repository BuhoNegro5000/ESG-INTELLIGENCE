'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, Check, ClipboardCheck, FileText, GitBranch, Layers3, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react';
import { MaterialityMatrix } from '@/components/charts';
import { Callout, EmptyState, MaterialityPill, Panel, PanelHead, Pill, Progress, ScoreBox, Tabs } from '@/components/ui';
import { dateLabel, materialityLabel, pct } from '@/lib/format';
import type { MaterialityTopic } from '@/lib/types';
import type { ViewProps } from './types';

const STAGES = [
  ['Preparación', 'Perímetro, metodología, equipo y estándares de referencia.'],
  ['Contexto y cadena de valor', 'Modelo de negocio, actividades, geografías y relaciones empresariales.'],
  ['Stakeholder intelligence', 'Identificación, derechos, exposición y evidencia de participación.'],
  ['Universo de temas ESG', 'Biblioteca configurable de asuntos y subtemas.'],
  ['Registro IRO', 'Identificación de impactos, riesgos y oportunidades con trazabilidad.'],
  ['Evaluación de impacto', 'Escala, alcance, irremediabilidad y probabilidad.'],
  ['Evaluación financiera', 'Probabilidad, magnitud y horizontes temporales.'],
  ['Revisión técnica', 'Calidad de evidencia, coherencia y umbrales aprobados.'],
  ['Aprobación y publicación', 'Revisión de dirección, aprobación, publicación y seguimiento.'],
];

export default function MaterialityView({ workspace, actions }: ViewProps) {
  const { assessment, assessments, materialityTopics, materialityDistribution, iros, topics } = workspace;
  const [tab, setTab] = useState('assessment');
  const [selectedCode, setSelectedCode] = useState<string | null>(materialityTopics[0]?.code || null);
  const [busy, setBusy] = useState(false);
  const selected = materialityTopics.find((t) => t.code === selectedCode) || materialityTopics[0] || null;
  const selectedIros = selected ? iros.filter((i) => i.topicCode === selected.code) : [];
  const material = materialityTopics.filter((t) => t.materiality !== 'not');
  const critical = iros.filter((i) => i.critical);

  const grouped = useMemo(() => {
    const map: Record<string, typeof topics> = { E: [], S: [], G: [] };
    for (const t of topics) map[t.dimension]?.push(t);
    return map;
  }, [topics]);

  async function advance() {
    if (!assessment || assessment.stage >= 9 || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: assessment.stage + 1 }),
      });
      if (!res.ok) throw new Error('No se pudo avanzar la etapa');
      await actions.refresh();
      actions.notify(`Evaluación avanzada a la etapa ${assessment.stage + 1}/9. El cambio quedó registrado en el audit trail.`);
    } catch (e) {
      actions.notify(e instanceof Error ? e.message : 'Error al actualizar la evaluación');
    } finally {
      setBusy(false);
    }
  }

  async function createVersion() {
    setBusy(true);
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: workspace.company.id }),
      });
      if (!res.ok) throw new Error('No se pudo crear la versión');
      await actions.refresh();
      actions.notify('Nueva versión de evaluación creada en estado Draft. La versión anterior se conserva íntegra.');
    } catch (e) {
      actions.notify(e instanceof Error ? e.message : 'Error al crear la versión');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Centro de inteligencia de doble materialidad</div>
          <h1>Doble materialidad</h1>
          <p>Un proceso metodológico, documental y participativo para decidir qué asuntos son materiales desde dos perspectivas independientes: impacto y financiera.</p>
        </div>
        <div className="page-head-actions">
          <button className="btn" onClick={createVersion} disabled={busy}><GitBranch size={13} /> Nueva versión</button>
          <button className="btn primary" onClick={advance} disabled={!assessment || assessment.stage >= 9 || busy}><ArrowRight size={13} /> {(assessment?.stage || 0) >= 9 ? 'Evaluación aprobada' : `Avanzar a etapa ${(assessment?.stage || 0) + 1}`}</button>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label">Asuntos materiales</div><div className="stat-value">{material.length}</div><div className="stat-foot">de {materialityTopics.length} temas evaluados</div></div>
        <div className="panel stat-card"><div className="stat-label">Doble material</div><div className="stat-value" style={{ color: 'var(--amber)' }}>{material.filter((t) => t.materiality === 'both').length}</div><div className="stat-foot">impacto + financiera</div></div>
        <div className="panel stat-card"><div className="stat-label">IRO críticos</div><div className="stat-value" style={{ color: 'var(--terracotta)' }}>{critical.length}</div><div className="stat-foot">consideración prioritaria</div></div>
        <div className="panel stat-card"><div className="stat-label">Progreso del proceso</div><div className="stat-value">{assessment?.progress || 0}<small>%</small></div><div className="stat-foot">etapa {assessment?.stage || 0}/9 · {assessment?.status}</div></div>
      </div>

      <Panel style={{ marginTop: 14 }} pad>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div className="row wrap"><Pill variant="green">{assessment?.version}</Pill><Pill variant="amber">{assessment?.status}</Pill><Pill variant="gray">{assessment?.period}</Pill></div>
            <h3 style={{ marginTop: 8 }}>{assessment?.title || 'Evaluación de doble materialidad'}</h3>
            <div className="micro" style={{ marginTop: 4 }}>{assessment?.scope} · Responsable: {assessment?.owner} · Revisor: {assessment?.reviewer}</div>
          </div>
          <div style={{ width: 240 }}>
            <div className="row"><span className="micro">Avance</span><span className="micro" style={{ marginLeft: 'auto' }}>{assessment?.progress || 0}%</span></div>
            <Progress value={assessment?.progress || 0} tone="amber" height={6} />
            <div className="micro" style={{ marginTop: 5 }}>Umbrales: impacto ≥ {assessment?.thresholdImpact} · financiero ≥ {assessment?.thresholdFinancial}</div>
          </div>
        </div>
        <div className="stepper" style={{ marginTop: 18 }}>
          {STAGES.map(([name], idx) => {
            const n = idx + 1;
            const done = (assessment?.stage || 0) > n;
            const current = assessment?.stage === n;
            return <div key={name} className={`step ${done ? 'done' : ''} ${current ? 'current' : ''}`}><div className="step-dot">{done ? <Check size={10} /> : n}</div><div className="step-copy"><div className="step-name">{name}</div></div></div>;
          })}
        </div>
      </Panel>

      <div style={{ marginTop: 14 }}><Tabs active={tab} onChange={setTab} items={[{ key: 'assessment', label: 'Evaluación' }, { key: 'matrix', label: 'Matriz de doble materialidad' }, { key: 'topics', label: 'Universo de temas' }, { key: 'approval', label: 'Gobernanza y aprobación' }]} /></div>

      {tab === 'assessment' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Configuración metodológica</h3><p>Parámetros que se conservan con la versión de la evaluación.</p></div><SlidersHorizontal size={15} className="muted" /></div>
            <div className="grid grid-2" style={{ gap: 10 }}>
              <div className="mini-card"><div className="label">Objetivo</div><div style={{ fontSize: 10.5, marginTop: 5 }}>Identificar asuntos materiales y determinar la información a divulgar para el período {assessment?.period}.</div></div>
              <div className="mini-card"><div className="label">Estándares de referencia</div><div style={{ fontSize: 10.5, marginTop: 5 }}>ESRS 1 / ESRS 2 · EFRAG IG1 (2025) · IFRS S1/S2 · GRI · TNFD LEAP.</div></div>
              <div className="mini-card"><div className="label">Alcance organizacional</div><div style={{ fontSize: 10.5, marginTop: 5 }}>{assessment?.scope}</div></div>
              <div className="mini-card"><div className="label">Exclusiones registradas</div><div style={{ fontSize: 10.5, marginTop: 5 }}>Entidades sin control operacional y actividades discontinuadas. Justificación conservada en el expediente.</div></div>
              <div className="mini-card"><div className="label">Metodología</div><div style={{ fontSize: 10.5, marginTop: 5 }}>{assessment?.methodology}</div></div>
              <div className="mini-card"><div className="label">Regla de decisión</div><div style={{ fontSize: 10.5, marginTop: 5 }}>Dos ejes independientes. No se agregan en un índice único. Un impacto crítico no se compensa con un resultado financiero.</div></div>
            </div>
            <div className="divider" />
            <Callout tone="amber"><strong>Control metodológico.</strong> La participación de stakeholders aporta evidencia, pero no sustituye el juicio metodológico ni la responsabilidad de aprobación de la empresa. La IA no aprueba resultados.</Callout>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Etapa actual · {STAGES[Math.max(0, (assessment?.stage || 1) - 1)][0]}</h3><p>{STAGES[Math.max(0, (assessment?.stage || 1) - 1)][1]}</p></div></div>
            <div className="stack">
              <div className="mini-card"><div className="label">Evidencia mínima</div><div style={{ fontSize: 10.5, marginTop: 5 }}>Registro de decisiones, fuentes de datos, actas de participación, evaluación de severidad y justificación de umbrales.</div></div>
              <div className="mini-card"><div className="label">Responsable</div><div style={{ fontSize: 12, fontWeight: 600, marginTop: 3 }}>{assessment?.owner}</div><div className="micro">Revisor: {assessment?.reviewer}</div></div>
              <div className="mini-card"><div className="label">Notas de revisión</div><div style={{ fontSize: 10.5, marginTop: 5 }}>{assessment?.notes}</div></div>
            </div>
            <div className="divider" />
            <div className="row"><Pill variant="blue"><ShieldCheck size={11} /> Versionado</Pill><span className="micro" style={{ marginLeft: 'auto' }}>{assessments.length} versión(es)</span></div>
            <div className="notice" style={{ marginTop: 6 }}>Cada cierre conserva reglas, umbrales, evidencias y aprobaciones. Las evaluaciones anteriores no se sobrescriben.</div>
          </Panel>
          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Distribución de la cartera de asuntos</h3><p>Lectura de los dos ejes sin agregación.</p></div></div>
            <div className="grid grid-4">
              {[
                ['Doble material', materialityDistribution.both, 'var(--amber)'],
                ['Material por impacto', materialityDistribution.impact, 'var(--terracotta)'],
                ['Material financiero', materialityDistribution.financial, 'var(--ocean)'],
                ['No material', materialityDistribution.not, 'var(--muted)'],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="mini-card"><div className="label">{label}</div><div className="value" style={{ color: String(color) }}>{String(value)}</div><div className="foot">IROs en esta categoría</div></div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'matrix' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8">
            <PanelHead title="Matriz de doble materialidad" subtitle="Cada punto es un asunto con uno o más IRO. El tamaño refleja el número de registros." actions={<Pill variant="amber">{material.length} materiales</Pill>} />
            <div className="panel-body" style={{ paddingTop: 6 }}>
              <MaterialityMatrix topics={materialityTopics} selectedCode={selected?.code} onSelect={(t) => setSelectedCode(t.code)} height={420} />
            </div>
          </Panel>
          <Panel className="col-4">
            <PanelHead title={selected?.name || 'Selecciona un asunto'} subtitle={selected ? `${selected.esrs} · ${selected.count} IRO asociados` : 'Ficha contextual'} actions={selected && <MaterialityPill value={selected.materiality} />} />
            <div className="panel-body" style={{ paddingTop: 10 }}>
              {selected ? (
                <>
                  <div className="row" style={{ marginBottom: 10 }}>
                    <ScoreBox value={selected.impact.toFixed(1)} label="Impacto" tone="red" />
                    <ScoreBox value={selected.financial.toFixed(1)} label="Financiero" tone="blue" />
                    <div style={{ flex: 1 }} />
                    <Pill variant={selected.critical ? 'red' : 'gray'}>{selected.critical ? 'Crítico' : 'No crítico'}</Pill>
                  </div>
                  <div className="stack" style={{ gap: 8 }}>
                    {selectedIros.map((iro) => (
                      <div key={iro.id} className="mini-card" style={{ cursor: 'pointer' }} onClick={() => actions.openIRO(iro)}>
                        <div className="row"><span className="mono" style={{ fontSize: 8.5 }}>{iro.code}</span><span className="micro" style={{ marginLeft: 'auto' }}>{iro.type} · {iro.actuality}</span></div>
                        <div style={{ fontSize: 10.5, fontWeight: 550, marginTop: 4 }}>{iro.title}</div>
                        <div className="micro" style={{ marginTop: 3 }}>{iro.location} · {iro.stage}</div>
                        <div className="row" style={{ marginTop: 6 }}><span className="micro">Stakeholders: {iro.stakeholder}</span></div>
                      </div>
                    ))}
                  </div>
                  <div className="divider" />
                  <div className="micro">Justificación</div>
                  <p style={{ fontSize: 10, marginTop: 4, color: 'var(--text-2)' }}>{selectedIros[0]?.description}</p>
                  <div className="micro" style={{ marginTop: 8 }}>Evidencia</div>
                  <div className="tag-list" style={{ marginTop: 4 }}>{selectedIros.slice(0, 3).map((i) => <span key={i.id} className="chip">{i.evidence}</span>)}</div>
                </>
              ) : <EmptyState title="Sin asunto seleccionado" text="Selecciona un punto de la matriz para ver sus IRO, evidencia, stakeholders y justificación." />}
            </div>
          </Panel>
          <Panel className="col-12">
            <PanelHead title="Asuntos materiales" subtitle="Clasificación, umbrales y vínculo con el registro IRO." actions={<Pill variant="gray">{materialityTopics.length} asuntos evaluados</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Asunto</th><th>Dimensión</th><th>Marco</th><th className="num">Impacto</th><th className="num">Financiero</th><th>Clasificación</th><th className="num">IRO</th><th>Estado</th></tr></thead>
                <tbody>
                  {materialityTopics.map((t) => (
                    <tr key={t.code} onClick={() => { setSelectedCode(t.code); }} style={{ cursor: 'pointer' }}>
                      <td><span className="strong">{t.name}</span><div className="sub">{t.code}</div></td>
                      <td><span className={`badge ${t.dimension === 'E' ? 'green' : t.dimension === 'S' ? 'blue' : 'amber'}`}>{t.dimension}</span></td>
                      <td>{t.esrs}</td>
                      <td className="num">{t.impact.toFixed(1)}</td>
                      <td className="num">{t.financial.toFixed(1)}</td>
                      <td><MaterialityPill value={t.materiality} /></td>
                      <td className="num">{t.count}</td>
                      <td>{t.critical ? <Pill variant="red">Crítico</Pill> : <Pill variant="gray">Revisado</Pill>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'topics' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-8" pad>
            <div className="section-head"><div><h3>Universo de temas ESG</h3><p>Biblioteca configurable vinculada a ESRS, GRI y marcos sectoriales.</p></div><Pill variant="gray">{topics.length} temas</Pill></div>
            {(['E', 'S', 'G'] as const).map((dim) => (
              <div key={dim} style={{ marginTop: 12 }}>
                <div className="row" style={{ marginBottom: 6 }}><span className={`badge ${dim === 'E' ? 'green' : dim === 'S' ? 'blue' : 'amber'}`}>{dim === 'E' ? 'Environmental' : dim === 'S' ? 'Social' : 'Governance'}</span><span className="micro">{grouped[dim].length} temas</span></div>
                <div className="grid grid-2" style={{ gap: 6 }}>
                  {grouped[dim].map((t) => {
                    const mt = materialityTopics.find((m) => m.code === t.code);
                    return (
                      <div key={t.code} className="row" style={{ padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 7, background: 'var(--panel-2)' }}>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 10, fontWeight: 550 }}>{t.name}</div><div className="micro">{t.esrs} · {t.gri}</div></div>
                        {mt ? <MaterialityPill value={mt.materiality} /> : <Pill variant="gray">No evaluado</Pill>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </Panel>
          <Panel className="col-4" pad>
            <div className="section-head"><div><h3>Lógica de biblioteca</h3><p>Cómo se relacionan temas, IRO y divulgación.</p></div></div>
            <div className="stack">
              <div className="mini-card"><div className="label">1 · Asunto</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Categoría estable del universo ESG, configurable y versionada.</div></div>
              <div className="mini-card"><div className="label">2 · IRO</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Un impacto, riesgo u oportunidad concreto con causa, consecuencia y evidencia.</div></div>
              <div className="mini-card"><div className="label">3 · Requisito</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Un datapoint o divulgación exigida por un marco, que puede cubrir varios IRO.</div></div>
              <div className="mini-card"><div className="label">4 · Evidencia</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Fuente verificable que respalda el dato, no el asunto en abstracto.</div></div>
            </div>
            <div className="divider" />
            <Callout tone="amber">No confundir asunto material con requisito de divulgación. Un asunto puede ser material y no tener aún un datapoint completamente disponible.</Callout>
          </Panel>
        </div>
      )}

      {tab === 'approval' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Flujo de validación</h3><p>Preparación, identificación, evaluación, revisión, validación, dirección, aprobación, publicación y seguimiento.</p></div><ClipboardCheck size={16} className="muted" /></div>
            <div className="stack">
              {STAGES.map(([name, description], idx) => {
                const n = idx + 1;
                const done = (assessment?.stage || 0) >= n;
                return (
                  <div key={name} className="row" style={{ alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <div className="step-dot" style={{ background: done ? 'var(--forest)' : 'var(--panel)', borderColor: done ? 'var(--forest-2)' : 'var(--line)' }}>{done ? <Check size={10} /> : n}</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 10.5, fontWeight: 600 }}>{name}</div><div className="micro">{description}</div></div>
                    <Pill variant={done ? 'green' : n === assessment?.stage ? 'amber' : 'gray'}>{done ? 'Completado' : n === assessment?.stage ? 'En curso' : 'Pendiente'}</Pill>
                  </div>
                );
              })}
            </div>
            <div className="divider" />
            <div className="row"><Pill variant="blue"><FileText size={11} /> Aprobación</Pill><span className="micro" style={{ marginLeft: 'auto' }}>{assessment?.approvedAt ? dateLabel(assessment.approvedAt) : 'Pendiente de aprobación final'}</span></div>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Versiones</h3><p>Historial inmutable de evaluaciones.</p></div><GitBranch size={15} className="muted" /></div>
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Versión</th><th>Estado</th><th>Etapa</th><th>Aprobación</th></tr></thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.id}><td><span className="strong">{a.version}</span><div className="sub">{a.period}</div></td><td><Pill variant={a.status === 'Approved' ? 'green' : a.status === 'In review' ? 'amber' : 'gray'}>{a.status}</Pill></td><td>{a.stage}/9</td><td>{a.approvedAt ? dateLabel(a.approvedAt) : '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divider" />
            <div className="micro" style={{ marginBottom: 6 }}>Audit trail reciente</div>
            {workspace.auditLogs.slice(0, 5).map((l) => (
              <div key={l.id} className="row" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}><div style={{ flex: 1 }}><div style={{ fontSize: 9.5 }}>{l.action} · {l.entity}</div><div className="micro">{l.actor} · {dateLabel(l.createdAt)}</div></div><span className="mono" style={{ fontSize: 7.5 }}>{l.hash.slice(7, 15)}</span></div>
            ))}
            <div className="divider" />
            <Callout tone="green"><strong>Integridad.</strong> Cada aprobación conserva versión, reglas, umbrales, evidencias y comentarios. Las evaluaciones cerradas pueden compararse sin perder la anterior.</Callout>
          </Panel>
        </div>
      )}
    </div>
  );
}
