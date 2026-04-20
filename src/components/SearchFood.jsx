import React, { useState, useEffect } from 'react';
import { searchFood } from '../services/fatsecret';
import { db } from '../firebase';
import { doc, setDoc, arrayUnion, increment } from "firebase/firestore";

const SearchFood = ({ user, onClose, todayId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mealType, setMealType] = useState('Завтрак');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setLoading(true);
        const res = await searchFood(query);
        setResults(res);
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  const addFood = async (food) => {
    // Поскольку мы используем OpenFoodFacts через наш бэкенд, 
    // калории уже лежат в понятном виде в food_description или можно брать из объекта напрямую,
    // если мы донастроим пропс. Но пока вытащим из строки:
    const calories = parseInt(food.food_description.match(/(\d+)/)?.[1] || 0);

    const dayRef = doc(db, "users", user.uid, "days", todayId);

    try {
      await setDoc(dayRef, {
        consumedCalories: increment(calories),
        meals: arrayUnion({
          id: Date.now(),
          name: food.food_name,
          calories: calories,
          weight: 100, 
          type: mealType,
          image: food.image || "", // Сохраняем картинку в историю
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
      }, { merge: true });
      
      onClose();
    } catch (e) {
      console.error("Firebase Error:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-zinc-900 border border-white/5 rounded-[40px] p-6 shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6 px-2">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Database<span className="text-orange-500">.</span></h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        {/* СЕЛЕКТОР КАТЕГОРИЙ */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {['Завтрак', 'Обед', 'Ужин', 'Перекус'].map((type) => (
            <button
              key={type}
              onClick={() => setMealType(type)}
              className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${
                mealType === type ? 'bg-orange-500 border-orange-500 text-black shadow-lg shadow-orange-500/20' : 'bg-zinc-800/50 border-zinc-800 text-zinc-500'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Поиск (курица, яблоко...)" 
              className="w-full bg-black/40 border border-zinc-800 p-5 rounded-[25px] text-white outline-none focus:border-orange-500 transition-all text-sm font-bold pr-12"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                </div>
            )}
        </div>

        <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar flex-1">
          {results.length === 0 && !loading && query.length > 2 && (
             <p className="text-center text-[10px] text-zinc-600 font-black uppercase py-10">Ничего не найдено</p>
          )}

          {results.map((item) => (
            <button 
              key={item.food_id}
              onClick={() => addFood(item)}
              className="w-full bg-zinc-800/30 border border-white/5 p-4 rounded-[30px] flex justify-between items-center hover:border-orange-500/40 transition-all text-left group active:scale-95"
            >
              <div className="flex items-center gap-4 max-w-[80%]">
                {/* КАРТИНКА ТУТ */}
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/5">
                    {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-700">No Pic</div>
                    )}
                </div>
                
                <div className="truncate">
                  <p className="text-[11px] font-black text-white uppercase truncate group-hover:text-orange-500 transition-colors">{item.food_name}</p>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1 leading-relaxed italic">{item.food_description}</p>
                </div>
              </div>

              <div className="bg-orange-500 text-black w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg shadow-orange-500/20 ml-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M12 5v14M5 12h14"/></svg>
              </div>
            </button>
          ))}
          
          {!loading && query.length <= 2 && (
            <div className="py-20 text-center opacity-20 italic">
               <p className="text-[10px] font-black uppercase tracking-[0.5em]">Global Search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchFood;
