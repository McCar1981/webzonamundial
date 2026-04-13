// src/components/FormularioRegistro.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getCreadoresActivos } from '@/data/creadores';
import { useLanguage } from '@/i18n/LanguageContext';

export default function FormularioRegistro({ creadorPreseleccionado }: { creadorPreseleccionado?: string }) {
  const { t } = useLanguage();
  const isEN = t.nav.selecciones === '48 Teams';

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    creador: creadorPreseleccionado || '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const creadores = getCreadoresActivos();

  const labels = isEN ? {
    step1: 'Your info',
    step2: 'Choose creator',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    username: 'Username',
    usernamePlaceholder: 'Your username',
    usernameHint: '3-30 characters, no spaces',
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
    submitting: 'Creating your account...',
    successTitle: 'Welcome to ZonaMundial!',
    successDesc: 'Your registration was completed successfully.',
    successEmail: 'We sent a confirmation email to',
    explore: 'Explore platform',
    login: 'Go to my account',
    alreadyAccount: 'Already have an account?',
    loginLink: 'Log in',
    followers: 'followers',
  } : {
    step1: 'Tus datos',
    step2: 'Elige creador',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    username: 'Nombre de usuario',
    usernamePlaceholder: 'Tu nombre de usuario',
    usernameHint: '3-30 caracteres, sin espacios',
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
    submitting: 'Creando tu cuenta...',
    successTitle: '¡Bienvenido a ZonaMundial!',
    successDesc: 'Tu registro se ha completado exitosamente.',
    successEmail: 'Te hemos enviado un email de confirmación a',
    explore: 'Explorar plataforma',
    login: 'Ir a mi cuenta',
    alreadyAccount: '¿Ya tienes cuenta?',
    loginLink: 'Iniciar sesión',
    followers: 'seguidores',
  };

  const validateStep1 = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError(isEN ? 'Please enter a valid email' : 'Introduce un email válido');
      return false;
    }
    if (formData.nombre.length < 3 || formData.nombre.length > 30) {
      setError(isEN ? 'Username must be 3-30 characters' : 'El nombre debe tener entre 3 y 30 caracteres');
      return false;
    }
    if (/\s/.test(formData.nombre)) {
      setError(isEN ? 'Username cannot contain spaces' : 'El nombre no puede contener espacios');
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

    try {
      const res = await fetch('/api/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          creador: formData.creador,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isEN ? 'Registration error' : 'Error en el registro'));
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError(isEN ? 'Connection error. Please try again.' : 'Error de conexión. Inténtalo de nuevo.');
    }
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

          {/* Username */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">{labels.username}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
              />
            </div>
            <p className="text-[11px] text-gray-600">{labels.usernameHint}</p>
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
            disabled={!formData.email || !formData.nombre || !formData.acceptTerms}
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
