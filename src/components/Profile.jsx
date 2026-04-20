import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const Profile = ({ user, showToast }) => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(null); 
  // Объект для хранения временных изменений до нажатия "Confirm"
  const [draftValues, setDraftValues] = useState({});
  const [isGoalEditing, setIsGoalEditing] = useState(false);
  const [manualCal, setManualCal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const todayId = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        if (!isTyping) {
          setManualCal(data.dailyCalories?.toString() || '');
        }
      }
    });
    return () => unsub();
  }, [user, isTyping]);

  // ФУНКЦИЯ СОХРАНЕНИЯ (Вызывается по кнопке внизу)
  const handleFinalSave = async () => {
    if (Object.keys(draftValues).length === 0) {
      setEditMode(null);
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      
      // Отправляем все накопленные изменения из черновика
      await setDoc(userRef, draftValues, { merge: true });
      
      // Если меняли вес, синхронизируем с графиком дня
      if (draftValues.weight) {
        await setDoc(doc(db, "users", user.uid, "days", todayId), { 
          weight: Number(draftValues.weight) 
        }, { merge: true });
      }

      showToast("Данные успешно синхронизированы");
      setDraftValues({}); // Очищаем черновик
      setEditMode(null);
    } catch (e) { 
      console.error(e);
      showToast("Ошибка терминала");
    }
  };

  const setStrategy = async (strategy) => {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    const data = snap.data();
    const w = Number(data.weight) || 70;
    const h = Number(data.height) || 170;
    const a = Number(data.age) || 20;

    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = (data.gender === 'male') ? bmr + 5 : bmr - 161;
    let result = Math.round(bmr * 1.2); 
    if (strategy === 'lose') result -= 500;
    if (strategy === 'gain') result += 500;

    try {
      await setDoc(userRef, { dailyCalories: result, goal: strategy }, { merge: true });
      showToast("Режим активирован");
    } catch (e) { showToast("Ошибка базы"); }
  };

  if (!profile) return null;

  // Хелпер для получения текущего значения (из черновика или из профиля)
  const getValue = (key) => draftValues[key] !== undefined ? draftValues[key] : profile[key];

  return (
    <div className="w-full max-w-md mx-auto pb-32 text-white font-sans px-4 animate-in fade-in duration-500">
      
      <div className="flex flex-col items-center mt-10 mb-8 text-center">
        <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-[35px] flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-orange-500">Terminal</h2>
        <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">{user.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* HEIGHT */}
        <div onClick={() => setEditMode('height')} className={`bg-zinc-900/40 border p-6 rounded-[30px] transition-all h-28 flex flex-col justify-between cursor-pointer ${editMode === 'height' ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800/50'}`}>
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic text-center">Height</p>
          {editMode === 'height' ? (
            <input 
              type="number" autoFocus 
              className="bg-transparent w-full text-2xl font-black outline-none text-center text-orange-500" 
              value={getValue('height')} 
              onChange={(e) => setDraftValues({...draftValues, height: e.target.value})} 
            />
          ) : (
            <p className="text-2xl font-black text-center">{profile.height}<span className="text-[10px] text-zinc-600 ml-1 uppercase">cm</span></p>
          )}
        </div>

        {/* WEIGHT */}
        <div onClick={() => setEditMode('weight')} className={`bg-zinc-900/40 border p-6 rounded-[30px] transition-all h-28 flex flex-col justify-between cursor-pointer ${editMode === 'weight' ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800/50'}`}>
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic text-center">Weight</p>
          {editMode === 'weight' ? (
            <input 
              type="number" autoFocus 
              className="bg-transparent w-full text-2xl font-black outline-none text-center text-orange-500" 
              value={getValue('weight')} 
              onChange={(e) => setDraftValues({...draftValues, weight: e.target.value})} 
            />
          ) : (
            <p className="text-2xl font-black text-center">{profile.weight}<span className="text-[10px] text-zinc-600 ml-1 uppercase">kg</span></p>
          )}
        </div>
      </div>

      {/* WATER GOAL */}
      <div onClick={() => setEditMode('waterStep')} className={`bg-zinc-900/40 border p-6 rounded-[30px] transition-all flex items-center justify-between h-24 mb-10 cursor-pointer ${editMode === 'waterStep' ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800/50'}`}>
        <div>
           <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic mb-1">Water Goal</p>
           {editMode === 'waterStep' ? (
              <input 
                type="number" autoFocus 
                className="bg-transparent text-2xl font-black outline-none text-blue-500 w-28" 
                value={getValue('waterStep')} 
                onChange={(e) => setDraftValues({...draftValues, waterStep: e.target.value})} 
              />
           ) : (
              <p className="text-2xl font-black text-blue-400">{profile.waterStep || 2000}<span className="text-[10px] text-zinc-600 ml-1 uppercase">ml</span></p>
           )}
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-[20px] flex items-center justify-center">
           <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
        </div>
      </div>

      {/* КНОПКА ПОДТВЕРЖДЕНИЯ (Показывается если есть черновик) */}
      {Object.keys(draftValues).length > 0 && (
        <div className="fixed bottom-24 left-0 right-0 px-6 animate-in slide-in-from-bottom-4 z-50">
          <button 
            onClick={handleFinalSave} 
            className="w-full bg-white text-black py-5 rounded-[25px] font-black uppercase text-[11px] tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            Confirm and Sync
          </button>
          <button 
            onClick={() => { setDraftValues({}); setEditMode(null); }} 
            className="w-full mt-2 text-zinc-500 font-black uppercase text-[8px] tracking-widest text-center"
          >
            Cancel changes
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div className={`bg-zinc-900/40 border transition-all duration-500 rounded-[35px] overflow-hidden ${isGoalEditing ? 'border-orange-500/40 py-6' : 'border-zinc-800/50 p-6'}`}>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsGoalEditing(!isGoalEditing)}>
            <div className="flex items-center gap-4">
              <div className="text-orange-500 font-black text-xs italic uppercase">Strategy</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Goals & Calories</span>
            </div>
            <div className={`transition-transform duration-300 ${isGoalEditing ? 'rotate-180' : ''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg></div>
          </div>

          {isGoalEditing && (
            <div className="mt-8 px-2 space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setStrategy('lose')} className={`py-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${profile.goal === 'lose' ? 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-black/20 border-zinc-800 text-zinc-500'}`}>Lose</button>
                <button onClick={() => setStrategy('maintain')} className={`py-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${profile.goal === 'maintain' ? 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-black/20 border-zinc-800 text-zinc-500'}`}>Maintain</button>
                <button onClick={() => setStrategy('gain')} className={`py-4 rounded-2xl border text-[9px] font-black uppercase transition-all ${profile.goal === 'gain' ? 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-black/20 border-zinc-800 text-zinc-500'}`}>Gain</button>
              </div>

              <div className="bg-black/30 p-5 rounded-3xl border border-zinc-800/50">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-3 italic text-center tracking-widest">Custom Daily Limit</p>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="numeric" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-orange-500 text-white" value={manualCal} onFocus={() => setIsTyping(true)} onBlur={() => setTimeout(() => setIsTyping(false), 1000)} onChange={(e) => setManualCal(e.target.value)} placeholder="Limit..." />
                  <button onMouseDown={(e) => { e.preventDefault(); handleManualCalUpdate(); }} className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase active:scale-75 transition-all">SET</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <a 
          href="https://t.me/your_link" 
          target="_blank" 
          rel="noreferrer"
          className="w-full flex items-center justify-between p-6 bg-zinc-900/40 border border-zinc-800/50 rounded-[35px] active:scale-95 transition-all"
        >
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Support & Feedback</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="3"><path d="M9 18l6-6-6-6"/></svg>
        </a>

        <button onClick={() => signOut(auth)} className="w-full mt-10 py-5 rounded-[30px] bg-red-500/5 border border-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all">
          Logout Session
        </button>
      </div>
    </div>
  );
};

export default Profile;