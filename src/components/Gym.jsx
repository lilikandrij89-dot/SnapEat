import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, getDocs, query, where, deleteDoc, updateDoc } from "firebase/firestore";

const Gym = ({ user, showToast }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeView, setActiveView] = useState('list'); 
  const [templates, setTemplates] = useState([]); 
  const [currentWorkout, setCurrentWorkout] = useState(null); 
  const [historyLogs, setHistoryLogs] = useState([]);
  
  const [newDayName, setNewDayName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('arms');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const categoryIcons = {
    arms: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 21h12M12 3v18M3 7h3M18 7h3M3 17h3M18 17h3"/></svg>,
    legs: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v18M17 3v18M3 11h18M3 15h18"/></svg>,
    back: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20V14"/></svg>,
    chest: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="8" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    full: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 4 4 4 4-4-4-4z"/></svg>
  };

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, "users", user.uid, "gym_templates"), (snap) => {
      setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  const openWorkoutDetail = async (template) => {
    const q = query(collection(db, "users", user.uid, "gym_logs"), where("templateId", "==", template.id));
    const snap = await getDocs(q);
    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt);
    setHistoryLogs(logs);
    setCurrentWorkout(template);
    setActiveView('workout_detail');
  };

  const startNewSession = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayId = `${currentWorkout.id}_${todayStr}`;
    
    const existing = historyLogs.find(l => l.date === todayStr);
    if (existing) {
      setCurrentWorkout(existing);
      setActiveView('training');
      return;
    }

    let exercisesToStart = [];
    if (historyLogs.length > 0) {
      exercisesToStart = JSON.parse(JSON.stringify(historyLogs[0].exercises));
    } else {
      exercisesToStart = currentWorkout.exercises || [];
    }

    const newLogData = {
      templateId: currentWorkout.id,
      name: currentWorkout.name,
      category: currentWorkout.category,
      date: todayStr,
      createdAt: Date.now(),
      exercises: exercisesToStart
    };

    await setDoc(doc(db, "users", user.uid, "gym_logs", todayId), newLogData);
    setCurrentWorkout({ id: todayId, ...newLogData });
    setActiveView('training');
  };

  const updateTrainingData = async (newExercises) => {
    setCurrentWorkout(prev => ({ ...prev, exercises: newExercises }));
    await updateDoc(doc(db, "users", user.uid, "gym_logs", currentWorkout.id), { exercises: newExercises });
  };

  return (
    <div className="w-full max-w-md mx-auto pb-32 text-white px-4 animate-in fade-in duration-500 font-sans">
      
      {/* HEADER */}
      <div className="mt-8 mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Тренировка<span className="text-blue-500">.</span></h1>
        <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl text-[10px] font-black text-zinc-500 italic uppercase">
          {activeView === 'list' ? selectedDate : 'Workout Mode'}
        </div>
      </div>

      {/* VIEW: LIST (Главное меню) */}
      {activeView === 'list' && (
        <div className="space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800/50 p-5 rounded-[35px] mb-8 shadow-xl">
             <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 ml-1">Add new training day</p>
             {/* АДАПТИВНАЯ СЕТКА */}
             <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Название..." 
                  value={newDayName} 
                  onChange={(e) => setNewDayName(e.target.value)} 
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3.5 text-xs font-bold outline-none focus:border-blue-500 transition-all text-white" 
                />
                <div className="flex gap-2">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)} 
                    className="flex-1 bg-black/40 border border-zinc-800 rounded-xl p-3 text-[10px] font-black uppercase text-zinc-500 outline-none appearance-none"
                  > 
                    <option value="arms">Руки</option>
                    <option value="legs">Ноги</option>
                    <option value="back">Спина</option>
                    <option value="chest">Грудь</option>
                    <option value="full">Фуллбади</option>
                  </select>
                  <button onClick={async () => {
                    if (!newDayName) return;
                    const id = Date.now().toString();
                    await setDoc(doc(db, "users", user.uid, "gym_templates", id), { id, name: newDayName, category: selectedCategory, exercises: [] });
                    setNewDayName('');
                  }} className="bg-blue-600 px-6 rounded-xl font-black text-lg shadow-lg shadow-blue-600/20 active:scale-90 transition-all">+</button>
                </div>
             </div>
          </div>

          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4 ml-2 text-center">Your Programs</p>
          
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={t.id} className="relative">
                <button onClick={() => openWorkoutDetail(t)} className="w-full bg-zinc-900/60 border border-zinc-800/50 p-6 rounded-[35px] flex items-center justify-between active:scale-[0.98] transition-all shadow-lg">
                  <div className="flex items-center gap-5">
                    <div className="text-blue-500 opacity-80">
                      {categoryIcons[t.category] || categoryIcons.full}
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-black uppercase italic leading-none">{t.name}</h3>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1 tracking-widest">{t.exercises?.length || 0} exercises</p>
                    </div>
                  </div>
                  <div className="text-zinc-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(t);
                  }} 
                  className="absolute -top-1 -right-1 bg-zinc-800 text-zinc-500 w-7 h-7 rounded-full text-[10px] border border-zinc-700/50 flex items-center justify-center hover:text-red-500 transition-colors z-10 shadow-lg"
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: WORKOUT DETAIL */}
      {activeView === 'workout_detail' && (
        <div className="animate-in slide-in-from-bottom-10 space-y-6 text-center">
          <div className="py-10 flex flex-col items-center">
            <div className="text-blue-500 mb-6 bg-blue-500/10 p-6 rounded-full">
              {categoryIcons[currentWorkout.category]}
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">{currentWorkout.name}</h2>
          </div>

          <button onClick={startNewSession} className="w-full py-6 bg-blue-600 text-white rounded-[35px] font-black uppercase text-sm tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">
             Начать новый день
          </button>

          <button onClick={() => setActiveView('setup')} className="w-full py-4 border border-zinc-800 rounded-[25px] text-zinc-600 font-black uppercase text-[10px]">Редактировать упражнения</button>
          
          <div className="pt-8 text-left">
             <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-4 ml-4">История тренировок</p>
             <div className="space-y-3">
                {historyLogs.length === 0 && <p className="text-[10px] text-zinc-800 text-center italic py-4">Истории пока нет</p>}
                {historyLogs.map(log => (
                  <button key={log.id} onClick={() => { setCurrentWorkout(log); setActiveView('training'); }} className="w-full bg-zinc-900/30 border border-zinc-800/40 p-5 rounded-[25px] flex justify-between items-center active:scale-95 transition-all">
                     <span className="text-xs font-black uppercase italic text-zinc-400">{log.date}</span>
                     <div className="text-blue-500"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M9 18l6-6-6-6"/></svg></div>
                  </button>
                ))}
             </div>
          </div>
          <button onClick={() => setActiveView('list')} className="mt-8 text-[10px] font-black uppercase text-zinc-700 tracking-widest">Назад в меню</button>
        </div>
      )}

      {/* SETUP VIEW */}
      {activeView === 'setup' && (
        <div className="animate-in zoom-in-95 space-y-6">
          <div className="flex justify-between items-center mb-8 px-2">
             <h2 className="text-xl font-black uppercase italic">Setup</h2>
             <button onClick={async () => {
                await updateDoc(doc(db, "users", user.uid, "gym_templates", currentWorkout.id), { exercises: currentWorkout.exercises });
                setActiveView('list');
                showToast("Saved!");
             }} className="bg-blue-600 text-white px-6 py-2 rounded-full font-black text-[9px] uppercase">Save All</button>
          </div>
          {currentWorkout.exercises?.map((ex, exIdx) => (
            <div key={exIdx} className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-[35px] relative">
              <input type="text" placeholder="Упражнение..." value={ex.name} className="w-full bg-transparent border-b border-zinc-800 mb-4 py-2 font-black uppercase text-sm outline-none focus:border-blue-500" onChange={(e) => {
                  const updated = { ...currentWorkout };
                  updated.exercises[exIdx].name = e.target.value;
                  setCurrentWorkout(updated);
              }} />
              <div className="flex gap-2">
                {ex.sets.map((_, sIdx) => <div key={sIdx} className="bg-black/40 border border-zinc-800 px-3 py-2 rounded-xl text-[9px] font-black text-zinc-500">S{sIdx+1}</div>)}
                <button onClick={() => {
                  const updated = { ...currentWorkout };
                  updated.exercises[exIdx].sets.push({ weight: '', reps: '' });
                  setCurrentWorkout(updated);
                }} className="bg-zinc-800 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-blue-500">+ Set</button>
              </div>
              <button onClick={() => {
                  const updated = { ...currentWorkout };
                  updated.exercises = updated.exercises.filter((_, i) => i !== exIdx);
                  setCurrentWorkout(updated);
              }} className="absolute top-4 right-6 text-zinc-800 hover:text-red-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
          ))}
          <button onClick={() => {
             const updated = { ...currentWorkout };
             updated.exercises = [...(updated.exercises || []), { name: '', sets: [{ weight: '', reps: '' }] }];
             setCurrentWorkout(updated);
          }} className="w-full py-6 border-2 border-dashed border-zinc-800 rounded-[35px] text-zinc-700 font-black uppercase text-[10px]">+ Add exercise</button>
        </div>
      )}

      {/* TRAINING VIEW */}
      {activeView === 'training' && currentWorkout && (
        <div className="space-y-8 animate-in fade-in">
          <div className="bg-blue-600 p-6 rounded-[35px] flex justify-between items-center shadow-xl">
            <h2 className="text-lg font-black uppercase italic text-white tracking-tighter">{currentWorkout.name}</h2>
            <button onClick={() => setActiveView('list')} className="bg-white text-blue-600 px-6 py-2 rounded-full font-black text-[8px] uppercase">Finish</button>
          </div>

          <div className="space-y-12 px-1">
            {currentWorkout.exercises.map((ex, exIdx) => (
              <div key={exIdx}>
                <h4 className="text-[13px] font-black uppercase text-white mb-5 tracking-tighter border-l-4 border-blue-600 pl-4">{ex.name}</h4>
                <div className="space-y-3">
                  {ex.sets.map((set, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-3">
                      <div className="flex-1 flex items-center bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-1 px-5">
                         <input type="number" inputMode="decimal" className="w-12 bg-transparent text-sm font-black text-white outline-none py-2" value={set.weight} placeholder="0" onChange={(e) => {
                            const val = e.target.value;
                            const updatedEx = [...currentWorkout.exercises];
                            updatedEx[exIdx] = { ...updatedEx[exIdx], sets: [...updatedEx[exIdx].sets] };
                            updatedEx[exIdx].sets[sIdx] = { ...updatedEx[exIdx].sets[sIdx], weight: val };
                            updateTrainingData(updatedEx);
                         }}/>
                         <span className="text-[9px] font-black text-zinc-600 uppercase mr-4">кг</span>
                         <span className="text-zinc-800 font-black opacity-30">—</span>
                         <input type="number" inputMode="numeric" className="w-10 bg-transparent text-sm font-black text-blue-500 outline-none py-2 ml-4 text-center" value={set.reps} placeholder="0" onChange={(e) => {
                            const val = e.target.value;
                            const updatedEx = [...currentWorkout.exercises];
                            updatedEx[exIdx] = { ...updatedEx[exIdx], sets: [...updatedEx[exIdx].sets] };
                            updatedEx[exIdx].sets[sIdx] = { ...updatedEx[exIdx].sets[sIdx], reps: val };
                            updateTrainingData(updatedEx);
                         }}/>
                         <span className="text-[9px] font-black text-zinc-600 uppercase ml-1">раз</span>
                      </div>
                      <button onClick={() => {
                        const updated = [...currentWorkout.exercises];
                        updated[exIdx] = { ...updated[exIdx], sets: updated[exIdx].sets.filter((_, i) => i !== sIdx) };
                        updateTrainingData(updated);
                      }} className="text-zinc-800 p-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                  ))}
                  <button onClick={() => {
                    const updated = [...currentWorkout.exercises];
                    updated[exIdx] = { ...updated[exIdx], sets: [...updated[exIdx].sets, { weight: '', reps: '' }] };
                    updateTrainingData(updated);
                  }} className="text-[9px] font-black uppercase text-zinc-700 mt-2 ml-5">+ Set</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xs rounded-[40px] p-10 text-center shadow-2xl">
             <h3 className="text-lg font-black uppercase italic mb-8">Удалить программу?</h3>
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeleteConfirm(null)} className="py-4 rounded-2xl bg-zinc-800 text-[10px] font-black uppercase text-white/40">Нет</button>
                <button onClick={async () => {
                  await deleteDoc(doc(db, "users", user.uid, "gym_templates", deleteConfirm.id));
                  setDeleteConfirm(null);
                  showToast("Deleted");
                }} className="py-4 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase shadow-lg shadow-red-600/20">Да</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Gym;
