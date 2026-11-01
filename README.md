# ESG Intelligence Command Center — Green Owl Labs

Centro de mando de inteligencia ESG y doble materialidad para un portafolio multiempresa, multisector y multijurisdiccional. La aplicación opera sobre una base de datos local con ocho empresas, trazabilidad completa y navegación interconectada entre módulos.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- SQLite local con `better-sqlite3` (persistencia real, sin `localStorage` para datos ESG)
- Recharts + visualizaciones SVG propias
- CSS propio con sistema de diseño (tema oscuro por defecto, tema claro disponible)

## Puesta en marcha

```bash
npm install
npm run seed     # crea data/esg.db con el portafolio inicial
npm run dev      # http://localhost:3000
```

Si el puerto 3000 está ocupado por otra aplicación, usa `npx next dev -p 3001`.

Comandos útiles:

```bash
npm run typecheck  # TypeScript sin emitir
npm test           # reglas de materialidad + invariantes de la base sembrada
npm run build      # compilación de producción
```

Requiere Node.js 22 (ver `.nvmrc`).

## Despliegue en GitHub y Vercel

### 1. Publicar en GitHub

```bash
git init -b main
git add .
git commit -m "ESG Intelligence Command Center"
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

`data/esg.db` sí se versiona: es la base sembrada que la aplicación lee en producción. Los archivos `-wal` y `-shm` quedan fuera por `.gitignore`.

Si cambias la semilla, vuelve a generar y confirma la base:

```bash
npm run seed
git add data/esg.db
git commit -m "Actualiza la base sembrada"
```

### 2. Importar en Vercel

1. Vercel → **Add New… → Project** → importa el repositorio.
2. Framework preset: **Next.js** (se detecta automáticamente).
3. Build command `npm run build`, install command `npm install`.
4. Node.js: **22.x** en la configuración del proyecto.
5. No se requieren variables de entorno para el arranque.

### 3. Comportamiento de la base de datos en Vercel

- `next.config.ts` incluye `data/esg.db` en el trazado del bundle mediante `outputFileTracingIncludes`.
- `src/lib/db.ts` detecta `VERCEL` y copia la base a `os.tmpdir()` antes de abrirla, porque el resto del sistema de archivos es de solo lectura.
- La copia es por instancia: las escrituras (nuevos IRO, avance de evaluaciones, auditoría) persisten mientras la instancia siga activa, pero no se comparten entre instancias ni sobreviven a un nuevo despliegue.
- Para persistencia durable hay tres caminos:
  - **Volumen persistente** montado en la función y `ESG_DB_PATH=/ruta/esg.db`.
  - **Turso / libSQL**, sustituyendo `better-sqlite3` por `@libsql/client`.
  - **PostgreSQL** (Neon, Supabase o Vercel Postgres) con un ORM y migraciones.

`ESG_DB_PATH` también funciona en local para apuntar a otra copia de la base.

### 4. Verificación previa al push

```bash
npm ci
npm run typecheck
npm test
npm run build
```

## Alcance funcional

14 vistas interconectadas con navegación por hash, búsqueda global (Ctrl/Cmd + K), cambio de empresa, ficha de IRO, creación de IRO, versionado de evaluaciones, previsualización de reporte imprimible, audit trail y agentes de análisis.

| Grupo | Vistas |
| --- | --- |
| Inteligencia | Vista ejecutiva, Perfil corporativo, Doble materialidad, Registro IRO, Desempeño ESG |
| Gestión responsable | Clima y naturaleza, Social y DDHH, Gobernanza, Riesgos y oportunidades |
| Cadena y reporte | Cadena de valor, Divulgación, Aseguramiento |
| Sistema | Inteligencia ESG, Administración |

## Doble materialidad

El núcleo metodológico está en `src/lib/materiality-rules.ts`:

- Dos ejes independientes: materialidad de impacto y materialidad financiera.
- Umbral aprobado: **3,2 / 5** en cada eje (inclusivo).
- No existe un score ESG combinado ni promedios entre ejes.
- La agregación por asunto usa el **máximo de cada eje**, de modo que un impacto severo no se diluye por un promedio.
- Un valor **≥ 4,4** en cualquiera de los ejes marca el registro como crítico.
- La prioridad de derechos humanos puede sostener una marca de criticidad por debajo de 4,4; se registra como juicio documentado, no como un ajuste oculto del score.

Las mismas reglas se aplican en el servidor (persistencia) y en el cliente (vista previa de la ficha de IRO).

## Datos y trazabilidad

- Esquema normalizado en `src/lib/schema.sql`.
- Semilla en `scripts/seed.mjs` y `scripts/data/*.mjs`: 8 empresas, 80 IRO, 48 KPI, 240 divulgaciones, 64 evidencias y 80 eventos de auditoría.
- Cada escritura relevante (IRO creado/actualizado, evaluación avanzada/versionada, consulta de IA) genera un evento en `audit_logs` con actor, rol, entidad, detalle y hash determinista de integridad.
- La preferencia de tema se guarda en `localStorage` solo como ajuste de interfaz; los datos ESG nunca.

## Instrumentos y marcos

La plataforma distingue explícitamente entre **obligación legal**, **estándar**, **marco voluntario**, **guía** y **borrador**. Un borrador no se presenta como requisito vigente y la clasificación no sustituye asesoría legal.

## Agentes de IA

`src/lib/db.ts` implementa análisis determinista y anclado a la base: clasifica la consulta, selecciona registros, calcula agregados y devuelve una respuesta con fuentes, confianza y acciones sugeridas. No se envía información a un proveedor externo ni se declara una integración inexistente con modelos. La frontera está documentada en el código para sustituirla por un proveedor real manteniendo las reglas de citación y los límites.

## Límites declarados

- Datos gestionados en una base local, sin aseguramiento externo.
- Sin integraciones reales con ERP, CDP, proveedores de datos o aseguradoras.
- Cobertura parcial de cadena de valor de segundo nivel y alcance 3, declarada como brecha.
- El hash del audit trail identifica eventos; no es una firma criptográfica con clave privada.
- La vista de reporte es un documento de trabajo, no un informe legal ni una opinión de aseguramiento.
