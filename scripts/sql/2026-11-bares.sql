-- scripts/sql/2026-11-bares.sql
--
-- Módulo B2B "Porras Digitales para Bares" — FASE 1 (MVP).
--
-- La porra de un bar NO reinventa nada: ES una liga privada de predicciones.
-- Cada bar posee una fila en `prediction_leagues` (bars.league_id) y los clientes
-- que entran por QR se añaden a `prediction_league_members`. Así el scoring, la
-- resolución por cron y el cálculo de ranking ya existentes funcionan tal cual.
--
-- Estas tablas solo añaden la capa B2B: identidad del bar, premios, fuentes QR
-- con tracking y un log de eventos para las estadísticas del dueño.
--
-- Patrón idéntico al resto del proyecto: el usuario lee/gestiona lo suyo con RLS;
-- las lecturas públicas (página del bar, ranking, TV) y las escrituras cruzadas
-- (incrementar escaneos, registrar eventos, unir al cliente) las hace el backend
-- con la SERVICE ROLE KEY (bypassa RLS).
--
-- Idempotente: se puede reaplicar sin romper nada (IF NOT EXISTS / DROP POLICY).

-- ============================================================================
-- 1) Bares — cliente B2B + identidad + tema visual + plan
-- ============================================================================
-- theme_id y plan_id son claves de catálogos definidos EN CÓDIGO (lib/bars), no
-- tablas: son estáticos y el bar solo los selecciona, no los edita.
CREATE TABLE IF NOT EXISTS public.bars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  league_id       UUID REFERENCES public.prediction_leagues(id) ON DELETE SET NULL,
  name            VARCHAR(80) NOT NULL,
  slug            VARCHAR(60) NOT NULL UNIQUE,
  logo_url        TEXT,
  cover_url       TEXT,
  description     TEXT,
  welcome_message TEXT,
  address         VARCHAR(160),
  city            VARCHAR(80),
  phone           VARCHAR(40),
  instagram       VARCHAR(80),
  website         VARCHAR(160),
  theme_id        VARCHAR(40) NOT NULL DEFAULT 'deportivo-oscuro',
  cta_label       VARCHAR(40) NOT NULL DEFAULT 'Entrar en la porra',
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',   -- draft | published | paused
  plan_id         VARCHAR(40) NOT NULL DEFAULT 'arranque', -- arranque | completo | pro
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bars_owner_idx  ON public.bars (owner_user_id);
CREATE INDEX IF NOT EXISTS bars_status_idx ON public.bars (status);

-- ============================================================================
-- 2) Participantes — metadatos B2B de la membresía (atribución por QR)
-- ============================================================================
-- La membresía REAL y el ranking viven en prediction_league_members (reuso).
-- Esta tabla solo guarda de DÓNDE vino el cliente (qué QR) y su alias para el bar.
CREATE TABLE IF NOT EXISTS public.bar_participants (
  bar_id        UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias         VARCHAR(40),
  source        VARCHAR(30) NOT NULL DEFAULT 'qr',  -- qr | link | manual
  qr_source_id  UUID,                               -- FK lógica a bar_qr_sources
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (bar_id, user_id)
);
CREATE INDEX IF NOT EXISTS bar_participants_user_idx ON public.bar_participants (user_id);

-- ============================================================================
-- 3) Premios — incentivos configurados por el bar
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bar_prizes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id         UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  title          VARCHAR(120) NOT NULL,
  description    TEXT,
  image_url      TEXT,
  prize_type     VARCHAR(30) NOT NULL DEFAULT 'principal', -- principal | semanal | final
  valid_until    DATE,
  conditions     TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'active',     -- active | delivered | expired
  winner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delivered_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bar_prizes_bar_idx ON public.bar_prizes (bar_id);

-- ============================================================================
-- 4) Fuentes QR — un QR por zona, con código corto y tracking de escaneos
-- ============================================================================
-- code es lo que aparece en /r/[code]. El MVP crea uno 'main' por bar; el plan
-- Pro permite varios (barra, terraza, salón, TV, redes) con tracking propio.
CREATE TABLE IF NOT EXISTS public.bar_qr_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id        UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  code          VARCHAR(16) NOT NULL UNIQUE,
  source_type   VARCHAR(20) NOT NULL DEFAULT 'main', -- main | barra | terraza | salon | tv | redes
  label         VARCHAR(40),
  utm_source    VARCHAR(40) NOT NULL DEFAULT 'qr',
  utm_medium    VARCHAR(40) NOT NULL DEFAULT 'bar',
  utm_campaign  VARCHAR(60) NOT NULL DEFAULT 'mundial2026',
  utm_content   VARCHAR(40) NOT NULL DEFAULT 'main',
  scans_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bar_qr_sources_bar_idx ON public.bar_qr_sources (bar_id);

-- ============================================================================
-- 5) Eventos — log para estadísticas del bar (escaneos, registros, predicciones…)
-- ============================================================================
-- GA4 cubre analytics de producto; esto da al DUEÑO sus métricas en el dashboard
-- sin depender de Google. Las inserciones las hace el backend (service role).
CREATE TABLE IF NOT EXISTS public.bar_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bar_id       UUID NOT NULL REFERENCES public.bars(id) ON DELETE CASCADE,
  event_type   VARCHAR(50) NOT NULL,  -- bar_qr_scan | bar_user_joined | bar_prediction_completed | ...
  qr_source_id UUID,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bar_events_bar_idx ON public.bar_events (bar_id, created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.bars             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_prizes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_qr_sources   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_events       ENABLE ROW LEVEL SECURITY;

-- Bares: el dueño lee y gestiona los suyos.
-- (Las páginas públicas del bar las sirve el service role, igual que el ranking.)
DROP POLICY IF EXISTS "bars read own"   ON public.bars;
DROP POLICY IF EXISTS "bars insert own" ON public.bars;
DROP POLICY IF EXISTS "bars update own" ON public.bars;
DROP POLICY IF EXISTS "bars delete own" ON public.bars;
CREATE POLICY "bars read own"   ON public.bars FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "bars insert own" ON public.bars FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "bars update own" ON public.bars FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "bars delete own" ON public.bars FOR DELETE USING (auth.uid() = owner_user_id);

-- Participantes: el cliente lee su propia membresía; el dueño lee las de su bar.
-- (El alta al unirse por QR la hace el backend con service role.)
DROP POLICY IF EXISTS "bar participants read" ON public.bar_participants;
CREATE POLICY "bar participants read" ON public.bar_participants FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid())
);

-- Premios: el dueño los gestiona. (La lectura pública la sirve el service role.)
DROP POLICY IF EXISTS "bar prizes owner read"   ON public.bar_prizes;
DROP POLICY IF EXISTS "bar prizes owner insert" ON public.bar_prizes;
DROP POLICY IF EXISTS "bar prizes owner update" ON public.bar_prizes;
DROP POLICY IF EXISTS "bar prizes owner delete" ON public.bar_prizes;
CREATE POLICY "bar prizes owner read"   ON public.bar_prizes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "bar prizes owner insert" ON public.bar_prizes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "bar prizes owner update" ON public.bar_prizes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "bar prizes owner delete" ON public.bar_prizes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));

-- Fuentes QR: el dueño las gestiona. (El incremento de escaneos lo hace el service role.)
DROP POLICY IF EXISTS "bar qr owner read"   ON public.bar_qr_sources;
DROP POLICY IF EXISTS "bar qr owner insert" ON public.bar_qr_sources;
DROP POLICY IF EXISTS "bar qr owner update" ON public.bar_qr_sources;
DROP POLICY IF EXISTS "bar qr owner delete" ON public.bar_qr_sources;
CREATE POLICY "bar qr owner read"   ON public.bar_qr_sources FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "bar qr owner insert" ON public.bar_qr_sources FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "bar qr owner update" ON public.bar_qr_sources FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
CREATE POLICY "bar qr owner delete" ON public.bar_qr_sources FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));

-- Eventos: el dueño lee los de su bar. (Las inserciones las hace el service role.)
DROP POLICY IF EXISTS "bar events owner read" ON public.bar_events;
CREATE POLICY "bar events owner read" ON public.bar_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bars b WHERE b.id = bar_id AND b.owner_user_id = auth.uid()));
