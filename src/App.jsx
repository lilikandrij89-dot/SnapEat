import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Auth from './components/Auth';
import ForgotPassword from './components/ForgotPassword';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Statistics from './components/Statistics'; 
import Profile from './components/Profile';
import Gym from './components/Gym'; // ИМПОРТИРУЕМ НОВЫЙ КОМПОНЕНТ

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('auth');
  const [hasProfile, setHasProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        setHasProfile(docSnap.exists());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const saveProfile = async (profileData) => {
    if (!user) return;
    const weight = Number(profileData.weight);
    const height = Number(profileData.height);
    const age = Number(profileData.age);
    
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = profileData.gender === 'male' ? bmr + 5 : bmr - 161;
    
    let dailyCalories = Math.round(bmr * 1.2);
    if (profileData.goal === 'lose') dailyCalories -= 500;
    if (profileData.goal === 'gain') dailyCalories += 500;

    try {
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        dailyCalories: dailyCalories,
        currentWater: 0,
        waterTarget: 2.5,
        consumedCalories: 0,
        meals: [],
        email: user.email,
        createdAt: new Date().toISOString()
      });
      setHasProfile(true);
      showToast("Профиль успешно создан!");
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[999] animate-in slide-in-from-top duration-500">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-orange-500/50 px-6 py-3 rounded-[20px] shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
          </div>
        </div>
      )}

      {user ? (
        hasProfile ? (
          <>
            <div className="w-full h-full flex justify-center overflow-y-auto">
              {activeTab === 'home' && <Dashboard user={user} />}
              {activeTab === 'gym' && <Gym user={user} showToast={showToast} />} {/* НОВАЯ ВКЛАДКА */}
              {activeTab === 'stats' && <Statistics user={user} />}
              {activeTab === 'profile' && <Profile user={user} showToast={showToast} />}
            </div>

            {/* ОБНОВЛЕННЫЙ NAVBAR (4 КНОПКИ) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-sm bg-zinc-900/90 backdrop-blur-xl border border-white/5 p-2 rounded-[30px] flex justify-around items-center z-50 shadow-2xl">
              
              {/* HOME (Диета) */}
              <button onClick={() => setActiveTab('home')} className={`flex-1 py-3 rounded-[22px] flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? "bg-orange-500 text-black scale-105" : "text-zinc-500"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>
                <span className="text-[7px] font-black uppercase">Диета</span>
              </button>

              {/* GYM (Зал) */}
              <button onClick={() => setActiveTab('gym')} className={`flex-1 py-3 rounded-[22px] flex flex-col items-center gap-1 transition-all ${activeTab === 'gym' ? "bg-blue-500 text-black scale-105" : "text-zinc-500"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 3h12M6 21h12M12 3v18M3 7h3M18 7h3M3 17h3M18 17h3"/></svg>
                <span className="text-[7px] font-black uppercase">Тренировка</span>
              </button>

              {/* STATS (Прогресс) */}
              <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 rounded-[22px] flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? "bg-green-500 text-black scale-105" : "text-zinc-500"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                <span className="text-[7px] font-black uppercase">Отчет</span>
              </button>

              {/* PROFILE */}
              <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 rounded-[22px] flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? "bg-white text-black scale-105" : "text-zinc-500"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span className="text-[7px] font-black uppercase">Инфо</span>
              </button>

            </div>
          </>
        ) : (
          <Onboarding onComplete={saveProfile} />
        )
      ) : (
        <>
          {view === 'auth' ? <Auth onForgotClick={() => setView('forgot')} /> : <ForgotPassword onBack={() => setView('auth')} />}
        </>
      )}
    </div>
  );
}

export default App;