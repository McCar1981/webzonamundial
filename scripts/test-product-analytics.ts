/**
 * Test determinista de la taxonomía de analítica de Zona de Ligas.
 *
 * No usa navegador, GA4, red ni credenciales. Valida el contrato que consumen
 * los componentes antes de enviar eventos a trackEvent.
 */

import assert from "node:assert/strict";
import {
  buildProductEvent,
  matchStateFromApiStatus,
  PRODUCT_ANALYTICS_SCHEMA_VERSION,
} from "../src/lib/analytics/product-events";

function main() {
  assert.equal(matchStateFromApiStatus("NS"), "scheduled");
  assert.equal(matchStateFromApiStatus("2H"), "live");
  assert.equal(matchStateFromApiStatus("PEN"), "finished");
  assert.equal(matchStateFromApiStatus("PST"), "interrupted");
  assert.equal(matchStateFromApiStatus("unexpected"), "unknown");

  const event = buildProductEvent("prediction_submitted", {
    fixture_id: 123,
    competition_slug: "liga-mx",
    match_state: "scheduled",
    surface: "match_poll",
    market: "1x2",
  });

  assert.deepEqual(event, {
    name: "prediction_submitted",
    params: {
      event_schema_version: PRODUCT_ANALYTICS_SCHEMA_VERSION,
      product_area: "zona_de_ligas",
      sport: "football",
      fixture_id: 123,
      competition_slug: "liga-mx",
      match_state: "scheduled",
      surface: "match_poll",
      market: "1x2",
    },
  });

  const optional = buildProductEvent("club_followed", {
    club_id: 456,
    competition_slug: undefined,
    surface: "club_page",
  });
  assert.equal("competition_slug" in optional.params, false);

  console.log("Product analytics: 7 checks OK.");
}

main();
