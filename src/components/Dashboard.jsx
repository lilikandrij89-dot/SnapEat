import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, increment, updateDoc, arrayUnion } from "firebase/firestore";
import SearchFood from './SearchFood';
import Scanner from './Scanner'; 

const Dashboard = ({ user, showToast }) => {
  const [dayData, setDayData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); 

  const [manualName, setManualName] = useState('');
  const [manualCals, setManualCals] = useState('');
  const [manualProt, setManualProt] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [manualCarb, setManualCarb] = useState('');
  const [manualWeight, setManualWeight] = useState('');
  const [mealType, setMealType] = useState('Завтрак');
  const [editingId, setEditingId] = useState(null);

  const mealCategories = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];
  const todayId = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });

    const unsubDay = onSnapshot(doc(db, "users", user.uid, "days", todayId), (snap) => {
      if (snap.exists()) {
        setDayData(snap.data());
      } else {
        setDayData({ consumedCalories: 0, meals: [], currentWater: 0 });
      }
      setLoading(false);
    });

    return () => { unsubProfile(); unsubDay(); };
  }, [user, todayId]);

  // ОБРАБОТКА РЕЗУЛЬТАТА ИЗ СКАНЕРА
  const handleScanSuccess = async (aiData) => {
    setIsScannerOpen(false);
    setLoading(true);

    try {
      // Динамический импорт поиска, чтобы не грузить лишнего
      const { searchFood } = await import('../services/fatsecret');
      const results = await searchFood(aiData.food_name);

      if (results && results.length > 0) {
        const food = results[0];
        const desc = food.food_description;
        
        // Парсим Ккал на 100г
        const calsPer100 = parseInt(desc.match(/Calories: (\d+)kcal/)?.[1] || 0);
        const weight = aiData.weight || 100;
        const finalCals = Math.round((calsPer100 / 100) * weight);

        const dayRef = doc(db, "users", user.uid, "days", todayId);
        const newMeal = {
          id: Date.now(),
          name: `${food.food_name} (AI)`,
          calories: finalCals,
          weight: weight,
          type: 'Перекус',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        await setDoc(dayRef, {
          consumedCalories: increment(finalCals),
          meals: arrayUnion(newMeal)
        }, { merge: true });

        showToast(`AI: ${food.food_name} ~${weight}г`);
      } else {
        showToast("Продукт не найден в базе");
      }
    } catch (e) {
      console.error(e);
      showToast("Ошибка анализа");
    } finally {
      setLoading(false);
    }
  };

  const addWater = async () => {
    const dayRef = doc(db, "users", user.uid, "days", todayId);
    await setDoc(dayRef, { currentWater: increment(0.25) }, { merge: true });
  };

  const removeWater = async () => {
    if ((dayData?.currentWater || 0) <= 0) return;
    const dayRef = doc(db, "users", user.uid, "days", todayId);
    await setDoc(dayRef, { currentWater: increment(-0.25) }, { merge: true });
  };

  const handleManualAdd = async () => {
    if (!manualName || !manualCals) return;
    const dayRef = doc(db, "users", user.uid, "days", todayId);
    const calories = Number(manualCals);
    let updatedMeals = [...(dayData?.meals || [])];
    let calDiff = calories;

    if (editingId) {
      const oldMeal = updatedMeals.find(m => m.id === editingId);
      calDiff = calories - (oldMeal?.calories || 0);
      updatedMeals = updatedMeals.map(m => m.id === editingId ? { 
        ...m, name: manualName, calories, protein: Number(manualProt) || 0, fat: Number(manualFat) || 0, carbs: Number(manualCarb) || 0, weight: Number(manualWeight) || 0, type: mealType 
      } : m);
    } else {
      updatedMeals.push({
        id: Date.now(),
        name: manualName,
        calories,
        protein: Number(manualProt) || 0,
        fat: Number(manualFat) || 0,
        carbs: Number(manualCarb) || 0,
        weight: Number(manualWeight) || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: mealType
      });
    }

    try {
      await setDoc(dayRef, { consumedCalories: increment(calDiff), meals: updatedMeals }, { merge: true });
      closeModal();
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const dayRef = doc(db, "users", user.uid, "days", todayId);
    const updatedMeals = dayData.meals.filter(m => m.id !== deleteConfirm.id);
    try {
      await updateDoc(dayRef, { 
        meals: updatedMeals, 
        consumedCalories: increment(-deleteConfirm.calories) 
      });
      setDeleteConfirm(null);
    } catch (e) { console.error(e); }
  };

  const startEdit = (meal) => {
    setEditingId(meal.id);
    setManualName(meal.name);
    setManualCals(meal.calories);
    setManualProt(meal.protein || '');
    setManualFat(meal.fat || '');
    setManualCarb(meal.carbs || '');
    setManualWeight(meal.weight || '');
    setMealType(meal.type);
    setIsManualInputOpen(true);
  };

  const closeModal = () => {
    setManualName(''); setManualCals(''); setManualProt(''); setManualFat(''); setManualCarb(''); setManualWeight('');
    setEditingId(null); setIsManualInputOpen(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-orange-500 font-black animate-pulse uppercase italic tracking-widest">Syncing system...</div>;

  const dailyLimit = Number(userProfile?.dailyCalories) || 2000;
  const consumed = Number(dayData?.consumedCalories) || 0;
  const remaining = dailyLimit - consumed;
  const progressWidth = dailyLimit > 0 ? Math.min((consumed / dailyLimit) * 100, 100) : 0;
  const waterGoalLiters = (Number(userProfile?.waterStep) / 1000) || 2.0;

  return (
    <div className="w-full max-w-md mx-auto pb-28 text-white font-sans px-2 relative animate-in fade-in duration-500">
      
      {/* Шапка */}
      <div className="mb-6 mt-4 ml-2">
        <p className="text-orange-500/60 text-[10px] font-bold uppercase tracking-[0.3em]">{todayId}</p>
        <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">Status Dashboard<span className="text-orange-500">.</span></h1>
      </div>

      {/* КАРТОЧКА КАЛОРИЙ */}
      <div className={`${remaining < 0 ? 'bg-red-600' : 'bg-orange-500'} rounded-[35px] p-8 mb-6 shadow-2xl relative overflow-hidden transition-colors duration-500`}>
        <div className="relative z-10">
          <p className="text-white/80 text-xs font-bold uppercase tracking-wide mb-1 italic">
            {remaining < 0 ? 'Limit Exceeded by' : 'Calories Left'}
          </p>
          <div className="flex items-baseline gap-2 mb-4">
            <h2 className="text-5xl font-black tracking-tighter text-white">
              {Math.abs(remaining).toLocaleString()}
            </h2>
            <span className="text-black/30 font-bold text-sm italic uppercase">kcal</span>
          </div>
          <div className="h-2.5 w-full bg-black/15 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-black/60 transition-all duration-700" style={{ width: `${progressWidth}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase text-white/70">
            <span>In: {consumed}</span>
            <span>Limit: {dailyLimit}</span>
          </div>
        </div>
      </div>

      {/* КНОПКИ УПРАВЛЕНИЯ */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => setIsScannerOpen(true)} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-[25px] flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="text-orange-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
          <span className="text-[8px] font-black uppercase text-zinc-500">Scanner</span>
        </button>
        <button onClick={() => setIsManualInputOpen(true)} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-[25px] flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="text-orange-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
          <span className="text-[8px] font-black uppercase text-zinc-500">Manual</span>
        </button>
        <button onClick={() => setIsSearchOpen(true)} className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-[25px] flex flex-col items-center gap-2 active:scale-95 transition-all">
          <div className="text-orange-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
          <span className="text-[8px] font-black uppercase text-zinc-500">Search</span>
        </button>
      </div>

      {/* ВОДА */}
      <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-[25px] flex items-center justify-between mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="text-blue-400"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>
          <div>
            <p className="text-[9px] font-bold text-zinc-500 uppercase italic opacity-50">Hydration</p>
            <p className="text-sm font-black text-white tracking-tighter">
              {(dayData?.currentWater || 0).toFixed(2)} / {waterGoalLiters.toFixed(1)} L
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={removeWater} className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 active:scale-75 transition-all"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14"/></svg></button>
          <button onClick={addWater} className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-blue-500/20"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg></button>
        </div>
      </div>

      {/* РАЦИОН */}
      <div className="px-2">
        <h3 className="text-xl font-black uppercase italic text-zinc-400 mb-4 tracking-tighter">Daily Log</h3>
        <div className="space-y-3">
          {dayData?.meals && dayData.meals.length > 0 ? (
            [...dayData.meals].reverse().map((meal) => (
              <div key={meal.id} className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-[25px] flex justify-between items-center shadow-md active:bg-zinc-900 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="text-orange-500/40 font-black text-[8px] uppercase border border-orange-500/20 px-2 py-1 rounded-lg">{meal.type}</div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-white leading-none">{meal.name}</p>
                    <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">
                      {meal.protein}P {meal.fat}F {meal.carbs}C | {meal.weight}g
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-xs font-black text-orange-500">{meal.calories}</p>
                    <button onClick={() => startEdit(meal)} className="text-zinc-700 hover:text-white transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                    <button onClick={() => setDeleteConfirm(meal)} className="text-zinc-700 hover:text-red-500 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[10px] font-black text-zinc-700 uppercase italic text-center p-12 border-2 border-dashed border-zinc-800/30 rounded-[35px]">No entries found</p>
          )}
        </div>
      </div>

      {/* МОДАЛКИ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xs rounded-[35px] p-8 text-center shadow-2xl">
             <h3 className="text-lg font-black uppercase italic mb-2">Delete?</h3>
             <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-8 leading-relaxed italic">"{deleteConfirm.name}"</p>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="py-4 rounded-2xl bg-zinc-800 text-[10px] font-black uppercase">No</button>
                <button onClick={confirmDelete} className="py-4 rounded-2xl bg-red-500 text-white text-[10px] font-black uppercase shadow-lg shadow-red-600/20">Yes</button>
             </div>
          </div>
        </div>
      )}

      {isManualInputOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-[35px] p-6 shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6 text-white text-center">Add Entry</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {mealCategories.map((cat) => (
                  <button key={cat} onClick={() => setMealType(cat)} className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${mealType === cat ? 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-black/40 border-zinc-800 text-zinc-500'}`}>{cat}</button>
                ))}
              </div>
              <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Product Name..." className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-orange-500" />
              <div className="grid grid-cols-2 gap-2 text-white">
                <input type="number" value={manualCals} onChange={(e) => setManualCals(e.target.value)} placeholder="Calories" className="bg-black border border-zinc-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-orange-500" />
                <input type="number" value={manualWeight} onChange={(e) => setManualWeight(e.target.value)} placeholder="Weight (g)" className="bg-black border border-zinc-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-orange-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={closeModal} className="flex-1 bg-zinc-800 text-white font-black py-4 rounded-2xl uppercase text-[10px]">Cancel</button>
              <button onClick={handleManualAdd} className="flex-1 bg-orange-500 text-black font-black py-4 rounded-2xl uppercase text-[10px] shadow-lg shadow-orange-500/20">Set</button>
            </div>
          </div>
        </div>
      )}

      {isSearchOpen && <SearchFood user={user} onClose={() => setIsSearchOpen(false)} todayId={todayId} />}
      {isScannerOpen && <Scanner onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />}
    </div>
  );
};

export default Dashboard;