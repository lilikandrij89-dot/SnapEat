import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from "firebase/auth";

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err) {
      setError("Ошибка: " + err.message);
    }
  };

  return (
    <div className="relative w-full max-w-[400px] animate-in fade-in zoom-in duration-500 px-4 sm:px-0">
      <div className="relative w-full bg-zinc-900/90 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4 text-orange-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3-3.5 3.5z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
            {sent ? 'Проверь почту' : 'Восстановление'}
            <span className="text-orange-500">.</span>
          </h2>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 text-center">
            {sent 
              ? `Инструкции отправлены на ${email}` 
              : 'Введите ваш Email для сброса пароля'}
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-[10px] mb-4 text-center font-bold uppercase tracking-widest bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {error}
          </p>
        )}

        {!sent ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 p-4 pl-12 rounded-2xl text-white outline-none focus:border-orange-500 transition-all text-base" 
                required
              />
            </div>
            <button type="submit" className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all">
              Сбросить пароль
            </button>
          </form>
        ) : (
          <button onClick={onBack} className="w-full bg-zinc-800 text-white font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest active:scale-95 transition-all">
            Вернуться ко входу
          </button>
        )}

        <button 
          onClick={onBack}
          className="w-full text-zinc-600 text-[10px] font-bold uppercase tracking-widest mt-8 flex items-center justify-center space-x-2 hover:text-white transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Назад</span>
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;