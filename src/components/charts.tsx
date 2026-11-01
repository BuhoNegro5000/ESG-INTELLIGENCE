'use client';

import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ClimateScenario, IRO, KPI, MaterialityTopic } from '@/lib/types';
import { countLabel, fmt, materialityLabel, riskColor, label } from '@/lib/format';
import { prefersReducedMotion } from '@/components/motion';

const TOOLTIP_STYLE = {
  background: 'var(--panel)',
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  fontSize: 11,
  color: 'var(--text)',
  boxShadow: '0 10px 30px rgba(0,0,0,.25)',
};

const CHART_ANIM = {
  isAnimationActive: !prefersReducedMotion(),
  animationDuration: 1200,
  animationEasing: 'ease-out' as const,
};

const BUBBLE_COLOR = (m: string) => m === 'both' ? '#c99b51' : m === 'impact' ? '#ab685a' : m === 'financial' ? '#477c91' : '#6d7e74';

export function MaterialityMatrix({ topics, onSelect, selectedCode, height = 356, showFilters = true }: {
  topics: MaterialityTopic[];
  onSelect?: (topic: MaterialityTopic) => void;
  selectedCode?: string;
  height?: number;
  showFilters?: boolean;
}) {
  const w = 620;
  const h = height;
  const pad = { left: 46, right: 20, top: 18, bottom: 40 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;
  const threshold = 3.2;
  const [hovered, setHovered] = useState<string | null>(null);
  const [dimension, setDimension] = useState<'all' | 'E' | 'S' | 'G'>('all');

  const x = (v: number) => pad.left + (Math.max(0, Math.min(5, v)) / 5) * innerW;
  const y = (v: number) => pad.top + innerH - (Math.max(0, Math.min(5, v)) / 5) * innerH;
  const radius = (t: MaterialityTopic) => 4.5 + Math.min(4, t.count * 0.9);
  const tx = x(threshold);
  const ty = y(threshold);

  const visible = useMemo(
    () => topics.filter((t) => dimension === 'all' || t.dimension === dimension),
    [topics, dimension],
  );

  /** Anti-collision label layout: every label stays inside the plot area. */
  const labels = useMemo(() => {
    const candidates = topics
      .filter((t) => t.critical === 1 || t.impact + t.financial > 8)
      .sort((a, b) => (b.impact + b.financial) - (a.impact + a.financial));
    const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const result = new Map<string, { lx: number; ly: number; anchor: 'start' | 'end'; leader: boolean }>();
    for (const t of candidates) {
      const cx = x(t.impact);
      const cy = y(t.financial);
      const r = radius(t);
      let anchor: 'start' | 'end' = cx > pad.left + innerW * 0.6 ? 'end' : 'start';
      let lx = anchor === 'start' ? cx + r + 5 : cx - r - 5;
      const textW = Math.min(132, t.name.length * 5.6 + 6);
      if (anchor === 'start' && lx + textW > pad.left + innerW - 2) {
        anchor = 'end';
        lx = cx - r - 5;
      }
      if (anchor === 'end' && lx - textW < pad.left + 2) {
        anchor = 'start';
        lx = cx + r + 5;
      }
      let chosen: { lx: number; ly: number; anchor: 'start' | 'end'; leader: boolean } | null = null;
      for (const dy of [0, -12, 12, -24, 24, -36, 36, -48, 48]) {
        const ly = cy + 3 + dy;
        if (ly < pad.top + 10 || ly > pad.top + innerH - 5) continue;
        const box = anchor === 'start'
          ? { x1: lx, y1: ly - 9, x2: lx + textW, y2: ly + 3 }
          : { x1: lx - textW, y1: ly - 9, x2: lx, y2: ly + 3 };
        const collides = placed.some((p) => !(box.x2 < p.x1 || box.x1 > p.x2 || box.y2 < p.y1 || box.y1 > p.y2));
        if (collides) continue;
        placed.push(box);
        chosen = { lx, ly, anchor, leader: Math.abs(dy) > 6 };
        break;
      }
      if (!chosen) {
        const ly = Math.min(pad.top + innerH - 5, Math.max(pad.top + 10, cy + 3));
        chosen = { lx, ly, anchor, leader: true };
      }
      result.set(t.code, chosen);
    }
    return result;
  }, [topics, height]);

  const active = hovered ? topics.find((t) => t.code === hovered) ?? null : null;
  const activePoint = active ? { cx: x(active.impact), cy: y(active.financial) } : null;

  return (
    <div className="matrix-wrap">
      {showFilters && (
        <div className="row" style={{ marginBottom: 8, gap: 8 }}>
          <div className="matrix-filters" role="group" aria-label="Filtrar matriz por dimensión">
            {([['all', 'Todos'], ['E', 'E'], ['S', 'S'], ['G', 'G']] as const).map(([key, text]) => (
              <button
                key={key}
                type="button"
                className={dimension === key ? 'active' : undefined}
                aria-pressed={dimension === key}
                onClick={() => setDimension(key)}
              >
                {text}
              </button>
            ))}
          </div>
          <span className="micro" style={{ marginLeft: 'auto' }}>
            {countLabel(visible.length, 'asunto visible', 'asuntos visibles')} · {countLabel(visible.filter((t) => t.materiality === 'both').length, 'doble material')}
          </span>
        </div>
      )}

      <svg className="matrix-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Matriz de doble materialidad con ${topics.length} asuntos`}>
        <defs>
          <radialGradient id="bothGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c99b51" stopOpacity=".12" />
            <stop offset="100%" stopColor="#c99b51" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="rgba(255,255,255,.012)" stroke="var(--line)" rx="6" />
        <rect x={tx} y={pad.top} width={pad.left + innerW - tx} height={ty - pad.top} fill="rgba(201,155,81,.055)" />
        <rect x={pad.left} y={pad.top} width={tx - pad.left} height={ty - pad.top} fill="rgba(71,124,145,.04)" />
        <rect x={tx} y={ty} width={pad.left + innerW - tx} height={pad.top + innerH - ty} fill="rgba(171,104,90,.045)" />
        <circle cx={tx + (pad.left + innerW - tx) / 2} cy={pad.top + (ty - pad.top) / 2} r="120" fill="url(#bothGlow)" />
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={`grid-${v}`}>
            <line x1={x(v)} y1={pad.top} x2={x(v)} y2={pad.top + innerH} stroke="var(--line)" strokeDasharray="2 5" opacity=".55" />
            <line x1={pad.left} y1={y(v)} x2={pad.left + innerW} y2={y(v)} stroke="var(--line)" strokeDasharray="2 5" opacity=".55" />
            <text x={x(v)} y={pad.top + innerH + 16} textAnchor="middle" className="matrix-tick">{v}</text>
            <text x={pad.left - 14} y={y(v) + 3} textAnchor="middle" className="matrix-tick">{v}</text>
          </g>
        ))}
        <line x1={tx} y1={pad.top} x2={tx} y2={pad.top + innerH} stroke="rgba(201,155,81,.38)" strokeDasharray="4 4" />
        <line x1={pad.left} y1={ty} x2={pad.left + innerW} y2={ty} stroke="rgba(201,155,81,.38)" strokeDasharray="4 4" />
        <text x={pad.left + 10} y={pad.top + 16} className="matrix-quadrant-label" fill="#7fb2c7">Material financiero</text>
        <text x={pad.left + innerW - 10} y={pad.top + 16} textAnchor="end" className="matrix-quadrant-label" fill="#c99b51">Doble material</text>
        <text x={pad.left + 10} y={pad.top + innerH - 10} className="matrix-quadrant-label">No material</text>
        <text x={pad.left + innerW - 10} y={pad.top + innerH - 10} textAnchor="end" className="matrix-quadrant-label" fill="#ab685a">Material por impacto</text>
        <text x={pad.left + innerW / 2} y={h - 5} textAnchor="middle" className="matrix-axis-label">Materialidad de impacto →</text>
        <text x={12} y={pad.top + innerH / 2} textAnchor="middle" transform={`rotate(-90 12 ${pad.top + innerH / 2})`} className="matrix-axis-label">Materialidad financiera →</text>

        {/* Axis guides while hovering */}
        {activePoint && (
          <g className="matrix-guide">
            <line x1={activePoint.cx} y1={activePoint.cy} x2={activePoint.cx} y2={pad.top + innerH} stroke="rgba(201,155,81,.55)" strokeDasharray="3 4" />
            <line x1={pad.left} y1={activePoint.cy} x2={activePoint.cx} y2={activePoint.cy} stroke="rgba(201,155,81,.55)" strokeDasharray="3 4" />
            <text x={activePoint.cx} y={pad.top + innerH + 16} textAnchor="middle" className="matrix-tick" fill="var(--amber)">{fmt(active?.impact ?? 0, 1)}</text>
            <text x={pad.left - 14} y={activePoint.cy + 3} textAnchor="middle" className="matrix-tick" fill="var(--amber)">{fmt(active?.financial ?? 0, 1)}</text>
          </g>
        )}

        {topics.map((t, index) => {
          const cx = x(t.impact);
          const cy = y(t.financial);
          const r = radius(t);
          const selected = selectedCode === t.code;
          const isHover = hovered === t.code;
          const isDim = (hovered !== null && !isHover) || (dimension !== 'all' && t.dimension !== dimension);
          const label = labels.get(t.code);
          const quadrant = (t.impact >= threshold ? 1 : 0) + (t.financial >= threshold ? 2 : 0);
          return (
            <g
              key={t.code}
              className={`matrix-point matrix-bubble${isDim ? ' is-dim' : ''}${isHover ? ' is-active' : ''}${selected ? ' is-selected' : ''}`}
              style={{ '--i': index, '--q': quadrant } as React.CSSProperties}
              onClick={() => onSelect?.(t)}
              onPointerEnter={() => setHovered(t.code)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(t.code)}
              onBlur={() => setHovered(null)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect?.(t);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`${t.name}: impacto ${fmt(t.impact, 1)}, financiero ${fmt(t.financial, 1)}, ${materialityLabel(t.materiality)}, ${countLabel(t.count, 'IRO')}`}
            >
              {t.critical === 1 && (
                <circle className="matrix-halo" cx={cx} cy={cy} r={r + 4} fill="none" stroke={BUBBLE_COLOR(t.materiality)} strokeWidth="1.2" opacity=".18" />
              )}
              {selected && <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={BUBBLE_COLOR(t.materiality)} strokeWidth="1.1" opacity=".85" />}
              <circle cx={cx} cy={cy} r={r} fill={BUBBLE_COLOR(t.materiality)} opacity=".92" stroke="rgba(255,255,255,.35)" strokeWidth=".7" />
              {label && (
                <g pointerEvents="none">
                  {label.leader && (
                    <line
                      x1={label.anchor === 'start' ? cx + r + 1 : cx - r - 1}
                      y1={cy}
                      x2={label.anchor === 'start' ? label.lx - 2 : label.lx + 2}
                      y2={label.ly - 3}
                      stroke="var(--line-strong)"
                      strokeWidth=".8"
                    />
                  )}
                  <text
                    className="matrix-label"
                    x={label.lx}
                    y={label.ly}
                    textAnchor={label.anchor}
                    style={{ opacity: isDim ? 0.3 : 0.92 }}
                  >
                    {t.name.length > 26 ? `${t.name.slice(0, 24)}…` : t.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {active && activePoint && (
        <div
          className="matrix-tooltip"
          style={{ left: `${(activePoint.cx / w) * 100}%`, top: `${(activePoint.cy / h) * 100}%` }}
          role="tooltip"
        >
          <strong>{active.name}</strong>
          <div className="tt-row"><span>Dimensión</span><b style={{ marginLeft: 'auto' }}>{label(active.dimension)}</b></div>
          <div className="tt-row"><span>Impacto</span><b style={{ marginLeft: 'auto' }}>{fmt(active.impact, 1)}/5</b></div>
          <div className="tt-row"><span>Financiero</span><b style={{ marginLeft: 'auto' }}>{fmt(active.financial, 1)}/5</b></div>
          <div className="tt-row"><span>Clasificación</span><b style={{ marginLeft: 'auto' }}>{materialityLabel(active.materiality)}</b></div>
          <div className="tt-row"><span>IRO vinculados</span><b style={{ marginLeft: 'auto' }}>{active.count}</b></div>
          {active.iros.length > 0 && (
            <div className="tt-iros">
              {active.iros.slice(0, 5).map((code) => <span key={code}>{code}</span>)}
              {active.iros.length > 5 && <span>+{active.iros.length - 5}</span>}
            </div>
          )}
        </div>
      )}

      <div className="matrix-legend">
        {[
          ['#c99b51', 'Doble material'],
          ['#ab685a', 'Impacto'],
          ['#477c91', 'Financiero'],
          ['#6d7e74', 'No material'],
        ].map(([c, l]) => <span className="legend-item" key={l}><span className="legend-dot" style={{ background: c }} />{l}</span>)}
        <span className="legend-item" style={{ marginLeft: 'auto' }}><span className="legend-dot" style={{ background: 'transparent', border: '1px solid var(--amber)' }} />Tamaño = nº de IRO</span>
      </div>
      <div className="matrix-note">Umbral aprobado: 3,2/5 en cada eje. Los ejes no se agregan ni se compensan. Un impacto crítico no puede ser neutralizado por un resultado financiero favorable.</div>
    </div>
  );
}

export function RiskHeatmap({ data }: { data: { likelihood: number; impact: number; count: number; residual: number }[] }) {
  const get = (l: number, i: number) => data.find((d) => d.likelihood === l && d.impact === i);
  return (
    <div>
      <div className="heatmap">
        <div />
        {[1, 2, 3, 4, 5].map((i) => <div key={`h-${i}`} className="heatmap-label">{i}</div>)}
        {[5, 4, 3, 2, 1].map((l) => (
          <div key={`row-${l}`} style={{ display: 'contents' }}>
            <div className="heatmap-label">{l}</div>
            {[1, 2, 3, 4, 5].map((i) => {
              const d = get(l, i);
              const score = l * i;
              const bg = d ? riskColor(score / 5) : 'rgba(166,183,160,.035)';
              return (
                <div key={`${l}-${i}`} className={`heatmap-cell ${d ? '' : 'empty'}`} style={{ background: bg, opacity: d ? 0.94 : 1, borderColor: d ? 'rgba(255,255,255,.08)' : 'transparent' }} title={d ? `${countLabel(d.count, 'riesgo', 'riesgos')} · residual promedio ${fmt(d.residual, 1)}/5` : 'Sin riesgos'}>
                  {d ? d.count : '·'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="heatmap-axis"><span>Impacto financiero →</span><span>Probabilidad ↑</span></div>
      <div className="heatmap-legend"><span className="heatmap-gradient" />Bajo <span style={{ marginLeft: 'auto' }}>Alto</span></div>
    </div>
  );
}

function progressAt(kpi: KPI, value: number) {
  if (kpi.direction === 'lower') {
    if (kpi.baseline === kpi.target) return 100;
    return Math.max(0, Math.min(100, ((kpi.baseline - value) / (kpi.baseline - kpi.target)) * 100));
  }
  if (kpi.baseline === kpi.target) return 100;
  return Math.max(0, Math.min(100, ((value - kpi.baseline) / (kpi.target - kpi.baseline)) * 100));
}

export function PerformanceTrend({ kpis, height = 230 }: { kpis: KPI[]; height?: number }) {
  const periods = kpis[0]?.history.map((h) => h.period) || [];
  const data = periods.map((period, idx) => {
    const dims: Record<string, number[]> = { E: [], S: [], G: [] };
    for (const k of kpis) {
      const hist = k.history[idx];
      if (hist) dims[k.dimension]?.push(progressAt(k, hist.value));
    }
    return {
      period: period.slice(2).replace('-', '/'),
      E: dims.E.length ? Math.round(dims.E.reduce((a, b) => a + b, 0) / dims.E.length) : null,
      S: dims.S.length ? Math.round(dims.S.reduce((a, b) => a + b, 0) / dims.S.length) : null,
      G: dims.G.length ? Math.round(dims.G.reduce((a, b) => a + b, 0) / dims.G.length) : null,
    };
  });
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
          <XAxis dataKey="period" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value ?? ''}%`, '']} />
          <Legend wrapperStyle={{ fontSize: 10, color: 'var(--muted)' }} iconType="circle" iconSize={6} />
          <Line type="monotone" dataKey="E" name="Ambiental" stroke="#5e9e7a" strokeWidth="1.7" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} {...CHART_ANIM} />
          <Line type="monotone" dataKey="S" name="Social" stroke="#477c91" strokeWidth="1.7" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} {...CHART_ANIM} />
          <Line type="monotone" dataKey="G" name="Gobernanza" stroke="#c99b51" strokeWidth="1.7" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} {...CHART_ANIM} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiTrend({ kpi, height = 150 }: { kpi: KPI; height?: number }) {
  const data = kpi.history.map((h) => ({ period: h.period.slice(5), value: h.value, target: h.target }));
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
          <XAxis dataKey="period" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Line type="monotone" dataKey="value" name="Valor" stroke="#c99b51" strokeWidth="1.7" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} {...CHART_ANIM} />
          <Line type="monotone" dataKey="target" name="Objetivo" stroke="#5e9e7a" strokeWidth="1" strokeDasharray="4 4" dot={false} activeDot={{ r: 3, strokeWidth: 0 }} {...CHART_ANIM} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CoverageBars({ data }: { data: { framework: string; coverage: number; complete: number; partial: number; gap: number; total: number }[] }) {
  return (
    <div className="stack" style={{ gap: 11 }}>
      {data.map((d) => (
        <div key={d.framework}>
          <div className="row" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{d.framework}</span>
            <span className="micro" style={{ marginLeft: 'auto' }}>{countLabel(d.complete, 'completo', 'completos')} de {d.total} · {fmt(d.coverage)}%</span>
          </div>
          <div className="split-bar">
            <i style={{ width: `${(d.complete / d.total) * 100}%`, background: '#5e9e7a' }} />
            <i style={{ width: `${(d.partial / d.total) * 100}%`, background: '#c99b51' }} />
            <i style={{ width: `${(d.gap / d.total) * 100}%`, background: '#ab685a' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ClimateScenarios({ scenarios, height = 210 }: { scenarios: ClimateScenario[]; height?: number }) {
  const data = scenarios.map((s) => ({ name: s.name, Físico: s.physicalRisk, Transición: s.transitionRisk, Oportunidad: s.opportunity }));
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -26, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 5]} tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 10, color: 'var(--muted)' }} iconType="circle" iconSize={5} />
          <Bar dataKey="Físico" fill="#ab685a" radius={[2, 2, 0, 0]} {...CHART_ANIM} animationDuration={900} />
          <Bar dataKey="Transición" fill="#c99b51" radius={[2, 2, 0, 0]} {...CHART_ANIM} animationDuration={900} />
          <Bar dataKey="Oportunidad" fill="#5e9e7a" radius={[2, 2, 0, 0]} {...CHART_ANIM} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DimensionRadar({ scores, height = 190 }: { scores: { e: number; s: number; g: number }; height?: number }) {
  const data = [
    { axis: 'Ambiental', value: scores.e },
    { axis: 'Social', value: scores.s },
    { axis: 'Gobernanza', value: scores.g },
    { axis: 'Datos', value: Math.round((scores.e + scores.s + scores.g) / 3) },
  ];
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="var(--line)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: 'var(--muted)', fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar dataKey="value" stroke="#c99b51" fill="#c99b51" fillOpacity={0.14} strokeWidth={1.5} {...CHART_ANIM} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OpportunityBars({ iros }: { iros: IRO[] }) {
  const data = iros.filter((i) => i.type === 'Opportunity').map((i) => ({ name: i.code.replace('IRO-', ''), Inversión: i.investment || 0, Beneficio: i.benefit || 0 }));
  if (!data.length) return null;
  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`USD ${fmt(Number(v ?? 0), 1)}m`, '']} />
          <Legend wrapperStyle={{ fontSize: 10 }} iconType="circle" iconSize={5} />
          <Bar dataKey="Inversión" fill="#477c91" radius={[2, 2, 0, 0]} {...CHART_ANIM} animationDuration={900} />
          <Bar dataKey="Beneficio" fill="#c99b51" radius={[2, 2, 0, 0]} {...CHART_ANIM} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
