"use client";

import { useEffect, useRef } from "react";
import { trackProductEvent } from "@/lib/analytics/track-event";
import { matchStateFromApiStatus } from "@/lib/analytics/product-events";

export default function MatchdayTracker({
  fixtureId,
  competitionSlug,
  fixtureStatus,
  homeTeamId,
  awayTeamId,
}: {
  fixtureId: number;
  competitionSlug: string;
  fixtureStatus: string;
  homeTeamId: number;
  awayTeamId: number;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackProductEvent("matchday_opened", {
      fixture_id: fixtureId,
      competition_slug: competitionSlug,
      match_state: matchStateFromApiStatus(fixtureStatus),
      surface: "match_center",
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
    });
  }, [awayTeamId, competitionSlug, fixtureId, fixtureStatus, homeTeamId]);

  return null;
}
