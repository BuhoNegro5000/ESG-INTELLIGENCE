'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Compass, FileCheck2, Grid3X3, Leaf, ListFilter,
  ShieldCheck, Sparkles, Users, X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ViewKey } from '@/lib/views';

interface Step {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  points: string[];
  icon: LucideIcon;
  view?: ViewKey;
  cta?: string;
}

const STEPS: Step[] = [
  {
    image: '/unsplash/forest.jpg',
    alt: 'Bosque templado visto desde arriba',
    eyebrow: 'Green Owl Labs · ESG Intelligence',
    title: 'Toda la sostenibilidad corporativa en un solo centro de mando',
    text: 'Conecta portafolio, doble materialidad, desempeño, cadena de valor, derechos humanos y divulgación sobre una misma base de datos trazable.',
    points: [
      'Ocho empresas, múltiples sectores y marcos internacionales.',
      'Cada dato conserva fuente, responsable, evidencia y fecha.',
      'Navegación por empresa y por dimensión ESG, sin perder contexto.',
    ],
    icon: Compass,
  },
  {
    image: '/unsplash/mist.jpg',
    alt: 'Montañas entre niebla',
    eyebrow: 'Paso 1 · El núcleo metodológico',
    title: 'Doble materialidad sin promedios que oculten impactos',
    text: 'Cada asunto se evalúa en dos ejes independientes: materialidad de impacto y materialidad financiera. La herramienta no fusiona ambos ejes en un score único.',
    points: [
      'Umbral material: 3,2/5 en cualquiera de los dos ejes.',
      'Registro crítico: 4,4/5 o prioridad documentada de derechos humanos.',
      'La severidad del impacto prevalece sobre la probabilidad.',
    ],
    icon: Grid3X3,
    view: 'materiality',
    cta: 'Abrir el centro de materialidad',
  },
  {
    image: '/unsplash/leaves.jpg',
    alt: 'Hojas verdes iluminadas por el sol',
    eyebrow: 'Paso 2 · Registro IRO',
    title: 'Del asunto material al registro accionable',
    text: 'Cada impacto, riesgo u oportunidad (IRO) vive en una ficha con causa, consecuencia, derechos afectados, controles, evidencia y estado de aprobación.',
    points: [
      'Crea registros y asígnalos a un asunto, etapa y responsable.',
      'Ajusta los dos ejes y observa el cambio de clasificación en vivo.',
      'Toda escritura queda en el registro de auditoría.',
    ],
    icon: ListFilter,
    view: 'iros',
    cta: 'Explorar el registro IRO',
  },
  {
    image: '/unsplash/water.jpg',
    alt: 'Agua y paisaje natural',
    eyebrow: 'Paso 3 · Desempeño y naturaleza',
    title: 'Indicadores, objetivos y exposición climática',
    text: 'Sigue la trayectoria de los KPI frente a la línea base y el objetivo, y cruza el desempeño con la exposición física y de transición de cada ubicación.',
    points: [
      'Indicadores E, S y G con fuente, método y calidad del dato.',
      'Objetivos con avance, fecha límite y estado de riesgo.',
      'Clima, agua, biodiversidad y dependencias de naturaleza.',
    ],
    icon: Leaf,
    view: 'performance',
    cta: 'Ver desempeño ESG',
  },
  {
    image: '/unsplash/people.jpg',
    alt: 'Equipo de personas colaborando',
    eyebrow: 'Paso 4 · Personas y cadena de valor',
    title: 'Derechos humanos y proveedores con evidencia',
    text: 'La debida diligencia conecta grupos de interés, compromisos, reclamos, proveedores y planes de remediación. Los casos críticos no se diluyen en promedios.',
    points: [
      'Mapa de influencia, exposición y vulnerabilidad por grupo.',
      'Reclamos con severidad, estado y remediación verificable.',
      'Proveedores con riesgo, auditoría, trazabilidad e incidentes.',
    ],
    icon: Users,
    view: 'social',
    cta: 'Abrir social y DDHH',
  },
  {
    image: '/unsplash/solar.jpg',
    alt: 'Paneles solares en un campo',
    eyebrow: 'Paso 5 · Divulgación y confianza',
    title: 'Reportes listos para revisión, no cajas negras',
    text: 'La cobertura por marco, el repositorio de evidencia y el registro de auditoría permiten reconstruir cada afirmación antes de publicar.',
    points: [
      'Cobertura ESRS, GRI, IFRS S1/S2, TNFD, CDP, OECD y UNGP.',
      'Vista previa de reporte generada desde la base de datos.',
      'Hallazgos, controles y limitaciones declaradas explícitamente.',
    ],
    icon: FileCheck2,
    view: 'reporting',
    cta: 'Abrir el motor de divulgación',
  },
];

const SHORTCUTS = [
  { keys: 'Ctrl K', label: 'Buscar en todo el portafolio' },
  { keys: 'Esc', label: 'Cerrar paneles y fichas' },
  { keys: '◧', label: 'Contraer o expandir la navegación' },
];

export default function Onboarding({ onClose, onNavigate }: { onClose: () => void; onNavigate: (view: ViewKey) => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const last = step === STEPS.length - 1;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setStep((s) => Math.min(STEPS.length - 1, s + 1));
      if (event.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function goToSection() {
    if (!current.view) return;
    onNavigate(current.view);
    onClose();
  }

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-label="Presentación de Green Owl Labs">
      <div className="onboarding-card">
        <div className="onboarding-media">
          <img key={current.image} className="onboarding-img" src={current.image} alt={current.alt} />
          <div className="onboarding-media-overlay" />
          <div className="onboarding-brand">
            <img src="/green-owl-mark.png" alt="" />
            <div>
              <strong>Green Owl Labs</strong>
              <span>ESG Intelligence</span>
            </div>
          </div>
          <div className="onboarding-media-copy">
            <span className="onboarding-step-chip"><Icon size={13} /> Paso {step + 1} de {STEPS.length}</span>
            <p>«La materialidad no se promedia: se demuestra.»</p>
            <span className="onboarding-credit">Fotografía: Unsplash</span>
          </div>
        </div>

        <div className="onboarding-body">
          <div className="onboarding-top">
            <div className="eyebrow">{current.eyebrow}</div>
            <button className="icon-btn" onClick={onClose} aria-label="Cerrar presentación"><X size={15} /></button>
          </div>

          <div className="onboarding-progress" aria-hidden>
            <i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>

          <div className="onboarding-content" key={step}>
            <div className="onboarding-icon"><Icon size={22} /></div>
            <h2>{current.title}</h2>
            <p>{current.text}</p>
            <ul className="onboarding-points">
              {current.points.map((point) => (
                <li key={point}><Check size={13} /> <span>{point}</span></li>
              ))}
            </ul>
            <div className="onboarding-hint">
              <Sparkles size={14} />
              <span>
                {step === 0
                  ? 'Consejo: cambia de empresa desde el selector superior; todo el espacio de trabajo se recalcula.'
                  : step === STEPS.length - 1
                    ? 'Atajo: usa Ctrl K para buscar un IRO, proveedor o divulgación en las ocho empresas.'
                    : 'Puedes volver a esta guía en cualquier momento desde el botón de ayuda de la barra superior.'}
              </span>
            </div>
          </div>

          <div className="onboarding-shortcuts">
            {SHORTCUTS.map((item) => (
              <div key={item.keys}><kbd>{item.keys}</kbd><span>{item.label}</span></div>
            ))}
          </div>

          <div className="onboarding-foot">
            <div className="onboarding-dots" role="tablist" aria-label="Pasos de la presentación">
              {STEPS.map((s, index) => (
                <button
                  key={s.title}
                  className={index === step ? 'active' : ''}
                  onClick={() => setStep(index)}
                  aria-label={`Ir al paso ${index + 1}`}
                  aria-selected={index === step}
                  role="tab"
                />
              ))}
            </div>
            <div className="onboarding-actions">
              {step > 0 && (
                <button className="btn ghost" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                  <ArrowLeft size={13} /> Anterior
                </button>
              )}
              {current.view && (
                <button className="btn" onClick={goToSection}>
                  {current.cta} <ArrowRight size={13} />
                </button>
              )}
              {!last ? (
                <button className="btn primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                  Siguiente <ArrowRight size={13} />
                </button>
              ) : (
                <button className="btn primary" onClick={onClose}>
                  <ShieldCheck size={13} /> Explorar el espacio de trabajo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
