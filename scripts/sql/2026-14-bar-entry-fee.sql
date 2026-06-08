-- scripts/sql/2026-14-bar-entry-fee.sql
--
-- Módulo B2B "Porras Digitales para Bares" — Inscripción opcional (Opción B).
--
-- Algunos locales quieren cobrar una cuota de participación a sus clientes. Para
-- mantener a ZonaMundial FUERA del terreno del juego/apuesta regulado, la
-- plataforma NO cobra ni gestiona ese dinero: el bar lo cobra directamente (en
-- barra/efectivo) bajo su responsabilidad. Aquí solo guardamos un texto
-- INFORMATIVO que el dueño redacta y que se muestra a sus clientes.
--
-- entry_fee_note: texto libre (p. ej. "Participación: 3 € que se abonan en barra").
-- NULL o vacío = porra gratuita (comportamiento por defecto, sin cambios).
--
-- Idempotente: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.bars
  ADD COLUMN IF NOT EXISTS entry_fee_note TEXT;
