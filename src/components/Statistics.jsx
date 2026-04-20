import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis, ReferenceLine } from 'recharts';

const Statistics = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayData, setDayData] = useState(null);
  const [fullHistory, setFullHistory] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 1. СЛУШАЕМ ВСЮ ИСТОРИЮ (Авто-обновление графика веса)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "days"), orderBy("__name__", "asc"));
    
    const unsub = onSnapshot(q, (snap) => {
      const history = snap.docs.map(d => ({
        // Отрезаем год для красоты: 2024-04-20 -> 04.20
        displayDate: d.id.split('-').slice(1).join('.'), 
        weight: d.data().weight || null,
        kcal: d.data().consumedCalories || 0
      })).filter(item => item.weight !== null); // Только дни с весом для графика
      
      setFullHistory(history);
    });

    return () => unsub();
  }, [user]);

  // 2. ДАННЫЕ ВЫБРАННОГО ДНЯ (Архив логов)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, "users", user.uid, "days", selectedDate), (docSnap) => {
      if (docSnap.exists()) {
        setDayData(docSnap.data());
      } else {
        setDayData({ meals: [], consumedCalories: 0, currentWater: 0 });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user, selectedDate]);

  const dailyStats = useMemo(() => {
    if (!dayData?.meals) return { p: 0, f: 0, c: 0, kcal: 0 };
    return dayData.meals.reduce((acc, m) => {
      acc.p += Number(m.protein || 0);
      acc.f += Number(m.fat || 0);
      acc.c += Number(m.carbs || 0);
      acc.kcal += Number(m.calories || 0);
      return acc;
    }, { p: 0, f: 0, c: 0, kcal: 0 });
  }, [dayData]);

  // Расчет процентов для прогресс-баров макросов
  const totalMacros = dailyStats.p + dailyStats.f + dailyStats.c || 1;
  const getMacroPerc = (val) => Math.min((val / totalMacros) * 100, 100);

  return (
    <div className="w-full max-w-md mx-auto pb-32 text-white font-sans px-3 animate-in fade-in duration-500">
      
      {/* ГЛОБАЛЬНЫЙ ГРАФИК */}
      <div className="mt-6 mb-8">
        <p className="text-orange-500/60 text-[9px] font-black uppercase tracking-[0.4em] mb-4 text-center italic">Weight Progression</p>
        <div className="bg-zinc-900/60 border border-zinc-800/50 p-5 rounded-[35px] shadow-2xl relative overflow-hidden h-64 backdrop-blur-sm">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fullHistory}>
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fill: '#3f3f46', fontSize: 8}} minTickGap={30} />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '15px', fontSize: '10px', fontWeight: '900' }}
                itemStyle={{ color: '#f97316' }}
                labelStyle={{ color: '#52525b', marginBottom: '4px' }}
                cursor={{ stroke: '#27272a', strokeWidth: 1 }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#f97316" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#000', stroke: '#f97316', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#f97316' }}
                connectNulls
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 ml-1 opacity-50">
        <div className="h-[1px] flex-1 bg-zinc-800"></div>
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Historical Archive</span>
        <div className="h-[1px] flex-1 bg-zinc-800"></div>
      </div>

      {/* ВЫБОР ДАТЫ */}
      <div className="relative bg-zinc-900/60 rounded-[30px] border border-zinc-800/50 shadow-xl mb-6 active:scale-[0.97] transition-all overflow-hidden group">
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
        />
        <div className="flex justify-between items-center p-5 relative z-10 pointer-events-none">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-0.5 italic">Selected Snapshot</p>
              <p className="text-sm font-black text-white uppercase italic">{selectedDate.split('-').reverse().join('/')}</p>
            </div>
          </div>
          <div className="text-right border-l border-zinc-800 pl-4">
            <p className="text-xs font-black text-white">{dailyStats.kcal.toLocaleString()}</p>
            <p className="text-[8px] font-bold text-zinc-600 uppercase">kcal</p>
          </div>
        </div>
      </div>

      {/* МАКРОНУТРИЕНТЫ (Динамические полоски) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'PROT', val: dailyStats.p, color: 'bg-blue-500' },
          { label: 'FAT', val: dailyStats.f, color: 'bg-yellow-500' },
          { label: 'CARB', val: dailyStats.c, color: 'bg-green-500' }
        ].map((item, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-[25px] text-center">
            <p className="text-[7px] font-black text-zinc-500 uppercase mb-1">{item.label}</p>
            <p className="text-lg font-black">{Math.round(item.val)}<span className="text-[8px] text-zinc-600 ml-0.5">g</span></p>
            <div className="h-1 w-full bg-black/40 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full ${item.color} transition-all duration-1000`} 
                style={{ width: `${getMacroPerc(item.val)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* ЛОГИ ДНЯ */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[35px] backdrop-blur-md shadow-inner">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black uppercase italic text-zinc-500 tracking-widest">Entry Database</h3>
          <span className="bg-zinc-800 text-zinc-500 text-[8px] px-2 py-1 rounded-lg font-black">{dayData?.meals?.length || 0} ITEMS</span>
        </div>
        
        <div className="space-y-4">
          {dayData?.meals?.length > 0 ? (
            dayData.meals.map((meal, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-zinc-800/30 pb-3 group">
                <div className="w-2/3">
                  <p className="text-[11px] font-black uppercase text-white truncate mb-1 group-active:text-orange-500 transition-colors">{meal.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[7px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 font-black">{meal.type}</span>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase italic">{meal.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-orange-500">+{meal.calories}</p>
                  <p className="text-[7px] font-bold text-zinc-700 uppercase">kcal</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="opacity-10 mb-2">
                 <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <p className="opacity-20 italic text-[9px] uppercase font-black tracking-[.3em]">No records found for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;