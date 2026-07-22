-- 2026-52-liga-prediction-leaderboard-rpc.sql
--
-- Ranking de PREDICTORES por liga de Zona de Ligas (leaderboard de Fútcoins).
-- Análogo a prediction_leaderboard (2026-34, Mundial) pero sobre liga_predictions
-- y agrupando por competition_slug. Agrega en Postgres (evita el tope de ~1000
-- filas de PostgREST) y solo la llama el backend con service role.
--
-- Fútcoins por acierto: liga_predictions NO guarda las monedas por fila, así que
-- se derivan del mercado con el MISMO baremo que reparte el cron
-- resolve-liga-predictions: 1x2=10, exact=40, typed=MARKET_REWARD, chain=data.reward.
-- (El boost del 1x2 es un amplificador aparte; para el ranking se usa la base 10.)
--
-- Requiere que existan las columnas `market` y `data` (2026-47). Idempotente.

create or replace function public.liga_prediction_leaderboard(
  p_slug  text        default null,   -- null = todas las ligas (global de predicciones)
  p_since timestamptz default null,   -- null = histórico; con fecha = ventana (semanal)
  p_limit integer     default 50
)
returns table (
  user_id           uuid,
  total_coins       bigint,
  predictions_count bigint,
  correct_count     bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select lp.user_id,
         coalesce(sum(
           case when lp.status = 'won' then
             case
               when lp.market = 'exact'                                             then 40
               when lp.market = 'chain'                                             then coalesce((lp.data->>'reward')::int, 0)
               when lp.market = 'first_scorer'                                      then 30
               when lp.market = 'duel'                                              then 20
               when lp.market in ('ou_goals','first_goal','ou_corners','first_goal_half') then 15
               when lp.market in ('btts','ou_cards')                               then 12
               else 10  -- 1x2 (market null o '1x2'): base, sin boost
             end
           else 0 end
         ), 0)::bigint                                                as total_coins,
         count(*)::bigint                                             as predictions_count,
         count(*) filter (where lp.status = 'won')::bigint           as correct_count
  from public.liga_predictions lp
  where lp.status in ('won', 'lost', 'void')                         -- solo resueltas
    and (p_slug  is null or lp.competition_slug = p_slug)
    and (p_since is null or lp.resolved_at >= p_since)
  group by lp.user_id
  having count(*) filter (where lp.status = 'won') > 0               -- con al menos un acierto
  order by total_coins desc, correct_count desc
  limit greatest(coalesce(p_limit, 50), 1);
$$;

revoke all on function public.liga_prediction_leaderboard(text, timestamptz, integer) from public, anon, authenticated;
grant execute on function public.liga_prediction_leaderboard(text, timestamptz, integer) to service_role;
