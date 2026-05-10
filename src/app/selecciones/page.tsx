"use client";

// /selecciones — Rediseño cinematográfico + data-rich.
// FASE 1: Hero + WorldMap + Favoritos (rotator + Power Index + sparkline + pull-quote). ✓
// FASE 2: carruseles por confederación + debutantes split + curiosidades data-viz. ✓
// FASE 3: dark horses + clasificados + browse table. ✓

import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import HeroSection from "./_components/HeroSection";
import FavoritosSection from "./_components/FavoritosSection";
import ConfedRailsSection from "./_components/ConfedRailsSection";
import DebutSplit from "./_components/DebutSplit";
import CurioGrid from "./_components/CurioGrid";
import DarkHorsesSection from "./_components/DarkHorsesSection";
import ClasificadosSection from "./_components/ClasificadosSection";
import BrowseSection from "./_components/BrowseSection";
import type { ConfedKey } from "./_components/confed-config";
import styles from "./selecciones.module.css";

export default function SeleccionesIndex() {
  const { t } = useLanguage();
  const sT = t.selecciones;
  const [filter, setFilter] = useState<ConfedKey | null>(null);

  return (
    <div className={styles.root}>
      <HeroSection
        filter={filter}
        onFilter={setFilter}
        labels={{
          breadcrumbHome: sT.breadcrumbHome,
          breadcrumbCurrent: sT.breadcrumbCurrent,
          eyebrow: sT.heroEyebrow,
          eyebrowHosts: sT.heroEyebrowHosts,
          titleLine1: sT.heroTitleLine1,
          titleLine2: sT.heroTitleLine2,
          titleLine3: sT.heroTitleLine3,
          deckBefore: sT.heroDeckBefore,
          deckTeams: sT.heroDeckTeams,
          deckMid: sT.heroDeckMid,
          deckMatches: sT.heroDeckMatches,
          deckSep1: sT.heroDeckSep1,
          deckVenues: sT.heroDeckVenues,
          deckSep2: sT.heroDeckSep2,
          deckHosts: sT.heroDeckHosts,
          deckAfter: sT.heroDeckAfter,
          statSelecciones: sT.stats.selecciones,
          statGrupos: sT.stats.grupos,
          statConfederaciones: sT.stats.confederaciones,
          statPartidos: sT.stats.partidos,
          mapFifaWc: sT.mapFifaWc,
          mapHostsBadge: sT.mapHostsBadge,
          mapCoords: sT.mapCoords,
          mapTeamsBadge: sT.mapTeamsBadge,
          mapTooltipFifa: sT.mapTooltipFifa,
          mapTooltipGrupo: sT.mapTooltipGrupo,
          mapTooltipMundiales: sT.mapTooltipMundiales,
          mapTooltipMejor: sT.mapTooltipMejor,
        }}
      />

      <div className={styles.sectionDivider} />

      <FavoritosSection
        labels={{
          numTag: sT.favNumTag,
          title: sT.favTitle,
          deck: sT.favDeck,
          rotatorPaused: sT.rotatorPaused,
          rotatorLive: sT.rotatorLive,
          grupo: sT.cardLabelGrupo,
          mundiales: sT.cardLabelMundiales,
          mejor: sT.cardLabelMejor,
          powerIndex: sT.cardLabelPowerIndex,
          twelveMonth: sT.cardLabelTwelveMonth,
          titlesSingular: sT.cardLabelTitleSingular,
          titlesPlural: sT.cardLabelTitlePlural,
          fifaShort: sT.cardLabelFifaShort,
        }}
      />

      <div className={styles.sectionDivider} />

      <ConfedRailsSection
        labels={{
          numTag: sT.railsNumTag,
          title: sT.railsTitle,
          deck: sT.railsDeck,
          rightMeta: sT.railsRightMeta,
          grupo: sT.cardLabelGrupo,
          mundiales: sT.cardLabelMundiales,
          mejor: sT.cardLabelMejor,
          badgeHost: sT.railsBadgeHost,
          badgeDebut: sT.railsBadgeDebut,
          plazasLabel: sT.railsPlazasLabel,
          teamsLabel: sT.railsTeamsLabel,
          prev: sT.railsPrev,
          next: sT.railsNext,
          fullEs: "",
          fullEn: "",
        }}
      />

      <div className={styles.sectionDivider} />

      <DebutSplit
        labels={{
          numTag: sT.debutNumTag,
          title: sT.debutSplitTitle,
          deck: sT.debutSplitDeck,
          debutKicker: sT.debutKicker,
          debutTitle: sT.debutTitle,
          debutBlurb: sT.debutBlurb,
          debutTagEnd: sT.debutTagEnd,
          debutPrefix: sT.debutPrefix,
          hostsKicker: sT.hostsKicker,
          hostsTitle: sT.hostsTitle,
          hostsBlurb: sT.hostsBlurb,
          hostsPrefix: sT.hostsPrefix,
          matchesUsa: sT.hostsMatchesUsa,
          matchesOther: sT.hostsMatchesOther,
        }}
      />

      <div className={styles.sectionDivider} />

      <CurioGrid
        labels={{
          numTag: sT.curioNumTag,
          title: sT.curioTitle,
          deck: sT.curioDeck,
          plazasUnit: sT.curioPlazasUnit,
        }}
      />

      <div className={styles.sectionDivider} />

      <DarkHorsesSection
        labels={{
          numTag: sT.dhNumTag,
          title: sT.dhTitle,
          deck: sT.dhDeck,
          hostTag: sT.dhHostTag,
        }}
      />

      <div className={styles.sectionDivider} />

      <ClasificadosSection
        labels={{
          numTag: sT.clasifNumTag,
          title: sT.clasifTitle,
          deck: sT.clasifDeck,
          rightMeta: sT.clasifRightMeta,
          plazasOf: sT.clasifPlazasOf,
        }}
      />

      <div className={styles.sectionDivider} />

      <BrowseSection
        labels={{
          numTag: sT.browseNumTag,
          title: sT.browseTitle,
          deck: sT.browseDeck,
          searchPlaceholder: sT.browseSearchPlaceholder,
          todas: sT.browseTodas,
          soloAnfitriones: sT.browseSoloAnfitriones,
          metaSeleccion: sT.browseMetaSeleccion,
          metaSelecciones: sT.browseMetaSelecciones,
          metaFilter: sT.browseMetaFilter,
          metaQuery: sT.browseMetaQuery,
          colSeleccion: sT.browseColSeleccion,
          colConf: sT.browseColConf,
          colGrupo: sT.browseColGrupo,
          colMundiales: sT.browseColMundiales,
          colMejor: sT.browseColMejor,
          colFifa: sT.browseColFifa,
          badgeHost: sT.browseBadgeHost,
          badgeDebut: sT.browseBadgeDebut,
        }}
      />
    </div>
  );
}
