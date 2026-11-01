'use client';

import { clsx } from 'clsx';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Info, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { materialityClass, materialityLabel } from '@/lib/format';

export function AnimatedNumber({ value, digits = 0, prefix, suffix }: { value: number; digits?: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    const from = previous.current;
    const to = value;
    previous.current = value;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(to);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <>
      {prefix}
      {new Intl.NumberFormat('es-PE', { maximumFractionDigits: digits }).format(display)}
      {suffix}
    </>
  );
}

export function Panel({ children, className, pad = false, tight = false, style }: { children: ReactNode; className?: string; pad?: boolean; tight?: boolean; style?: React.CSSProperties }) {
  return <section className={clsx('panel', pad && 'pad', tight && 'tight', className)} style={style}>{children}</section>;
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
  return (
    <div className={clsx('progress', tone)} style={height ? { height } : undefined}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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

export function Stat({ label, value, suffix, foot, trend, spark, icon }: {
  label: string; value: ReactNode; suffix?: string; foot?: ReactNode; trend?: number; spark?: number[]; icon?: ReactNode;
}) {
  return (
    <div className="panel stat-card">
      <div className="stat-label">{icon}{label}</div>
      <div className="stat-value">{typeof value === 'number' ? <AnimatedNumber value={value} /> : value}{suffix && <small> {suffix}</small>}</div>
      {foot && (
        <div className="stat-foot">
          {trend !== undefined && trend !== 0 && (
            <span className={trend > 0 ? 'trend-up' : 'trend-down'} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              {trend > 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            </span>
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
      <polyline points={points} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
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

export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | string; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ height, width, ...style }} />;
}
