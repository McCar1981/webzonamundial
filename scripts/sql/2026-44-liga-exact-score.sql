-- 2026-44-liga-exact-score.sql
--
-- Mercado "marcador exacto" en las predicciones de Zona de Ligas.
--
-- Aditivo y seguro para las filas existentes: todas las predicciones actuales
-- pasan a market='1x2' por el DEFAULT, y la unicidad se conserva porque el nuevo
-- indice unico (user_id, fixture_id, market) es igual de estricto cuando solo
-- existe un mercado. Con dos mercados, un usuario puede tener EL 1X2 y EL
-- marcador exacto del mismo partido (dos oportunidades de ganar por partido).
--
-- pick pasa a ser NULLABLE: las filas de marcador exacto no tienen pick; su
-- pronostico vive en score_home/score_away. El CHECK original de pick tolera
-- NULL (null-in-list evalua a NULL y un CHECK solo falla con FALSE).

alter table public.liga_predictions
  add column if not exists market text not null default '1x2';

alter table public.liga_predictions
  add column if not exists score_home smallint;

alter table public.liga_predictions
  add column if not exists score_away smallint;

alter table public.liga_predictions
  alter column pick drop not null;

-- Un pronostico por partido, usuario y MERCADO (antes: por partido y usuario).
alter table public.liga_predictions
  drop constraint if exists liga_predictions_user_id_fixture_id_key;
create unique index if not exists liga_predictions_user_fixture_market_key
  on public.liga_predictions (user_id, fixture_id, market);

-- Guardas defensivas de coherencia por mercado.
do $$ begin
  alter table public.liga_predictions
    add constraint liga_predictions_market_chk
    check (market in ('1x2', 'exact'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.liga_predictions
    add constraint liga_predictions_exact_scores_chk
    check (market <> 'exact' or (score_home is not null and score_away is not null
                                 and score_home between 0 and 30 and score_away between 0 and 30));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.liga_predictions
    add constraint liga_predictions_1x2_pick_chk
    check (market <> '1x2' or pick is not null);
exception when duplicate_object then null; end $$;
