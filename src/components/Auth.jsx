import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from "firebase/auth";

const Auth = ({ onForgotClick }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Функция входа и регистрации
  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("Вход выполнен!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("Аккаунт создан!");
      }
    } catch (err) {
      setError("Ошибка: " + err.message);
    }
  };

  // Вход через Google
  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("Вход через Google выполнен!");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="relative w-full max-w-[400px] animate-in fade-in zoom-in duration-500 px-4 sm:px-0">
      <div className="relative w-full bg-zinc-900/90 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tighter italic uppercase">
            SnapEat<span className="text-orange-500">.</span>
          </h1>
          {error && <p className="text-red-500 text-[10px] mt-2 font-bold uppercase">{error}</p>}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 transition-all"
            required
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 transition-all"
            required
          />
          
          {isLogin && (
            <div className="flex justify-end">
              <button type="button" onClick={onForgotClick} className="text-[10px] font-bold text-zinc-600 uppercase hover:text-orange-500">
                Забыл пароль?
              </button>
            </div>
          )}

          <button type="submit" className="w-full bg-orange-500 text-black font-black py-4 rounded-2xl uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all">
            {isLogin ? 'Вход' : 'Регистрация'}
          </button>
        </form>

        <div className="flex items-center py-6">
          <div className="flex-1 h-px bg-zinc-800"></div>
          <span className="px-4 text-[9px] font-bold text-zinc-700">ИЛИ</span>
          <div className="flex-1 h-px bg-zinc-800"></div>
        </div>

        <button 
          onClick={handleGoogle}
          className="w-full border border-zinc-800 bg-black/20 text-white py-4 rounded-2xl flex items-center justify-center space-x-3 active:scale-95 transition-all text-[11px] font-bold uppercase"
        >
          <span>Войти через Google</span>
        </button>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-bold text-zinc-500 hover:text-orange-500 uppercase"
          >
            {isLogin ? 'Создать аккаунт' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;