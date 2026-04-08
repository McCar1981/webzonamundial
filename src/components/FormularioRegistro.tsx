// src/components/FormularioRegistro.tsx
// Formulario de registro mejorado para ZonaMundial
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getCreadoresActivos } from '@/data/creadores';

export default function FormularioRegistro({ creadorPreseleccionado }: { creadorPreseleccionado?: string }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    creador: creadorPreseleccionado || '',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const creadores = getCreadoresActivos();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.3)' }}>
          🎉
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">¡Bienvenido a ZonaMundial!</h3>
        <p className="text-gray-400 text-sm mb-2">
          Tu registro se ha completado exitosamente.
        </p>
        <p className="text-gray-500 text-xs mb-8">
          Te hemos enviado un email de confirmación a <span className="text-[#C9A84C]">{formData.email}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[#030712] font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)' }}
          >
            Explorar plataforma
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link 
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#1E293B] text-white font-bold text-sm hover:border-[#C9A84C]/50 transition-colors"
          >
            Ir a mi cuenta
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
            style={{ background: step === 1 ? '#030712' : 'transparent' }}>
            1
          </span>
          Tus datos
        </div>
        <div className="w-8 h-0.5 bg-[#1E293B]" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          step === 2 ? 'bg-[#C9A84C] text-[#030712]' : 'bg-[#1E293B] text-gray-500'
        }`}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: step === 2 ? '#030712' : 'transparent' }}>
            2
          </span>
          Elige creador
        </div>
      </div>

      {step === 1 && (
        <>
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Email
            </label>
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-600"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Nombre de usuario
            </label>
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
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0B1825] border border-[#1E293B] text-white text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 transition-all placeholder:text-gray-600"
                placeholder="Tu nombre de usuario"
              />
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 pt-2">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="terms"
                required
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
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
              Acepto los <Link href="/terminos" className="text-[#C9A84C] hover:underline font-medium">términos de uso</Link> y la{' '}
              <Link href="/privacidad" className="text-[#C9A84C] hover:underline font-medium">política de privacidad</Link>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!formData.email || !formData.nombre || !formData.acceptTerms}
            className="w-full py-4 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A84C]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)' }}
          >
            Continuar
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
            onClick={() => setStep(1)}
            className="text-xs text-gray-500 hover:text-[#C9A84C] flex items-center gap-1.5 mb-4 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a tus datos
          </button>

          <p className="text-sm text-gray-300 mb-4">
            Elige el creador cuya comunidad quieres unirte (opcional):
          </p>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1E293B] scrollbar-track-transparent">
            {/* Opción: No elegir ninguno */}
            <label
              className={`flex items-center gap-5 p-5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                formData.creador === ''
                  ? 'border-[#C9A84C] bg-gradient-to-r from-[#C9A84C]/10 to-transparent'
                  : 'border-[#1E293B] hover:border-[#2a3a4f] bg-[#0B1825]/50'
              }`}
            >
              <input
                type="radio"
                name="creador"
                value=""
                checked={formData.creador === ''}
                onChange={(e) => setFormData({ ...formData, creador: e.target.value })}
                className="sr-only"
              />
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#1E293B] flex items-center justify-center bg-[#0B1825]"
                style={{ 
                  boxShadow: formData.creador === '' ? '0 0 20px rgba(201,168,76,0.3)' : 'none',
                  borderColor: formData.creador === '' ? '#C9A84C' : '#1E293B'
                }}>
                <span className="text-2xl">🤔</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-white">No elegir ninguno</div>
                <div className="text-sm text-gray-500">Podrás elegir tu creador favorito más tarde</div>
              </div>
              {formData.creador === '' && (
                <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[#030712]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </label>

            <div className="border-t border-[#1E293B]/50 my-3" />

            {creadores.map((c) => (
              <label
                key={c.slug}
                className={`flex items-center gap-5 p-5 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  formData.creador === c.slug
                    ? 'border-[#C9A84C] bg-gradient-to-r from-[#C9A84C]/10 to-transparent'
                    : 'border-[#1E293B] hover:border-[#2a3a4f] bg-[#0B1825]/50'
                }`}
              >
                <input
                  type="radio"
                  name="creador"
                  value={c.slug}
                  checked={formData.creador === c.slug}
                  onChange={(e) => setFormData({ ...formData, creador: e.target.value })}
                  className="sr-only"
                />
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all"
                  style={{ 
                    borderColor: formData.creador === c.slug ? c.colorPrimario : `${c.colorPrimario}33`,
                    boxShadow: formData.creador === c.slug ? `0 0 20px ${c.colorPrimario}30` : 'none'
                  }}>
                  <img src={c.imagen} alt={c.nombre} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-white truncate">{c.nombre}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <span>{c.seguidores}</span>
                    <span>·</span>
                    <span style={{ color: c.colorPrimario }}>{c.plataformaPrincipal}</span>
                  </div>
                </div>
                {formData.creador === c.slug && (
                  <div className="w-6 h-6 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0 animate-in fade-in zoom-in duration-200">
                    <svg className="w-4 h-4 text-[#030712]" fill="currentColor" viewBox="0 0 20 20">
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
            className="w-full py-4 rounded-xl text-[#030712] font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-[#C9A84C]/25 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-5"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8893D)' }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando tu cuenta...
              </>
            ) : (
              <>
                Completar registro
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
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#C9A84C] hover:underline font-bold transition-colors">
            Iniciar sesión
          </Link>
        </span>
      </div>
    </form>
  );
}
