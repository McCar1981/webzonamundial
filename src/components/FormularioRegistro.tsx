// src/components/FormularioRegistro.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
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

// Normaliza un código de captación a MAYÚSCULAS y solo [A-Z0-9-]. Debe
// coincidir con normalizeSignupCode() del backend (lib/signup-codes/store.ts).
function normCode(raw: string): string {
  return (raw || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 32);
}

export default function FormularioRegistro({
  creadorPreseleccionado,
  // Código de captación (estrategia paralela a los creadores). Si viene
  // `codigoPreseleccionado` (landing /registro-codigo/<CODIGO>) el campo va
  // bloqueado y prerelleno. Si `pedirCodigo` es true (página /registro-codigo
  // genérica) se muestra un campo editable opcional. Si ninguno, el formulario
  // se comporta EXACTAMENTE como hasta ahora (registro normal / por creador).
  codigoPreseleccionado,
  pedirCodigo,
}: {
  creadorPreseleccionado?: string;
  codigoPreseleccionado?: string;
  pedirCodigo?: boolean;
}) {
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
    signupCode: normCode(codigoPreseleccionado || ''), // código de captación
    acceptTerms: false,
  });

  // Flujo de CÓDIGO: aquí NO se elige creador. Se salta el paso 2 (selector
  // de creador) y se envía directo desde el paso 1.
  const isCodeFlow = !!(pedirCodigo || codigoPreseleccionado);

  // Feedback de validez del código (para enseñar el bono de bienvenida antes
  // de registrarse). null = sin comprobar todavía.
  const [codeInfo, setCodeInfo] = useState<
    { valid: boolean; reward: number; label: string | null } | null
  >(null);

  // Valida el código contra el backend. Devuelve true SOLO si es un código
  // reconocido y activo. Además guarda el resultado para el feedback visual.
  const checkCode = async (raw: string): Promise<boolean> => {
    const c = normCode(raw);
    if (c.length < 3) { setCodeInfo(null); return false; }
    try {
      const r = await fetch(`/api/registro-codigo/validar?code=${encodeURIComponent(c)}`);
      if (!r.ok) { setCodeInfo(null); return false; }
      const d = (await r.json()) as { valid?: boolean; rewardNewUser?: number; label?: string | null };
      const valid = !!d.valid;
      setCodeInfo({ valid, reward: d.rewardNewUser || 0, label: d.label ?? null });
      return valid;
    } catch {
      setCodeInfo(null);
      return false;
    }
  };

  // En la vía /registro-codigo el código es OBLIGATORIO y debe ser VÁLIDO
  // (reconocido y activo). Hace una validación fresca y, si falla, muestra el
  // error y devuelve false para bloquear el registro (email y OAuth).
  const ensureValidCode = async (): Promise<boolean> => {
    if (!isCodeFlow) return true;
    const c = normCode(formData.signupCode);
    if (!c) {
      setError(isEN ? 'Enter your invite code to sign up here.' : 'Introduce tu código de invitación para registrarte aquí.');
      return false;
    }
    const ok = await checkCode(c);
    if (!ok) {
      setError(isEN ? 'That code is not valid or not active.' : 'Ese código no es válido o no está activo.');
    }
    return ok;
  };

  // Si el código viene prerelleno (landing), lo validamos al montar.
  useEffect(() => {
    if (codigoPreseleccionado) void checkCode(normCode(codigoPreseleccionado));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // OAuth (Google/Apple): registro en 1 clic. Estado separado del submit
  // por email para que cada botón muestre su propio spinner.
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
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
    oauthFast: 'Sign up in 1 tap',
    oauthGoogle: 'Continue with Google',
    oauthApple: 'Continue with Apple',
    oauthDivider: 'or sign up with your email',
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
    oauthFast: 'Regístrate en 1 clic',
    oauthGoogle: 'Continuar con Google',
    oauthApple: 'Continuar con Apple',
    oauthDivider: 'o regístrate con tu email',
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

  // Registro/login en 1 clic con Google o Apple. Es el camino MÁS rápido:
  // sin teclear nada ni esperar un correo. Supabase crea la cuenta en el
  // primer login y el callback manda al usuario nuevo a /onboarding, donde
  // completa username + país + selección + creador. Por eso aquí no
  // exigimos esos campos: no se pierden, solo se piden después de entrar.
  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError('');
    // En la vía de código, exigir un código válido antes de iniciar el OAuth.
    if (!(await ensureValidCode())) return;
    setOauthLoading(provider);
    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setError(isEN
        ? 'Sign-up service unavailable. Try again in a minute.'
        : 'Servicio de registro no disponible. Inténtalo en un minuto.');
      setOauthLoading(null);
      return;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    // Si el usuario venía de un creador o de un código de captación, lo
    // arrastramos al onboarding (creador) y al callback (código) tras el
    // OAuth. El código se canjea en /auth/callback leyendo el param `codigo`.
    const codeForUrl = normCode(formData.signupCode || codigoPreseleccionado || '');
    const params = new URLSearchParams();
    if (creadorPreseleccionado) params.set('creador', creadorPreseleccionado);
    if (codeForUrl) params.set('codigo', codeForUrl);
    const qs = params.toString();
    const next = qs ? `/onboarding?${qs}` : '/onboarding';
    const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl,
        scopes: provider === 'apple' ? 'name email' : undefined,
        queryParams:
          provider === 'google'
            ? { access_type: 'offline', prompt: 'consent' }
            : undefined,
      },
    });

    if (error) {
      setOauthLoading(null);
      const m = error.message || '';
      let human = m;
      if (/provider is not enabled/i.test(m)) {
        human = isEN
          ? `${provider === 'apple' ? 'Apple' : 'Google'} sign-in isn't enabled yet. Use your email below for now.`
          : `El acceso con ${provider === 'apple' ? 'Apple' : 'Google'} no está activado todavía. Usa tu email abajo de momento.`;
      } else if (/redirect_uri/i.test(m)) {
        human = isEN
          ? 'The return URL is not authorized yet. Try again in a few minutes or use your email.'
          : 'La URL de retorno no está autorizada todavía. Reintenta en unos minutos o usa tu email.';
      }
      setError(human);
      console.error(`[registro/oauth/${provider}]`, m);
    }
    // En éxito el navegador se redirige al proveedor; no corre más código.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // En el flujo de código se envía desde el paso 1 (no hay paso 2): validamos
    // los campos del paso 1 y EXIGIMOS un código válido (obligatorio).
    if (isCodeFlow) {
      if (!validateStep1()) return;
      if (!(await ensureValidCode())) return;
    }
    setLoading(true);
    setError('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanFirstName = formData.firstName.trim().replace(/\s+/g, ' ');
    const cleanLastName = formData.lastName.trim().replace(/\s+/g, ' ');
    const cleanFullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const cleanNombre = formData.nombre.trim();
    const cleanCreador = formData.creador?.trim() || '';
    // Código de captación normalizado (vacío si no hay).
    const cleanCode = normCode(formData.signupCode || '');
    // Country: ISO-3166 alpha-2 lowercase (ar, es, mx…). null si vacío.
    const cleanCountry = formData.country?.trim().toLowerCase() || null;
    // Fav team: slug de SELECCIONES (argentina, espana…). null si vacío.
    const cleanFavTeam = formData.fav_team?.trim().toLowerCase() || null;

    // 0) Pre-check: si el email ya está registrado, redirigimos a /login.
    //    Sin esto, signInWithOtp con shouldCreateUser:true envía un magic
    //    link "vacío" (sin actualizar metadata) y el usuario se confunde
    //    porque ve un correo distinto al que esperaba ("¿no me registró?").
    try {
      const checkResp = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (checkResp.ok) {
        const checkData = (await checkResp.json()) as {
          exists?: boolean;
          provider?: string;
        };
        if (checkData.exists) {
          const providerLabel =
            checkData.provider === 'google'
              ? ' Google'
              : checkData.provider === 'apple'
                ? ' Apple'
                : '';
          setError(
            isEN
              ? `This email is already registered${providerLabel ? ' with' + providerLabel : ''}. Go to login instead.`
              : `Este email ya está registrado${providerLabel ? ' con' + providerLabel : ''}. Inicia sesión en su lugar.`,
          );
          setLoading(false);
          // Redirige a /login tras 2.5s para que el usuario lea el mensaje.
          setTimeout(() => {
            const next = `/login?email=${encodeURIComponent(cleanEmail)}`;
            window.location.href = next;
          }, 2500);
          return;
        }
      }
      // Si el endpoint devuelve 429 (rate limit) o falla, seguimos
      // adelante — el flujo de Supabase manejará el caso igual.
    } catch {
      // Network error en el check: no bloqueamos al usuario, seguimos.
    }

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
          signup_code: cleanCode,
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
            signup_code: cleanCode,
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
        <p className="text-gray-500 text-xs mb-6">
          {labels.successEmail} <span className="text-[#C9A84C]">{formData.email}</span>
        </p>

        {/* Aviso spam — el dominio está en warmup, varios providers
            (Hotmail/Outlook sobre todo) pueden clasificar los emails de
            ZonaMundial como spam los primeros 100-300 envíos. Dejamos
            instrucciones claras para que el usuario los recupere. */}
        <div className="max-w-md mx-auto mb-8 p-4 rounded-xl border text-left"
          style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.3)' }}>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#C9A84C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs leading-relaxed">
              <p className="font-bold text-[#C9A84C] mb-1">
                {isEN ? 'Not in your inbox? Check SPAM' : '¿No lo ves en la bandeja? Revisa SPAM'}
              </p>
              <p className="text-gray-300">
                {isEN
                  ? 'As we\'re a new domain, some email providers (especially Hotmail and Outlook) may temporarily classify our messages as spam. If you find it there, please mark it as '
                  : 'Como somos un dominio nuevo, algunos proveedores (sobre todo Hotmail y Outlook) pueden marcar nuestros mensajes como spam temporalmente. Si lo encuentras ahí, márcalo como '}
                <strong className="text-white">
                  {isEN ? '"Not spam"' : '"No es spam"'}
                </strong>
                {isEN
                  ? ' so future emails arrive correctly. The sender is '
                  : ' para que los próximos lleguen bien. El remitente es '}
                <strong className="text-[#C9A84C]">noreply@zonamundial.app</strong>.
              </p>
            </div>
          </div>
        </div>

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
      {/* Progress Steps — solo en el registro normal/por creador (2 pasos).
          En el flujo de código no hay paso 2 (no se elige creador). */}
      {!isCodeFlow && (
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
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {step === 1 && (
        <>
          {/* Código de captación — solo en el flujo /registro-codigo. En el
              registro normal/por creador no se muestra (props sin definir). */}
          {(pedirCodigo || codigoPreseleccionado) && (
            <div className="space-y-2 mb-2">
              <label htmlFor="reg-code" className="block text-xs font-bold text-[#C9A84C] uppercase tracking-wider">
                {isEN ? 'Invite code (required)' : 'Código de invitación (obligatorio)'}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C9A84C]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5h14a2 2 0 012 2v3a2 2 0 100 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 100-4V7a2 2 0 012-2z" />
                  </svg>
                </div>
                <input
                  id="reg-code"
                  type="text"
                  value={formData.signupCode}
                  readOnly={!!codigoPreseleccionado}
                  onChange={(e) => {
                    setFormData({ ...formData, signupCode: normCode(e.target.value) });
                    setCodeInfo(null);
                    setError('');
                  }}
                  onBlur={(e) => { void checkCode(e.target.value); }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-[#C9A84C]/40 text-gray-900 text-sm font-bold tracking-wider uppercase focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal read-only:bg-[#C9A84C]/5"
                  placeholder={isEN ? 'YOUR CODE' : 'TU CÓDIGO'}
                  maxLength={32}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </div>
              {codeInfo && codeInfo.valid ? (
                <p className="text-[11px] font-bold text-emerald-400">
                  {isEN
                    ? `Valid code${codeInfo.label ? ` (${codeInfo.label})` : ''} — ${codeInfo.reward} Fútcoins welcome bonus`
                    : `Código válido${codeInfo.label ? ` (${codeInfo.label})` : ''} — bono de bienvenida de ${codeInfo.reward} Fútcoins`}
                </p>
              ) : codeInfo && !codeInfo.valid && formData.signupCode.length >= 3 ? (
                <p className="text-[11px] font-bold text-red-400">
                  {isEN
                    ? 'That code is not valid or not active.'
                    : 'Ese código no es válido o no está activo.'}
                </p>
              ) : (
                <p className="text-[11px] text-[#C9A84C]/80">
                  {isEN
                    ? 'A valid code is required to sign up here.'
                    : 'Necesitas un código válido para registrarte aquí.'}
                </p>
              )}
            </div>
          )}

          {/* Registro en 1 clic — el camino más rápido. Google + Apple. */}
          <div className="space-y-3">
            <p className="text-center text-xs font-bold text-[#C9A84C] uppercase tracking-wider">
              {labels.oauthFast}
            </p>
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={oauthLoading !== null || loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-gray-800 text-sm font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {oauthLoading === 'google' ? (
                <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {labels.oauthGoogle}
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('apple')}
              disabled={oauthLoading !== null || loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {oauthLoading === 'apple' ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              {labels.oauthApple}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1E293B]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#0F1D32] text-gray-500 uppercase tracking-wider">
                {labels.oauthDivider}
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="reg-email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.email}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                id="reg-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setError(''); }}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-[#1E293B] text-gray-900 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-500"
                placeholder={labels.emailPlaceholder}
              />
            </div>
          </div>

          {/* Nombre + Apellido en grid 2 col en desktop, 1 col en mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="reg-first-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.firstName}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="reg-first-name"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); setError(''); }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-[#1E293B] text-gray-900 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-500"
                  placeholder={labels.firstNamePlaceholder}
                  maxLength={50}
                  autoComplete="given-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="reg-last-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.lastName}</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="reg-last-name"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => { setFormData({ ...formData, lastName: e.target.value }); setError(''); }}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-[#1E293B] text-gray-900 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-500"
                  placeholder={labels.lastNamePlaceholder}
                  maxLength={50}
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

          {/* Username público */}
          <div className="space-y-2">
            <label htmlFor="reg-username" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.username}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                id="reg-username"
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => { setFormData({ ...formData, nombre: e.target.value.replace(/\s/g, '') }); setError(''); }}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white border border-[#1E293B] text-gray-900 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-500"
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
            // Flujo de código: este botón ENVÍA (no hay paso 2). Registro
            // normal/por creador: continúa al paso 2 (elegir creador).
            type={isCodeFlow ? 'submit' : 'button'}
            onClick={isCodeFlow ? undefined : handleContinue}
            disabled={
              (isCodeFlow && loading) ||
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
            {isCodeFlow ? (
              loading ? (
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
              )
            ) : (
              <>
                {labels.continue}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
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
