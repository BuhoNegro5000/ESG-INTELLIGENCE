'use client';

import { useState } from 'react';
import { ArrowRight, BookOpen, FileText, Filter, Layers3, ScrollText, ShieldCheck } from 'lucide-react';
import { CoverageBars } from '@/components/charts';
import { Callout, Panel, PanelHead, Pill, Progress, ProgressRow, Tabs } from '@/components/ui';
import { dateLabel, label, countLabel } from '@/lib/format';
import type { ViewProps } from './types';

const INSTRUMENT_LABEL: Record<string, string> = {
  'Legal obligation': 'Obligación legal',
  Standard: 'Estándar',
  'Voluntary framework': 'Marco voluntario',
  Guidance: 'Guía',
  Draft: 'Borrador',
};

const INSTRUMENT_TONE: Record<string, 'red' | 'blue' | 'green' | 'amber' | 'gray'> = {
  'Legal obligation': 'red',
  Standard: 'blue',
  'Voluntary framework': 'green',
  Guidance: 'amber',
  Draft: 'gray',
};

export default function ReportingView({ workspace, actions }: ViewProps) {
  const [tab, setTab] = useState('coverage');
  const [framework, setFramework] = useState('all');
  const { disclosures, frameworkCoverage, reports, requirements, company, assessment } = workspace;
  const filtered = framework === 'all' ? disclosures : disclosures.filter((d) => d.framework === framework);
  const gaps = disclosures.filter((d) => d.status === 'Gap' || d.status === 'Not started');
  const complete = disclosures.filter((d) => d.status === 'Complete');
  const frameworks = Array.from(new Set(disclosures.map((d) => d.framework)));
  const published = reports.filter((r) => r.status === 'Published');
  const avgQuality = Math.round(disclosures.reduce((a, b) => a + b.coverage, 0) / Math.max(1, disclosures.length));

  return (
    <div className="fade-in">
      <div className="page-head">
        <div className="page-head-copy">
          <div className="eyebrow">Motor de divulgación y reportes</div>
          <h1>Divulgación</h1>
          <p>Cobertura por marco, requisitos, evidencia y paquetes de reporte. La plataforma distingue obligación legal, estándar, marco voluntario, guía y borrador.</p>
        </div>
        <div className="page-head-actions">
          <button className="btn" onClick={() => actions.navigate('assurance')}><ShieldCheck size={13} /> Ver evidencia</button>
          <button className="btn primary" onClick={actions.openReport}><FileText size={13} /> Generar reporte</button>
        </div>
      </div>

      <div className="grid grid-4">
        <div className="panel stat-card"><div className="stat-label"><Layers3 size={11} /> Cobertura media</div><div className="stat-value">{company.reportingCoverage}<small>%</small></div><div className="stat-foot">{countLabel(complete.length, 'requisito completo', 'requisitos completos')} de {disclosures.length} · {Math.round((complete.length / Math.max(1, disclosures.length)) * 100)}%</div></div>
        <div className="panel stat-card"><div className="stat-label"><ScrollText size={11} /> Brechas</div><div className="stat-value" style={{ color: gaps.length ? 'var(--terracotta)' : 'var(--text)' }}>{gaps.length}</div><div className="stat-foot">{countLabel(disclosures.filter((d) => d.status === 'Partial').length, 'parcial', 'parciales')}</div></div>
        <div className="panel stat-card"><div className="stat-label"><BookOpen size={11} /> Marcos activos</div><div className="stat-value">{frameworks.length}</div><div className="stat-foot">{countLabel(requirements.length, 'requisito catalogado', 'requisitos catalogados')}</div></div>
        <div className="panel stat-card"><div className="stat-label"><FileText size={11} /> Paquetes de reporte</div><div className="stat-value">{reports.length}</div><div className="stat-foot">{countLabel(published.length, 'publicado', 'publicados')} · {avgQuality}% cobertura media</div></div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} items={[
          { key: 'coverage', label: 'Matriz de cobertura', count: disclosures.length },
          { key: 'reports', label: 'Biblioteca de reportes', count: reports.length },
          { key: 'requirements', label: 'Catálogo de requisitos', count: requirements.length },
          { key: 'standards', label: 'Marcos e instrumentos' },
        ]} />
      </div>

      {tab === 'coverage' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Cobertura por marco</h3><p>Completo, parcial y brecha.</p></div><Filter size={15} className="muted" /></div>
            <CoverageBars data={frameworkCoverage} />
            <div className="divider" />
            <div className="row wrap" style={{ gap: 8 }}>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#5e9e7a' }} />Completo</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#c99b51' }} />Parcial</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#ab685a' }} />Brecha</span>
            </div>
            <div className="divider" />
            <Callout tone="amber"><strong>Completitud no es aseguramiento.</strong> Un requisito puede estar marcado como completo y aun así carecer de evidencia verificada. La trazabilidad se revisa en aseguramiento.</Callout>
          </Panel>

          <Panel className="col-7">
            <PanelHead
              title="Matriz de divulgación"
              subtitle="Requisito, estado, cobertura, propietario y evidencia."
              actions={
                <select className="select" style={{ width: 160 }} value={framework} onChange={(e) => setFramework(e.target.value)}>
                  <option value="all">Todos los marcos</option>
                  {frameworks.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              }
            />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Requisito</th><th>Marco</th><th>Estado</th><th className="num">Cobertura</th><th>Propietario</th><th>Evidencia</th></tr></thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id}>
                      <td><span className="strong">{d.title}</span><div className="sub">{d.requirement} · {d.dataPoints}</div></td>
                      <td>{d.framework}<div className="sub">{d.version}</div></td>
                      <td><Pill variant={d.status === 'Complete' ? 'green' : d.status === 'Partial' ? 'amber' : 'red'}>{label(d.status)}</Pill></td>
                      <td className="num" style={{ minWidth: 80 }}><ProgressRow value={d.coverage} tone={d.coverage >= 80 ? 'green' : d.coverage >= 50 ? 'amber' : 'red'} /></td>
                      <td>{d.owner}</td>
                      <td><span className="sub">{d.evidence}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{countLabel(filtered.length, 'requisito visible', 'requisitos visibles')}</span><span>Actualizado {dateLabel(company.updatedAt)}</span></div>
          </Panel>
        </div>
      )}

      {tab === 'reports' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7">
            <PanelHead title="Biblioteca de reportes" subtitle="Paquetes generados, estado, cobertura y páginas." actions={<Pill variant="gray">{countLabel(reports.length, 'paquete', 'paquetes')}</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Reporte</th><th>Tipo</th><th>Marco</th><th>Período</th><th>Estado</th><th className="num">Cobertura</th><th className="num">Páginas</th><th>Generado</th></tr></thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td><span className="strong">{r.title}</span><div className="sub">{r.id}</div></td>
                      <td>{label(r.type)}</td>
                      <td>{r.framework}</td>
                      <td>{r.period}</td>
                      <td><Pill variant={r.status === 'Published' ? 'green' : r.status === 'Draft' ? 'gray' : 'amber'}>{label(r.status)}</Pill></td>
                      <td className="num">{r.coverage}%</td>
                      <td className="num">{r.pages}</td>
                      <td>{dateLabel(r.generatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>{countLabel(published.length, 'publicado', 'publicados')}</span><span>Los reportes se generan a partir de los datos del workspace.</span></div>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Generar paquete de reporte</h3><p>Vista previa imprimible con los datos actuales.</p></div><FileText size={15} className="muted" /></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Perímetro</div><div style={{ fontSize: 10.5, marginTop: 4 }}>{assessment?.scope || 'Perímetro corporativo'}</div></div>
            <div className="mini-card" style={{ marginBottom: 8 }}><div className="label">Metodología</div><div style={{ fontSize: 10.5, marginTop: 4 }}>{assessment?.methodology || 'Doble materialidad'}</div></div>
            <div className="mini-card"><div className="label">Contenido incluido</div><div style={{ fontSize: 10.5, marginTop: 4 }}>Perfil, asuntos materiales, IRO críticos, KPIs, objetivos, divulgaciones, evidencia y cobertura por marco.</div></div>
            <div className="divider" />
            <button className="btn primary" style={{ width: '100%' }} onClick={actions.openReport}><FileText size={13} /> Previsualizar e imprimir</button>
            <div className="notice" style={{ marginTop: 8 }}>La vista previa es un documento de trabajo. No constituye un informe legal, una opinión de aseguramiento ni una comunicación oficial.</div>
          </Panel>
          <Panel className="col-12" pad>
            <div className="section-head"><div><h3>Contenido del paquete estándar</h3><p>Secciones que se reconstruyen desde la base de datos al generar.</p></div><Layers3 size={15} className="muted" /></div>
            <div className="grid grid-4">
              {[
                ['1 · Perfil y perímetro', 'Identidad, sector, países, instalaciones y alcance.'],
                ['2 · Doble materialidad', 'Metodología, umbrales, asuntos materiales y justificación.'],
                ['3 · IRO críticos', 'Impactos, riesgos y oportunidades con evidencia.'],
                ['4 · Desempeño', 'KPIs, objetivos, avance y calidad del dato.'],
                ['5 · Clima y naturaleza', 'Escenarios, dependencias y ubicaciones.'],
                ['6 · Social y DDHH', 'Stakeholders, reclamos y debida diligencia.'],
                ['7 · Gobernanza', 'Políticas, controles y hallazgos.'],
                ['8 · Divulgación', 'Cobertura por marco y brechas declaradas.'],
              ].map(([title, text]) => (
                <div key={title} className="mini-card"><div className="label">{title}</div><div style={{ fontSize: 10, marginTop: 4, color: 'var(--text-2)' }}>{text}</div></div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'requirements' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-12">
            <PanelHead title="Catálogo de requisitos" subtitle="Marco, versión, código, tipo de instrumento y vigencia. No todo requisito es una obligación legal." actions={<Pill variant="gray">{countLabel(requirements.length, 'requisito', 'requisitos')}</Pill>} />
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Requisito</th><th>Marco</th><th>Versión</th><th>Instrumento</th><th>Categoría</th><th>Vigencia</th></tr></thead>
                <tbody>
                  {requirements.map((r) => (
                    <tr key={r.id}>
                      <td><span className="strong">{r.code} · {r.title}</span><div className="sub">{r.description}</div></td>
                      <td>{r.framework}</td>
                      <td>{r.version}</td>
                      <td><Pill variant={INSTRUMENT_TONE[r.instrumentType] || 'gray'}>{INSTRUMENT_LABEL[r.instrumentType] || r.instrumentType}</Pill></td>
                      <td>{label(r.category)}</td>
                      <td>{r.effective}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>La clasificación del instrumento es parte del dato y se muestra al usuario.</span><span>Borrador = no vigente.</span></div>
          </Panel>
        </div>
      )}

      {tab === 'standards' && (
        <div className="grid grid-12" style={{ marginTop: 14 }}>
          <Panel className="col-7" pad>
            <div className="section-head"><div><h3>Jerarquía de instrumentos</h3><p>Cómo interpreta la plataforma cada tipo de referencia.</p></div><BookOpen size={15} className="muted" /></div>
            <div className="stack">
              <div className="mini-card" style={{ borderColor: 'rgba(171,104,90,.3)' }}><div className="row"><Pill variant="red">Obligación legal</Pill></div><div style={{ fontSize: 10.5, marginTop: 6 }}>Norma vinculante con consecuencias jurídicas. Ejemplo: obligaciones de divulgación corporativa de sostenibilidad aplicables en una jurisdicción.</div></div>
              <div className="mini-card" style={{ borderColor: 'rgba(71,124,145,.3)' }}><div className="row"><Pill variant="blue">Estándar</Pill></div><div style={{ fontSize: 10.5, marginTop: 6 }}>Especificación técnica o de reporte adoptada por referencia. Ejemplo: IFRS S1/S2, ESRS cuando son incorporados por norma.</div></div>
              <div className="mini-card" style={{ borderColor: 'rgba(94,158,122,.3)' }}><div className="row"><Pill variant="green">Marco voluntario</Pill></div><div style={{ fontSize: 10.5, marginTop: 6 }}>Adhesión voluntaria. Ejemplo: GRI, CDP, TNFD. La adopción no crea obligación legal por sí sola.</div></div>
              <div className="mini-card" style={{ borderColor: 'rgba(201,155,81,.3)' }}><div className="row"><Pill variant="amber">Guía</Pill></div><div style={{ fontSize: 10.5, marginTop: 6 }}>Orientación no vinculante. Ejemplo: guías de implementación o documentos interpretativos.</div></div>
              <div className="mini-card"><div className="row"><Pill variant="gray">Borrador</Pill></div><div style={{ fontSize: 10.5, marginTop: 6 }}>Documento en consulta o no vigente. No debe presentarse como requisito aplicable.</div></div>
            </div>
          </Panel>
          <Panel className="col-5" pad>
            <div className="section-head"><div><h3>Advertencia de uso</h3><p>Límites de la plataforma.</p></div><ShieldCheck size={15} className="muted" /></div>
            <Callout tone="red"><strong>No sustituye asesoría legal.</strong> La clasificación de instrumentos es informativa y puede cambiar según jurisdicción, tamaño de empresa y fecha de entrada en vigor. Verifique con asesoría legal antes de divulgar.</Callout>
            <div className="divider" />
            <div className="micro" style={{ marginBottom: 6 }}>Marcos presentes en el workspace</div>
            {frameworkCoverage.map((f) => (
              <div key={f.framework} className="row" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 10, flex: 1 }}>{f.framework}</span>
                <span className="micro">{f.coverage}%</span>
              </div>
            ))}
            <div className="divider" />
            <button className="btn sm" onClick={() => actions.navigate('admin')}>Ver versiones en administración <ArrowRight size={12} /></button>
          </Panel>
        </div>
      )}
    </div>
  );
}
