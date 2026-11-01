'use client';

import { clsx } from 'clsx';
import { AlertTriangle, Info, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { fmt, materialityClass, materialityLabel } from '@/lib/format';
import { useFlash, useReducedMotion } from '@/components/motion';

export function AnimatedNumber({ value, digits = 0, prefix, suffix, duration = 900 }: {
  value: number; digits?: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = value;
    if (reduced) {
      setDisplay(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Throttled or hidden tabs may never run rAF; settle on the final value.
    const settle = window.setTimeout(() => setDisplay(to), duration + 300);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(settle); };
  }, [value, duration, reduced]);

  const text = new Intl.NumberFormat('es-PE', { maximumFractionDigits: digits }).format(display);
  const final = new Intl.NumberFormat('es-PE', { maximumFractionDigits: digits }).format(value);
  return (
    <span className="counter" aria-label={`${prefix ?? ''}${final}${suffix ?? ''}`}>
      <span aria-hidden>{prefix}{text}{suffix}</span>
    </span>
  );
}

export function SourcePopover({ source, date, owner, label = 'Ver fuente, fecha y responsable del dato' }: {
  source?: string | null; date?: string | null; owner?: string | null; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span className="source-pop" ref={ref}>
      <button
        type="button"
        className="source-pop-btn"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        title={label}
        onClick={(event) => { event.stopPropagation(); setOpen((o) => !o); }}
      >
        <Info size={11} />
      </button>
      {open && (
        <span className="source-pop-panel" role="dialog" aria-label="Fuente del dato">
          <span className="source-pop-title">Trazabilidad del dato</span>
          <span className="source-pop-row"><b>Fuente</b><span>{source || 'Sin fuente registrada'}</span></span>
          <span className="source-pop-row"><b>Fecha</b><span>{date || 'Sin fecha registrada'}</span></span>
          <span className="source-pop-row"><b>Responsable</b><span>{owner || 'Sin responsable asignado'}</span></span>
        </span>
      )}
    </span>
  );
}

export function Panel({ children, className, pad = false, tight = false, style, reveal }: {
  children: ReactNode; className?: string; pad?: boolean; tight?: boolean; style?: CSSProperties; reveal?: number;
}) {
  const revealProps = reveal !== undefined
    ? { 'data-reveal': '', style: { '--reveal-delay': `${reveal}ms`, ...style } as CSSProperties }
    : { style };
  return <section className={clsx('panel', pad && 'pad', tight && 'tight', className)} {...revealProps}>{children}</section>;
}

export function PanelHead({ title, subtitle, actions, icon }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="panel-header">
      {icon && <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--panel-2)', color: 'var(--amber)', flex: '0 0 30px' }}>{icon}</div>}
      <div style={{ minWidth: 0 }}>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="panel-actions">{actions}</div>}
    </div>
  );
}

export function SectionHead({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="section-head-actions">{actions}</div>}
    </div>
  );
}

export function Pill({ children, variant = 'gray', dot = true, className }: { children: ReactNode; variant?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'solid'; dot?: boolean; className?: string }) {
  return <span className={clsx('badge', variant, !dot && 'no-dot', className)} style={!dot ? { paddingLeft: 8 } : undefined}>{children}</span>;
}

export function MaterialityPill({ value }: { value: string }) {
  return <Pill variant={materialityClass(value) as 'amber' | 'red' | 'blue' | 'gray'}>{materialityLabel(value)}</Pill>;
}

export function Progress({ value, tone = 'sage', height }: { value: number; tone?: 'sage' | 'amber' | 'ocean' | 'red' | 'green'; height?: number }) {
  const scale = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className={clsx('progress', tone)} style={height ? { height } : undefined} role="presentation">
      <i style={{ transform: `scaleX(${scale})` }} />
    </div>
  );
}

export function ProgressRow({ value, label, tone }: { value: number; label?: string; tone?: 'sage' | 'amber' | 'ocean' | 'red' | 'green' }) {
  return (
    <div className="progress-row">
      <Progress value={value} tone={tone} />
      <span>{label ?? `${Math.round(value)}%`}</span>
    </div>
  );
}

export function Delta({ value, suffix = '', digits = 1 }: { value: number; suffix?: string; digits?: number }) {
  if (!Number.isFinite(value) || value === 0) return null;
  const up = value > 0;
  return (
    <span className={clsx('delta', up ? 'up' : 'down')} title={up ? 'Aumento frente al valor anterior' : 'Descenso frente al valor anterior'}>
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      {fmt(Math.abs(value), digits)}{suffix}
    </span>
  );
}

export function Stat({ label, value, suffix, foot, trend, spark, icon, delta, deltaSuffix, deltaDigits = 1, source, revealDelay, flashKey }: {
  label: string; value: ReactNode; suffix?: string; foot?: ReactNode; trend?: number; spark?: number[]; icon?: ReactNode;
  delta?: number | null; deltaSuffix?: string; deltaDigits?: number;
  source?: { source?: string | null; date?: string | null; owner?: string | null };
  revealDelay?: number; flashKey?: unknown;
}) {
  const flash = useFlash(flashKey);
  return (
    <div
      className={clsx('panel stat-card', flash && 'flash')}
      data-reveal
      style={{ '--reveal-delay': `${revealDelay ?? 0}ms` } as CSSProperties}
    >
      <div className="stat-label">
        {icon}
        <span>{label}</span>
        {source && <span style={{ marginLeft: 'auto' }}><SourcePopover {...source} /></span>}
      </div>
      <div className="stat-value">
        {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        {suffix && <small> {suffix}</small>}
      </div>
      {foot && (
        <div className="stat-foot">
          {delta !== undefined && delta !== null && <Delta value={delta} suffix={deltaSuffix} digits={deltaDigits} />}
          {trend !== undefined && trend !== 0 && (
            <span className={trend > 0 ? 'trend-up' : 'trend-down'} aria-hidden>{trend > 0 ? '▲' : '▼'}</span>
          )}
          {foot}
        </div>
      )}
      {spark && <div className="stat-spark"><Sparkline values={spark} width={74} height={24} /></div>}
    </div>
  );
}

export function Sparkline({ values, width = 80, height = 24, color = 'var(--amber)' }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <polyline
        className="spark-line"
        points={points}
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".8"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset="1"
      />
    </svg>
  );
}

export function Donut({ segments, center, sub }: { segments: { value: number; color: string; label: string }[]; center: ReactNode; sub: string }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 100;
    acc += s.value;
    const end = (acc / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  }).join(', ');
  return (
    <div className="donut">
      <div className="donut-ring" style={{ background: `conic-gradient(${stops})` }}>
        <div className="donut-center"><strong>{center}</strong><span>{sub}</span></div>
      </div>
      <div className="donut-legend">
        {segments.map((s) => (
          <div className="donut-legend-row" key={s.label}>
            <span className="legend-dot" style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Callout({ children, tone = 'amber', icon }: { children: ReactNode; tone?: 'amber' | 'red' | 'green'; icon?: ReactNode }) {
  const Icon = tone === 'red' ? AlertTriangle : tone === 'green' ? Sparkles : Info;
  return <div className={clsx('callout', tone)}>{icon || <Icon size={15} />}<div>{children}</div></div>;
}

export function Tabs({ items, active, onChange }: { items: { key: string; label: string; count?: number }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button key={item.key} role="tab" aria-selected={active === item.key} className={clsx('tab', active === item.key && 'active')} onClick={() => onChange(item.key)}>
          {item.label}{item.count !== undefined ? ` · ${item.count}` : ''}
        </button>
      ))}
    </div>
  );
}

export function Subtabs({ items, active, onChange }: { items: { key: string; label: string }[]; active: string; onChange: (key: string) => void }) {
  return (
    <div className="subtabs">
      {items.map((item) => (
        <button key={item.key} className={clsx('subtab', active === item.key && 'active')} onClick={() => onChange(item.key)}>{item.label}</button>
      ))}
    </div>
  );
}

export function EmptyState({ title, text, icon }: { title: string; text?: string; icon?: ReactNode }) {
  return <div className="empty-state">{icon}{<p style={{ fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>{title}</p>}{text && <p>{text}</p>}</div>;
}

export function ScoreBox({ value, label, tone = 'amber' }: { value: number | string; label: string; tone?: 'amber' | 'red' | 'blue' | 'green' }) {
  const color = tone === 'red' ? 'var(--terracotta)' : tone === 'blue' ? '#7fb2c7' : tone === 'green' ? '#6fbf8f' : 'var(--amber)';
  return (
    <div className="score-box">
      <b style={{ color }}>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | string; style?: CSSProperties }) {
  return <div className="skeleton" style={{ height, width, ...style }} />;
}
