// src/components/FormularioRegistro.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getCreadoresActivos } from '@/data/creadores';
import { SELECCIONES } from '@/data/selecciones';
import { COUNTRIES } from '@/lib/countries';
import { useLanguage } from '@/i18n/LanguageContext';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import FlagSelect, { type FlagSelectOption } from '@/components/FlagSelect';

// País y selección favorita son datos críticos para producto:
//   - country alimenta segmentación geográfica (push, idioma, husos horarios)
//   - fav_team activa notificaciones push exclusivas de esa selección
//     en la app móvil cuando el equipo de la app los consuma vía
//     /api/users/me/profile.
// Por eso los pedimos en el pre-registro web, antes incluso del magic link,
// para no perderlos si el usuario nunca completa onboarding.

export default function FormularioRegistro({ creadorPreseleccionado }: { creadorPreseleccionado?: string }) {
  const { t } = useLanguage();
  const isEN = t.nav.selecciones === '48 Teams';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',    // Nombre real, e.g. "Juan Carlos"
    lastName: '',     // Apellido(s), e.g. "Pérez García"
    nombre: '',       // Username público (alias), e.g. "juancho21"
    country: '',      // ISO-3166 alpha-2 (ar, es, mx, …)
    fav_team: '',     // slug de SELECCIONES (argentina, espana, …)
    creador: creadorPreseleccionado || '',
    acceptTerms: false,
  });

  // Listas precomputadas para los selectores con bandera.
  // Las banderas se sirven desde flagcdn.com (CC0). Los slugs de
  // SELECCIONES usan flagCode con códigos especiales para Inglaterra/
  // Escocia (gb-eng, gb-sct).
  const countryOptions = useMemo<FlagSelectOption[]>(
    () =>
      COUNTRIES.map((c) => ({
        value: c.code,
        label: c.name,
        flagCode: c.code,
      })),
    [],
  );

  const teamOptions = useMemo<FlagSelectOption[]>(() => {
    return [...SELECCIONES]
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map((s) => ({
        value: s.slug,
        label: s.nombre,
        sublabel: s.grupo ? `Grupo ${s.grupo}` : undefined,
        flagCode: s.flagCode || s.slug,
      }));
  }, []);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const creadores = getCreadoresActivos();

  const labels = isEN ? {
    step1: 'Your info',
    step2: 'Choose creator',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    firstName: 'First name',
    firstNamePlaceholder: 'Your first name',
    firstNameHint: 'As shown on official documents',
    lastName: 'Last name',
    lastNamePlaceholder: 'Your last name',
    lastNameHint: 'One or two last names',
    username: 'Username',
    usernamePlaceholder: 'Your username',
    usernameHint: '3-30 characters, no spaces',
    country: 'Country',
    countryPlaceholder: 'Pick your country',
    countryHint: 'For language and time zone',
    favTeam: 'Your favorite team',
    favTeamPlaceholder: 'Pick the team you support',
    favTeamHint: 'You\'ll get exclusive push notifications about this team in the app',
    terms: 'I accept the',
    termsLink: 'terms of use',
    and: 'and the',
    privacyLink: 'privacy policy',
    continue: 'Continue',
    back: 'Back to your info',
    chooseCreator: 'Choose the creator whose community you want to join (optional):',
    noCreator: 'Skip for now',
    noCreatorDesc: 'You can choose your favorite creator later',
    submit: 'Complete registration',
    submitting: 'Sending sign-in link...',
    successTitle: 'Check your email',
    successDesc: 'We sent you a sign-in link. Click it to confirm your account and finish setup.',
    successEmail: 'Sent to',
    explore: 'Back to home',
    login: 'Go to my account',
    alreadyAccount: 'Already have an account?',
    loginLink: 'Log in',
    followers: 'followers',
  } : {
    step1: 'Tus datos',
    step2: 'Elige creador',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    firstName: 'Nombre',
    firstNamePlaceholder: 'Tu nombre',
    firstNameHint: 'Tal como figura en documentos oficiales',
    lastName: 'Apellido',
    lastNamePlaceholder: 'Tu apellido',
    lastNameHint: 'Uno o dos apellidos',
    username: 'Nombre de usuario',
    usernamePlaceholder: 'Tu nombre de usuario',
    usernameHint: '3-30 caracteres, sin espacios',
    country: 'País',
    countryPlaceholder: 'Elige tu país',
    countryHint: 'Para idioma y zona horaria',
    favTeam: 'Tu selección favorita',
    favTeamPlaceholder: 'Elige la selección que apoyas',
    favTeamHint: 'Recibirás notificaciones push exclusivas de esta selección en la app',
    terms: 'Acepto los',
    termsLink: 'términos de uso',
    and: 'y la',
    privacyLink: 'política de privacidad',
    continue: 'Continuar',
    back: 'Volver a tus datos',
    chooseCreator: 'Elige el creador cuya comunidad quieres unirte (opcional):',
    noCreator: 'No elegir ninguno',
    noCreatorDesc: 'Podrás elegir tu creador favorito más tarde',
    submit: 'Completar registro',
    submitting: 'Enviando enlace…',
    successTitle: 'Revisa tu email',
    successDesc: 'Te enviamos un enlace de acceso. Haz clic para confirmar tu cuenta y terminar de configurarla.',
    successEmail: 'Enviado a',
    explore: 'Volver al inicio',
    login: 'Ir a mi cuenta',
    alreadyAccount: '¿Ya tienes cuenta?',
    loginLink: 'Iniciar sesión',
    followers: 'seguidores',
  };

  const validateStep1 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Nombre/apellido: letras (incl. acentos, ñ), espacios, apóstrofes, guiones.
    const nameRegex = /^[\p{L}][\p{L}\s'\-.]{1,49}$/u;

    if (!emailRegex.test(formData.email)) {
      setError(isEN ? 'Please enter a valid email' : 'Introduce un email válido');
      return false;
    }
    if (formData.firstName.trim().length < 2) {
      setError(isEN ? 'First name must be at least 2 characters' : 'El nombre debe tener al menos 2 caracteres');
      return false;
    }
    if (!nameRegex.test(formData.firstName.trim())) {
      setError(isEN ? 'First name has invalid characters' : 'El nombre contiene caracteres no válidos');
      return false;
    }
    if (formData.lastName.trim().length < 2) {
      setError(isEN ? 'Last name must be at least 2 characters' : 'El apellido debe tener al menos 2 caracteres');
      return false;
    }
    if (!nameRegex.test(formData.lastName.trim())) {
      setError(isEN ? 'Last name has invalid characters' : 'El apellido contiene caracteres no válidos');
      return false;
    }
    if (formData.nombre.length < 3 || formData.nombre.length > 30) {
      setError(isEN ? 'Username must be 3-30 characters' : 'El usuario debe tener entre 3 y 30 caracteres');
      return false;
    }
    if (/\s/.test(formData.nombre)) {
      setError(isEN ? 'Username cannot contain spaces' : 'El usuario no puede contener espacios');
      return false;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(formData.nombre)) {
      setError(isEN ? 'Username can only contain letters, numbers, dots, dashes and underscores' : 'El usuario solo puede tener letras, números, puntos, guiones y guiones bajos');
      return false;
    }
    if (!formData.country) {
      setError(isEN ? 'Please choose your country' : 'Elige tu país');
      return false;
    }
    if (!formData.fav_team) {
      setError(isEN ? 'Please pick your favorite team' : 'Elige tu selección favorita');
      return false;
    }
    if (!formData.acceptTerms) {
      setError(isEN ? 'You must accept the terms' : 'Debes aceptar los términos');
      return false;
    }
    setError('');
    return true;
  };

  const handleContinue = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanFirstName = formData.firstName.trim().replace(/\s+/g, ' ');
    const cleanLastName = formData.lastName.trim().replace(/\s+/g, ' ');
    const cleanFullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const cleanNombre = formData.nombre.trim();
    const cleanCreador = formData.creador?.trim() || '';
    // Country: ISO-3166 alpha-2 lowercase (ar, es, mx…). null si vacío.
    const cleanCountry = formData.country?.trim().toLowerCase() || null;
    // Fav team: slug de SELECCIONES (argentina, espana…). null si vacío.
    const cleanFavTeam = formData.fav_team?.trim().toLowerCase() || null;

    // 1) Snapshot a Vercel KV (waitlist) — mantiene el CSV de leads.
    //    No bloquea: si falla, seguimos con el magic link.
    try {
      await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          nombre: cleanNombre,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          full_name: cleanFullName,
          creador: cleanCreador,
          country: cleanCountry,
          fav_team: cleanFavTeam,
        }),
      });
    } catch {
      // Logged on server. No bloqueamos al usuario.
    }

    // 2) Crea cuenta real Supabase con magic link.
    //    Pasamos username + creador en raw_user_meta_data → el trigger
    //    handle_new_user los lee y los inyecta en profiles al crear el
    //    user. Así el usuario llega al onboarding con nombre y creador
    //    ya seleccionado.
    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setError(isEN
        ? 'Sign-up service unavailable. Try again in a minute.'
        : 'Servicio de registro no disponible. Inténtalo en un minuto.');
      setLoading(false);
      return;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent('/onboarding')}`;

    let signUpError: { message: string } | null = null;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: callbackUrl,
          shouldCreateUser: true,
          // raw_user_meta_data → el trigger handle_new_user en SQL lee
          // estos campos y los copia a public.profiles en el INSERT.
          // Así los datos del pre-registro se conservan aunque el user
          // nunca complete el wizard de onboarding posterior.
          data: {
            // Supabase usa `display_name` / `full_name` para mostrar en la
            // tabla de Users del dashboard y en OAuth provider info.
            display_name: cleanFullName,
            full_name: cleanFullName,
            name: cleanFullName,
            first_name: cleanFirstName,
            last_name: cleanLastName,
            username: cleanNombre,
            fav_creator: cleanCreador,
            country: cleanCountry,
            fav_team: cleanFavTeam,
            locale: isEN ? 'en' : 'es',
          },
        },
      });
      signUpError = error;
    } catch (networkErr) {
      // signInWithOtp lanza (no devuelve error en .error) cuando hay un
      // problema de red puro, p.ej. Supabase pausado, CORS, DNS, etc.
      // El mensaje raw "Failed to fetch" es opaco para el usuario;
      // lo traducimos a algo accionable.
      const raw = networkErr instanceof Error ? networkErr.message : '';
      console.error('[registro] signInWithOtp threw:', raw);
      setError(isEN
        ? 'We could not reach the sign-in service. Check your connection or try again in a minute. If this persists, write to gol@zonamundial.app.'
        : 'No pudimos contactar con el servicio de registro. Revisa tu conexión o inténtalo en un minuto. Si persiste, escríbenos a gol@zonamundial.app.');
      setLoading(false);
      return;
    }

    if (signUpError) {
      // Errores funcionales que vuelven en .error (provider deshabilitado,
      // email mal formateado server-side, rate limit…). El mensaje raw
      // de Supabase suele ser útil aquí, lo dejamos pero humanizamos los
      // típicos.
      const m = signUpError.message || '';
      let human = m;
      if (/over_email_send_rate_limit|rate.?limit/i.test(m)) {
        human = isEN
          ? 'Too many sign-up attempts. Wait a minute and try again.'
          : 'Demasiados intentos de registro. Espera un minuto y vuelve a intentarlo.';
      } else if (/signups not allowed|disable_signup/i.test(m)) {
        human = isEN
          ? 'New sign-ups are temporarily paused. Try again later or contact gol@zonamundial.app.'
          : 'Los nuevos registros están pausados temporalmente. Inténtalo más tarde o escríbenos a gol@zonamundial.app.';
      }
      setError(human);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="#22c55e"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">{labels.successTitle}</h3>
        <p className="text-gray-400 text-sm mb-2">{labels.successDesc}</p>
        <p className="text-gray-500 text-xs mb-8">
          {labels.successEmail} <span className="text-[#C9A84C]">{formData.email}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[#030712] font-bold text-sm no-underline"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)' }}
          >
            {labels.explore}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          step === 1 ? 'bg-[#C9A84C] text-[#030712]' : 'bg-[#C9A84C]/20 text-[#C9A84C]'
        }`}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: step === 1 ? '#030712' : 'transparent' }}>1</span>
          {labels.step1}
        </div>
        <div className="w-8 h-0.5 bg-[#1E293B]" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          step === 2 ? 'bg-[#C9A84C] text-[#030712]' : 'bg-[#1E293B] text-gray-500'
        }`}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: step === 2 ? '#030712' : 'transparent' }}>2</span>
          {labels.step2}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {step === 1 && (
        <>
          {/* Email */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.email}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(''); }}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-600"
                placeholder={labels.emailPlaceholder}
              />
            </div>
          </div>

          {/* Nombre + Apellido en grid 2 col en desktop, 1 col en mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.firstName}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); setError(''); }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-600"
                  placeholder={labels.firstNamePlaceholder}
                  maxLength={50}
                  autoComplete="given-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.lastName}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); setError(''); }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-600"
                  placeholder={labels.lastNamePlaceholder}
                  maxLength={50}
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Username público */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.username}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => { setFormData({ ...formData, nombre: e.target.value.replace(/\s/g, '') }); setError(''); }}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-600"
                placeholder={labels.usernamePlaceholder}
                maxLength={30}
                autoComplete="username"
              />
            </div>
            <p className="text-[11px] text-gray-600">{labels.usernameHint}</p>
          </div>

          {/* País — obligatorio */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              {labels.country}
            </label>
            <FlagSelect
              value={formData.country}
              onChange={(v) => { setFormData({ ...formData, country: v }); setError(''); }}
              options={countryOptions}
              placeholder={labels.countryPlaceholder}
              searchPlaceholder={isEN ? 'Type to search…' : 'Escribe para buscar…'}
              emptyMessage={isEN ? 'No countries found' : 'Sin coincidencias'}
              ariaLabel={labels.country}
              iconLeftSlot={(
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            />
            <p className="text-[11px] text-gray-600">{labels.countryHint}</p>
          </div>

          {/* Selección favorita — obligatorio */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              {labels.favTeam}
            </label>
            <FlagSelect
              value={formData.fav_team}
              onChange={(v) => { setFormData({ ...formData, fav_team: v }); setError(''); }}
              options={teamOptions}
              placeholder={labels.favTeamPlaceholder}
              searchPlaceholder={isEN ? 'Type to search…' : 'Escribe para buscar…'}
              emptyMessage={isEN ? 'No teams found' : 'Sin coincidencias'}
              ariaLabel={labels.favTeam}
              iconLeftSlot={(
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21zM12 7v5l3 3" />
                </svg>
              )}
            />
            <p className="text-[11px] text-[#C9A84C]/80">
              <span aria-hidden="true">⭐ </span>
              {labels.favTeamHint}
            </p>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 pt-2">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="terms"
                required
                checked={formData.acceptTerms}
                onChange={(e) => { setFormData({ ...formData, acceptTerms: e.target.checked }); setError(''); }}
                className="peer sr-only"
              />
              <label
                htmlFor="terms"
                className="w-5 h-5 rounded border border-[#1E293B] bg-[#0B1825] cursor-pointer flex items-center justify-center transition-all peer-checked:bg-[#C9A84C] peer-checked:border-[#C9A84C]"
              >
                <svg className="w-3.5 h-3.5 text-[#030712] opacity-0 peer-checked:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </label>
            </div>
            <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
              {labels.terms} <Link href="/legal/terminos" className="text-[#C9A84C] hover:underline font-medium">{labels.termsLink}</Link> {labels.and}{' '}
              <Link href="/legal/privacidad" className="text-[#C9A84C] hover:underline font-medium">{labels.privacyLink}</Link>
            </label>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            disabled={
              !formData.email ||
              !formData.firstName.trim() ||
              !formData.lastName.trim() ||
              !formData.nombre ||
              !formData.country ||
              !formData.fav_team ||
              !formData.acceptTerms
            }
            className="w-full py-4 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A84C]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)' }}
          >
            {labels.continue}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <button
            type="button"
            onClick={() => { setStep(1); setError(''); }}
            className="text-xs text-gray-500 hover:text-[#C9A84C] flex items-center gap-1.5 mb-4 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {labels.back}
          </button>

          <p className="text-sm text-gray-300 mb-4">{labels.chooseCreator}</p>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {/* No creator option */}
            <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
              formData.creador === '' ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#1E293B] hover:border-[#2a3a4f] bg-[#0B1825]/50'
            }`}>
              <input type="radio" name="creador" value="" checked={formData.creador === ''}
                onChange={(e) => setFormData({ ...formData, creador: e.target.value })} className="sr-only" />
              <div className="w-11 h-11 rounded-xl flex-shrink-0 border border-[#1E293B] flex items-center justify-center bg-[#0B1825]"
                style={{ borderColor: formData.creador === '' ? '#C9A84C' : '#1E293B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#6a7a9a"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-4h2v2h-2v-2zm0-2h2V7h-2v7z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{labels.noCreator}</p>
                <p className="text-xs text-gray-500">{labels.noCreatorDesc}</p>
              </div>
              {formData.creador === '' && (
                <div className="w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#030712]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>

            <div className="border-t border-[#1E293B]/50 my-2" />

            {creadores.map((c) => (
              <label key={c.slug} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                formData.creador === c.slug ? 'border-[#C9A84C] bg-[#C9A84C]/5' : 'border-[#1E293B] hover:border-[#2a3a4f] bg-[#0B1825]/50'
              }`}>
                <input type="radio" name="creador" value={c.slug}
                  checked={formData.creador === c.slug}
                  onChange={(e) => setFormData({ ...formData, creador: e.target.value })} className="sr-only" />
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all"
                  style={{ borderColor: formData.creador === c.slug ? c.colorPrimario : `${c.colorPrimario}33` }}>
                  <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.seguidores} {labels.followers} · <span style={{ color: c.colorPrimario }}>{c.plataformaPrincipal}</span></p>
                </div>
                {formData.creador === c.slug && (
                  <div className="w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-[#030712]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A84C]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {labels.submitting}
              </>
            ) : (
              <>
                {labels.submit}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </>
      )}

      {/* Login link */}
      <div className="text-center pt-4 border-t border-[#1E293B]/50">
        <span className="text-xs text-gray-500">
          {labels.alreadyAccount}{' '}
          <Link href="/login" className="text-[#C9A84C] hover:underline font-bold transition-colors">
            {labels.loginLink}
          </Link>
        </span>
      </div>
    </form>
  );
}
