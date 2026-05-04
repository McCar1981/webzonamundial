/**
 * Translations for all the new home sections built on top of the existing
 * i18n system. Kept in its own module so `translations.ts` stays small and
 * edits are easy.
 *
 * Usage:
 *   const { locale } = useLanguage();
 *   const tSec = homeSections[locale].statsHow;
 */

export type SectionLocale = "es" | "en";

export const homeSections = {
  es: {
    /* ============ StatsHowSection ============ */
    statsHow: {
      title: "48 selecciones. 16 sedes. 104 partidos. 1 ganador:",
      titleGold: "tú.",
      subtitle: "Todo lo que necesitas para vivir el Mundial 2026 como nunca antes.",
      statLabels: {
        selecciones: "Selecciones",
        sedes: "Sedes",
        partidos: "Partidos",
        grupos: "Grupos",
        paises: "Países",
        modulos: "Módulos",
      },
      howPill: "ASÍ DE FÁCIL",
      howTitle: "¿Cómo funciona?",
      howSub: "Tres pasos y ya estás dentro. Sin complicaciones, sin letra pequeña.",
      steps: [
        {
          title: "Selecciona a tu creador",
          desc: "Eliges tu selección, descubre datos, fixture del Mundial 2026.",
        },
        {
          title: "Juega y predice",
          desc: "Entra en predicciones, fantasy, trivia y ligas privadas con tus amigos.",
        },
        {
          title: "Vive y gana",
          desc: "Sigue los partidos en streaming con creadores y gana premios reales.",
        },
      ],
      stepsA11y: "Pasos",
    },

    /* ============ PlatformShowcaseSection ============ */
    platform: {
      eyebrow: "¿POR QUÉ ZONAMUNDIAL? PORQUE EL RESTO SE QUEDA CORTO.",
      title1: "La plataforma que",
      title2: "el Mundial 2026",
      title3a: "merece,",
      title3b: "no la que",
      title4: "necesita.",
      para:
        "En ZonaMundial no hacemos lo mínimo. Hacemos lo máximo. Predicciones, fantasy, trivia, streaming, IA coach y una comunidad de millones. Todo en un solo lugar. Todo gratis.",
      highlight1: "Sin anuncios intrusivos.",
      highlight2: "Sin letra pequeña.",
      highlight3: "Solo fútbol puro.",
      cards: {
        selecciones: {
          label: "Selecciones",
          desc: "Datos, plantillas y estadísticas de todos los equipos clasificados al Mundial.",
        },
        futbolPuro: {
          label: "Fútbol puro",
          desc: "Sin ruido, sin distracciones. Solo el Mundial y todo lo que lo rodea.",
        },
        todoEn1: {
          label: "Una sola plataforma",
          desc: "Fantasy, predicciones, trivia, streaming, IA y mucho más, siempre a mano.",
          num: "Todo en 1",
        },
      },
      barLabels: {
        usuarios: "Usuarios registrados",
        partidos: "Partidos",
        sedes: "Sedes",
        paises: "Países anfitriones",
      },
      phoneAlt: "App ZonaMundial",
    },

    /* ============ ModulesGridSection ============ */
    modulesGrid: {
      pill: "12 formas de ganar. Elige la tuya.",
      title1: "Todo lo que necesitas para",
      title2: "no",
      titleGold: "quedarte fuera",
      sub:
        "Doce módulos diseñados para dominar cada minuto del Mundial 2026. Desde predicciones en tiempo real hasta tu propio fantasy, pasando por trivias históricas y un coach de inteligencia artificial.",
      subAccent: "Todo en un solo lugar. Todo gratis. Todo para ganar.",
      divider: "Módulos",
      ctaExplore: "Explorar todos los módulos",
      items: [
        { title: "Match Center", desc: "104 partidos en vivo con stats, alineaciones y eventos minuto a minuto." },
        { title: "Predicciones", desc: "8 tipos: resultado exacto, goleador, tarjetas, corners, MVP y más." },
        { title: "Fantasy", desc: "Arma tu 11 ideal con presupuesto limitado. Puntos reales, ranking global." },
        { title: "IA Coach", desc: "Analista personal con inteligencia artificial: tácticas y recomendaciones." },
        { title: "Zona Streaming", desc: "Directos con creadores durante los partidos. Reacciones en vivo." },
        { title: "Trivia Diaria", desc: "Preguntas diarias de fútbol — gana puntos extra y escala posiciones." },
        { title: "Modo Carrera", desc: "Dirige una selección durante todo el torneo como DT virtual." },
        { title: "Ligas Privadas", desc: "Crea ligas con amigos, compañeros o tu comunidad favorita." },
        { title: "Rankings", desc: "Global, por país, por creador — demuestra quién sabe más de fútbol." },
        { title: "Chat en Vivo", desc: "Chat en tiempo real con tu liga durante cada partido." },
        { title: "Micro-predicciones", desc: "Predicciones en directo: próximo gol, corner, tarjeta, cambio." },
        { title: "Trivias Históricas", desc: "Revive y compite con las mejores preguntas de Mundiales pasados." },
      ],
    },

    /* ============ ModulesBentoSection ============ */
    modulesBento: {
      pill: "Esto no es una app. Es un arma cargada de fútbol.",
      title1: "Todo lo que necesitas,",
      titleGold: "en un solo lugar",
      sub:
        "Predicciones, fantasy, IA Coach, trivia y streaming — diseñado para el fanático que no se pierde nada.",
      ctaExplore: "Explorar todos los módulos",
      tags: {
        wc: "Copa del Mundo 2026 · EE.UU. · México · Canadá",
        fantasy: "Fantasy",
        trivia: "Trivia",
        ai: "IA Coach",
        aiBadge: "Ventaja anfitrión",
        liveTag: "En vivo",
      },
      predictions: {
        title1: "El Mundial 2026",
        title2: "te necesita,",
        title3: "no dejes que otro lo viva por ti",
        label: "Predicciones",
        tagline: "Predice cada resultado y compite con tu creador favorito",
      },
      fantasy: {
        formation: "4-3-3",
        tagline: "Arma tu equipo ideal y sube en el ranking",
      },
      trivia: {
        title: "¿Quién marcó el gol de la mano de Dios en el Mundial de 1986?",
        text1: "¿Cuánto sabes de fútbol?",
        text2: "Demuéstralo",
      },
      ai: {
        title: "Tu asistente inteligente para cada partido",
        features: [
          "Análisis en tiempo real",
          "Recomendaciones personalizadas",
          "Estrategias ganadoras",
        ],
      },
      streaming: {
        title: "Vive los partidos con tus creadores en directo",
        viewers: "2.4K",
        chat: [
          { user: "MessiFan2023", msg: "¡Vamos España! 🇪🇸" },
          { user: "FutbolTotal", msg: "Golazo 🔥🔥🔥" },
          { user: "ZonaMundial", msg: "Increíble partido!" },
        ],
        footer: "CHAT · REACCIONES · PREMIOS",
      },
    },

    /* ============ CommunityCreatorsSection ============ */
    community: {
      pill: "Respaldado por los que realmente entienden de fútbol",
      title1: "+12.3M de seguidores. Una sola app.",
      titleGold: "Tú eliges con quién vivirlo.",
      desc:
        "Los creadores de contenido futbolístico más grandes del mundo están en ZonaMundial. Directos, reacciones, análisis y debates en tiempo real con quienes mejor entienden este deporte.",
      infoBefore: "Más de",
      infoHighlight: "12.3M de seguidores",
      infoAfter: "concentrados en una sola comunidad.",
      infoSub: "Elige con quién vivirlo cada partido.",
      cta: "Ver todos los creadores",
      features: [
        { title: "Directos en vivo", desc: "Sigue transmisiones en vivo con tus creadores favoritos." },
        { title: "Reacciones reales", desc: "Vive cada jugada con reacciones auténticas y sin filtros." },
        { title: "Análisis experto", desc: "Estadísticas, tácticas y opiniones de quienes más saben." },
        { title: "Comunidad única", desc: "Conecta con millones de fanáticos que comparten tu pasión." },
      ],
      creatorsTitle: "Conoce a los creadores",
      creatorsSubA: "creadores oficiales. Elige tu favorito y vive el Mundial con su comunidad.",
      ballAlt: "Balón oficial del Mundial 2026 sobre el césped",
    },

    /* ============ AlbumDominaSection ============ */
    album: {
      title1: "Completa el",
      titleGold1: "Álbum.",
      title2: "Domina el",
      titleGold2: "Mundial.",
      eyebrow: "Cromos de oro de las 48 selecciones.",
      desc1: "Ediciones que solo desbloquean los que realmente viven el torneo.",
      desc2: "Y un mercado P2P para que nadie te frene.",
      heroAlt: "Álbum dorado del Mundial 2026 con cromos de selecciones",
      benefits: [
        {
          title: "48 selecciones. Un solo álbum.",
          items: [
            "Desde las potencias hasta los debutantes.",
            "Cada cromo cuenta una historia.",
            "Colecciónalos todas.",
          ],
        },
        {
          title: "Oro puro por ver partidos",
          items: [
            "No pagues. Gánalos.",
            "Ediciones exclusivas que solo sueltan partidos épicos y desafíos cumplidos.",
          ],
        },
        {
          title: "Tradea como un profesional",
          items: [
            "¿Repetidos? Perfecto.",
            "Cambia con amigos o negocia con la comunidad. El álbum se completa ganando.",
          ],
        },
      ],
    },

    /* ============ WaitlistSection ============ */
    waitlist: {
      pill: "Lista de espera",
      title1: "Sé de los",
      titleGold: "primeros.",
      descBefore: "La app llega pronto. Tu lugar está",
      descHighlight: "reservado",
      descAfter: "si lo reclamas ahora.",
      benefits: [
        "Acceso anticipado a la app",
        "Beneficios exclusivos",
        "Compite desde el día uno",
      ],
      formTitle: "ÚNETE A LA LISTA Y ASEGURA TU LUGAR",
      emailPlaceholder: "Tu email",
      submit: "Unirme a la lista",
      submitting: "Reservando...",
      assurance: "Sin spam. Sin compromiso. Solo fútbol.",
      counterLabel: "personas delante de ti",
      counterLabelJoined: "personas ya están dentro",
      successTitle: "¡Estás dentro!",
      successMsg:
        "Tu lugar en la lista está reservado. Te avisaremos por email en cuanto la app esté disponible.",
      errorNetwork: "Error de red. Intenta de nuevo.",
      errorGeneric: "No se pudo guardar. Intenta de nuevo.",
      strip: [
        "La IA acertó 3\nresultados seguidos",
        "El fantasy\nes adictivo",
        "Los creadores hacen\nque todo sea más épico",
        "Por fin una app que\nentiende de fútbol",
        "El fantasy\nes adictivo",
        "La IA acertó 3\nresultados seguidos",
      ],
    },

    /* ============ FinalCTASection ============ */
    finalCta: {
      title1: "¿Quién ganará el",
      titleGold1: "Mundial 2026?",
      title2: "Spoiler: da igual.",
      title3: "Gana quien lo viva en",
      titleGold2: "ZonaMundial.",
      desc: "Entra gratis. Si no te gusta, te devolvemos el silencio.",
      cta: "Registrarme gratis",
      assurance: {
        free: "100% gratis",
        noCard: "Sin tarjeta",
        noCommitment: "Sin compromiso",
      },
    },

    /* ============ SiteFooter ============ */
    footer: {
      tag: "Predicciones, fantasy y engagement en español para la Copa del Mundo 2026.",
      poweredBy: "Powered by",
      columns: {
        torneo: {
          title: "Torneo",
          links: [
            { label: "48 Selecciones", href: "/selecciones" },
            { label: "12 Grupos", href: "/grupos" },
            { label: "16 Sedes", href: "/sedes" },
            { label: "Calendario", href: "/calendario" },
            { label: "Historia", href: "/historia" },
          ],
        },
        plataforma: {
          title: "Plataforma",
          links: [
            { label: "Predicciones", href: "/app/predicciones" },
            { label: "Fantasy", href: "/app/fantasy" },
            { label: "IA Coach", href: "/app/ia-coach" },
            { label: "Trivia", href: "/app/trivia" },
            { label: "Modo Carrera", href: "/app/modo-carrera" },
            { label: "Premium", href: "/premium" },
          ],
        },
        comunidad: {
          title: "Comunidad",
          links: [
            { label: "Noticias", href: "/noticias" },
            { label: "Blog", href: "/blog" },
            { label: "Tutoriales", href: "/tutoriales" },
            { label: "Creadores", href: "/creadores" },
            { label: "Ligas Privadas", href: "/app/ligas" },
            { label: "Rankings", href: "/app/rankings" },
            { label: "Streaming", href: "/app/streaming" },
          ],
        },
        legal: {
          title: "Legal",
          links: [
            { label: "Aviso Legal", href: "/legal/aviso-legal" },
            { label: "Términos de uso", href: "/legal/terminos" },
            { label: "Privacidad", href: "/legal/privacidad" },
            { label: "Cookies", href: "/legal/cookies" },
            { label: "EULA", href: "/legal/eula" },
            { label: "Contacto", href: "mailto:business.dev@sprintmarkt.com" },
          ],
        },
      },
      copyright: "© 2026 Sprintmarkt · Valencia, España",
      copyrightParts: {
        prefix: "© 2026 ",
        brand: "Sprintmarkt",
        suffix: " · Valencia, España",
      },
      disclaimer: "Plataforma de predicciones gratuita. No implica apuesta monetaria.",
    },

    /* ============ SocialDock ============ */
    socialDock: {
      eyebrow: "SÍGUENOS",
      a11y: "Redes sociales de ZonaMundial",
      on: "ZonaMundial en",
    },

    /* ============ AppRevealSection — coming-soon teaser ============ */
    appReveal: {
      pill: "MUY PRONTO",
      title: "Algo grande",
      titleGold: "se viene.",
      subtitle:
        "Estamos preparando la mejor experiencia para los verdaderos fanáticos del fútbol.",
      notify: {
        title: "Sé el primero en enterarte.",
        desc: "Descarga la app en cuanto esté disponible.",
      },
      stores: {
        appStoreSoon: "Próximamente en",
        appStoreName: "App Store",
        playStoreSoon: "Próximamente en",
        playStoreName: "Google Play",
      },
      phoneLabel: "Zona Mundial",
      phoneLoading: "Loading / Cargando...",
      features: [
        {
          title: "Sé el primero",
          desc: "Accede antes que nadie a la mejor app de fútbol.",
        },
        {
          title: "Experiencia única",
          desc: "Todo el fútbol mundial en tus manos.",
        },
        {
          title: "Disponible pronto",
          desc: "Muy pronto en App Store y Google Play.",
        },
      ],
    },

    /* ============ HeroSection ============ */
    hero: {
      headlines: {
        juega: { l1: "El Mundial", l2: "no se mira.", l3: "Se juega." },
        ia: {
          l1: "Predice. Compite.",
          l2: "Gana.",
          l3a: "Con",
          em: "IA Coach",
          l3b: "de tu lado.",
        },
        fantasy: {
          l1: "Arma tu",
          l2: "selección ideal",
          l3: "y reta al mundo.",
        },
      },
      sub: {
        before: "Predice en tiempo real, compite en",
        bold1: "ligas privadas",
        middle: ", crea tu fantasy y juega con",
        chip: "IA Coach",
        afterChip: "durante los",
        bold2: "104 partidos",
        end: "del Mundial 2026.",
      },
      pillars: {
        matches: { label1: "Partidos", label2: "en directo" },
        ai: { label1: "IA Coach", label2: "personal" },
        prizes: { label1: "En premios", label2: "y exclusivos" },
      },
      ctaPrimary: "Pre-regístrate gratis",
      ctaGhost: "Ver cómo funciona",
      ctaNote: {
        before: "Sin tarjeta ·",
        bold: "Acceso anticipado",
        after: "al Founders Pass",
      },
      proof: {
        boldCount: "8.642 aficionados",
        afterBold: "ya están en la lista",
        sub: "Se añaden ~180 cada día",
        avatarAlt: "Creador",
      },
      slider: {
        a11yLabel: "Elegir titular",
        labels: { juega: "Juega", ia: "IA Coach", fantasy: "Fantasy" },
        play: "Reanudar slider",
        pause: "Pausar slider",
      },
      stats: {
        users: "Usuarios activos",
        venues: "Sedes oficiales",
        teams: "Selecciones",
        groups: "Grupos",
        purity: "Fútbol puro",
      },
      chips: {
        liveLabel: "En vivo ahora",
        prediction: "Tu predicción",
        predictionSub: "+47 puntos · gol min. 23",
        ranking: "Ranking liga",
        coachSuggests: "IA Coach sugiere",
        coachSwap: "Cambia a Mbappé (+12%)",
      },
      stadiumAlt: "Estadio del Mundial",
      phoneAlt: "Pantalla de la app ZonaMundial",
    },

    /* ============ Countdown label shared with Hero ============ */
    countdownLabel: "Copa del Mundo · EE.UU · México · Canadá",
  },

  en: {
    statsHow: {
      title: "48 teams. 16 venues. 104 matches. 1 winner:",
      titleGold: "you.",
      subtitle: "Everything you need to live the 2026 World Cup like never before.",
      statLabels: {
        selecciones: "Teams",
        sedes: "Venues",
        partidos: "Matches",
        grupos: "Groups",
        paises: "Countries",
        modulos: "Modules",
      },
      howPill: "IT'S THAT EASY",
      howTitle: "How does it work?",
      howSub: "Three steps and you're in. No fine print, no strings attached.",
      steps: [
        {
          title: "Choose your creator",
          desc: "Pick your national team and unlock data and the 2026 World Cup fixture.",
        },
        {
          title: "Play and predict",
          desc: "Enter predictions, fantasy, trivia and private leagues with your friends.",
        },
        {
          title: "Live it and win",
          desc: "Stream matches with creators and win real prizes.",
        },
      ],
      stepsA11y: "Steps",
    },

    platform: {
      eyebrow: "WHY ZONAMUNDIAL? BECAUSE EVERYTHING ELSE FALLS SHORT.",
      title1: "The platform the",
      title2: "2026 World Cup",
      title3a: "deserves,",
      title3b: "not the one",
      title4: "it needs.",
      para:
        "At ZonaMundial we don't do the bare minimum. We do the maximum. Predictions, fantasy, trivia, streaming, an AI coach and a community of millions. All in one place. All free.",
      highlight1: "No intrusive ads.",
      highlight2: "No fine print.",
      highlight3: "Just pure football.",
      cards: {
        selecciones: {
          label: "Teams",
          desc: "Data, rosters and stats for every team qualified for the World Cup.",
        },
        futbolPuro: {
          label: "Pure football",
          desc: "No noise, no distractions. Just the World Cup and everything around it.",
        },
        todoEn1: {
          label: "One single platform",
          desc: "Fantasy, predictions, trivia, streaming, AI and much more, always at hand.",
          num: "All in 1",
        },
      },
      barLabels: {
        usuarios: "Registered users",
        partidos: "Matches",
        sedes: "Venues",
        paises: "Host countries",
      },
      phoneAlt: "ZonaMundial app",
    },

    modulesGrid: {
      pill: "12 ways to win. Pick yours.",
      title1: "Everything you need to",
      title2: "never",
      titleGold: "be left out",
      sub:
        "Twelve modules designed to own every minute of the 2026 World Cup. From real-time predictions to your own fantasy, historical trivias and an AI coach.",
      subAccent: "All in one place. All free. All to win.",
      divider: "Modules",
      ctaExplore: "Explore all modules",
      items: [
        { title: "Match Center", desc: "104 live matches with stats, lineups and minute-by-minute events." },
        { title: "Predictions", desc: "8 types: exact score, goalscorer, cards, corners, MVP and more." },
        { title: "Fantasy", desc: "Build your ideal XI on a fixed budget. Real points, global ranking." },
        { title: "AI Coach", desc: "Your personal AI analyst: tactics and recommendations." },
        { title: "Streaming Zone", desc: "Live shows with creators during matches. Real-time reactions." },
        { title: "Daily Trivia", desc: "Daily football questions — earn extra points and climb the ranks." },
        { title: "Career Mode", desc: "Manage a national team through the entire tournament." },
        { title: "Private Leagues", desc: "Create leagues with friends, coworkers or your favorite community." },
        { title: "Rankings", desc: "Global, by country, by creator — prove who knows football best." },
        { title: "Live Chat", desc: "Real-time chat with your league during every match." },
        { title: "Micro-predictions", desc: "Live predictions: next goal, corner, card, substitution." },
        { title: "Historical Trivias", desc: "Relive and compete with the best questions from past World Cups." },
      ],
    },

    modulesBento: {
      pill: "This is not an app. It's a football weapon.",
      title1: "Everything you need,",
      titleGold: "in one place",
      sub:
        "Predictions, fantasy, AI Coach, trivia and streaming — designed for the fan who doesn't miss a thing.",
      ctaExplore: "Explore all modules",
      tags: {
        wc: "FIFA World Cup 2026 · USA · Mexico · Canada",
        fantasy: "Fantasy",
        trivia: "Trivia",
        ai: "AI Coach",
        aiBadge: "Home advantage",
        liveTag: "Live",
      },
      predictions: {
        title1: "The 2026 World Cup",
        title2: "needs you,",
        title3: "don't let someone else live it for you",
        label: "Predictions",
        tagline: "Predict every result and compete with your favorite creator",
      },
      fantasy: {
        formation: "4-3-3",
        tagline: "Build your ideal team and climb the ranking",
      },
      trivia: {
        title: "Who scored the Hand of God goal in the 1986 World Cup?",
        text1: "How much do you know about football?",
        text2: "Prove it",
      },
      ai: {
        title: "Your smart assistant for every match",
        features: [
          "Real-time analysis",
          "Personalized recommendations",
          "Winning strategies",
        ],
      },
      streaming: {
        title: "Watch matches with your creators live",
        viewers: "2.4K",
        chat: [
          { user: "MessiFan2023", msg: "Let's go Spain! 🇪🇸" },
          { user: "FutbolTotal", msg: "What a goal 🔥🔥🔥" },
          { user: "ZonaMundial", msg: "Incredible match!" },
        ],
        footer: "CHAT · REACTIONS · PRIZES",
      },
    },

    community: {
      pill: "Backed by those who truly know football",
      title1: "+12.3M followers. One single app.",
      titleGold: "You choose who to live it with.",
      desc:
        "The world's biggest football content creators are on ZonaMundial. Live shows, reactions, analysis and debates in real time with those who know the game best.",
      infoBefore: "More than",
      infoHighlight: "12.3M followers",
      infoAfter: "gathered in one single community.",
      infoSub: "Choose who to live it with every match.",
      cta: "See all creators",
      features: [
        { title: "Live broadcasts", desc: "Follow live streams with your favorite creators." },
        { title: "Real reactions", desc: "Live every play with authentic, unfiltered reactions." },
        { title: "Expert analysis", desc: "Stats, tactics and opinions from those who know best." },
        { title: "Unique community", desc: "Connect with millions of fans who share your passion." },
      ],
      creatorsTitle: "Meet the creators",
      creatorsSubA:
        "official creators. Pick your favorite and live the World Cup with their community.",
      ballAlt: "Official 2026 World Cup ball on the pitch",
    },

    album: {
      title1: "Complete the",
      titleGold1: "Album.",
      title2: "Own the",
      titleGold2: "World Cup.",
      eyebrow: "Gold stickers of the 48 teams.",
      desc1: "Editions only unlocked by those who truly live the tournament.",
      desc2: "Plus a P2P marketplace so nothing can stop you.",
      heroAlt: "2026 World Cup golden album with team stickers",
      benefits: [
        {
          title: "48 teams. One album.",
          items: [
            "From the giants to the rookies.",
            "Every sticker tells a story.",
            "Collect them all.",
          ],
        },
        {
          title: "Pure gold by watching matches",
          items: [
            "Don't pay. Earn them.",
            "Exclusive editions that only drop on epic matches and completed challenges.",
          ],
        },
        {
          title: "Trade like a pro",
          items: [
            "Duplicates? Perfect.",
            "Swap with friends or trade with the community. The album is completed by winning.",
          ],
        },
      ],
    },

    waitlist: {
      pill: "Waiting list",
      title1: "Be one of the",
      titleGold: "first.",
      descBefore: "The app is coming soon. Your spot is",
      descHighlight: "reserved",
      descAfter: "if you claim it now.",
      benefits: [
        "Early access to the app",
        "Exclusive benefits",
        "Compete from day one",
      ],
      formTitle: "JOIN THE LIST AND SECURE YOUR SPOT",
      emailPlaceholder: "Your email",
      submit: "Join the list",
      submitting: "Reserving...",
      assurance: "No spam. No strings attached. Just football.",
      counterLabel: "people ahead of you",
      counterLabelJoined: "people are already in",
      successTitle: "You're in!",
      successMsg: "Your spot on the list is reserved. We'll email you as soon as the app is live.",
      errorNetwork: "Network error. Please try again.",
      errorGeneric: "Couldn't save. Please try again.",
      strip: [
        "AI nailed 3\nresults in a row",
        "Fantasy is\naddictive",
        "Creators make\nit more epic",
        "Finally an app that\ngets football",
        "Fantasy is\naddictive",
        "AI nailed 3\nresults in a row",
      ],
    },

    finalCta: {
      title1: "Who will win the",
      titleGold1: "2026 World Cup?",
      title2: "Spoiler: it doesn't matter.",
      title3: "Whoever lives it on",
      titleGold2: "ZonaMundial wins.",
      desc: "Join for free. If you don't like it, we'll give you back the silence.",
      cta: "Sign up free",
      assurance: {
        free: "100% free",
        noCard: "No card",
        noCommitment: "No strings",
      },
    },

    footer: {
      tag: "Predictions, fantasy and engagement in Spanish for the 2026 World Cup.",
      poweredBy: "Powered by",
      columns: {
        torneo: {
          title: "Tournament",
          links: [
            { label: "48 Teams", href: "/selecciones" },
            { label: "12 Groups", href: "/grupos" },
            { label: "16 Venues", href: "/sedes" },
            { label: "Schedule", href: "/calendario" },
            { label: "History", href: "/historia" },
          ],
        },
        plataforma: {
          title: "Platform",
          links: [
            { label: "Predictions", href: "/app/predicciones" },
            { label: "Fantasy", href: "/app/fantasy" },
            { label: "AI Coach", href: "/app/ia-coach" },
            { label: "Trivia", href: "/app/trivia" },
            { label: "Career Mode", href: "/app/modo-carrera" },
            { label: "Premium", href: "/premium" },
          ],
        },
        comunidad: {
          title: "Community",
          links: [
            { label: "News", href: "/noticias" },
            { label: "Blog", href: "/blog" },
            { label: "Tutorials", href: "/tutoriales" },
            { label: "Creators", href: "/creadores" },
            { label: "Private Leagues", href: "/app/ligas" },
            { label: "Rankings", href: "/app/rankings" },
            { label: "Streaming", href: "/app/streaming" },
          ],
        },
        legal: {
          title: "Legal",
          links: [
            { label: "Legal Notice", href: "/legal/aviso-legal" },
            { label: "Terms of Use", href: "/legal/terminos" },
            { label: "Privacy", href: "/legal/privacidad" },
            { label: "Cookies", href: "/legal/cookies" },
            { label: "EULA", href: "/legal/eula" },
            { label: "Contact", href: "mailto:business.dev@sprintmarkt.com" },
          ],
        },
      },
      copyright: "© 2026 Sprintmarkt · Valencia, Spain",
      copyrightParts: {
        prefix: "© 2026 ",
        brand: "Sprintmarkt",
        suffix: " · Valencia, Spain",
      },
      disclaimer: "Free prediction platform. Does not involve monetary betting.",
    },

    socialDock: {
      eyebrow: "FOLLOW",
      a11y: "ZonaMundial social links",
      on: "ZonaMundial on",
    },

    appReveal: {
      pill: "COMING SOON",
      title: "Something big",
      titleGold: "is coming.",
      subtitle:
        "We're crafting the ultimate experience for true football fanatics.",
      notify: {
        title: "Be the first to know.",
        desc: "Download the app the moment it's available.",
      },
      stores: {
        appStoreSoon: "Coming soon to",
        appStoreName: "App Store",
        playStoreSoon: "Coming soon to",
        playStoreName: "Google Play",
      },
      phoneLabel: "Zona Mundial",
      phoneLoading: "Loading / Cargando...",
      features: [
        {
          title: "Be first",
          desc: "Get early access to the best football app.",
        },
        {
          title: "Unique experience",
          desc: "All world football in your hands.",
        },
        {
          title: "Available soon",
          desc: "Coming soon to App Store and Google Play.",
        },
      ],
    },

    /* ============ HeroSection ============ */
    hero: {
      headlines: {
        juega: { l1: "The World Cup", l2: "isn't watched.", l3: "It's played." },
        ia: {
          l1: "Predict. Compete.",
          l2: "Win.",
          l3a: "With",
          em: "AI Coach",
          l3b: "by your side.",
        },
        fantasy: {
          l1: "Build your",
          l2: "dream squad",
          l3: "and challenge the world.",
        },
      },
      sub: {
        before: "Predict in real time, compete in",
        bold1: "private leagues",
        middle: ", build your fantasy team and play with",
        chip: "AI Coach",
        afterChip: "across the",
        bold2: "104 matches",
        end: "of the 2026 World Cup.",
      },
      pillars: {
        matches: { label1: "Live", label2: "matches" },
        ai: { label1: "Personal", label2: "AI Coach" },
        prizes: { label1: "In prizes", label2: "and exclusives" },
      },
      ctaPrimary: "Pre-register for free",
      ctaGhost: "See how it works",
      ctaNote: {
        before: "No card ·",
        bold: "Early access",
        after: "to the Founders Pass",
      },
      proof: {
        boldCount: "8,642 fans",
        afterBold: "are already on the list",
        sub: "~180 join every day",
        avatarAlt: "Creator",
      },
      slider: {
        a11yLabel: "Choose headline",
        labels: { juega: "Play", ia: "AI Coach", fantasy: "Fantasy" },
        play: "Resume slider",
        pause: "Pause slider",
      },
      stats: {
        users: "Active users",
        venues: "Official venues",
        teams: "National teams",
        groups: "Groups",
        purity: "Pure football",
      },
      chips: {
        liveLabel: "Live now",
        prediction: "Your prediction",
        predictionSub: "+47 points · goal min. 23",
        ranking: "League rank",
        coachSuggests: "AI Coach suggests",
        coachSwap: "Switch to Mbappé (+12%)",
      },
      stadiumAlt: "World Cup stadium",
      phoneAlt: "ZonaMundial app screen",
    },

    countdownLabel: "World Cup · USA · Mexico · Canada",
  },
} as const;

export type HomeSections = (typeof homeSections)[SectionLocale];
