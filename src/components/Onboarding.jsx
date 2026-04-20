import React, { useState } from 'react';

const Onboarding = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    gender: 'male',
    age: '',
    height: '',
    weight: '',
    goal: 'maintain' // lose, maintain, gain
  });

  const nextStep = () => setStep(step + 1);

  return (
    <div className="relative w-full max-w-[450px] animate-in fade-in zoom-in duration-500 px-4">
      <div className="relative bg-zinc-900/90 backdrop-blur-2xl border border-white/5 p-8 sm:p-10 rounded-[40px] shadow-2xl">
        
        {/* Индикатор прогресса */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-orange-500' : 'bg-zinc-800'}`} />
          ))}
        </div>

        {/* Шаг 1: Пол и Возраст */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white uppercase italic italic">Расскажи о себе<span className="text-orange-500">.</span></h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setData({...data, gender: 'male'})}
                className={`flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] border transition-all ${data.gender === 'male' ? 'bg-orange-500 border-orange-500 text-black' : 'border-zinc-800 text-zinc-500'}`}
              >Мужчина</button>
              <button 
                onClick={() => setData({...data, gender: 'female'})}
                className={`flex-1 py-4 rounded-2xl font-bold uppercase text-[10px] border transition-all ${data.gender === 'female' ? 'bg-orange-500 border-orange-500 text-black' : 'border-zinc-800 text-zinc-500'}`}
              >Женщина</button>
            </div>
            <input 
              type="number" 
              placeholder="Твой возраст" 
              className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 transition-all"
              value={data.age}
              onChange={(e) => setData({...data, age: e.target.value})}
            />
            <button onClick={nextStep} className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-xs tracking-widest mt-4">Далее</button>
          </div>
        )}

        {/* Шаг 2: Рост и Вес */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white uppercase italic">Параметры тела<span className="text-orange-500">.</span></h2>
            <input 
              type="number" 
              placeholder="Рост (см)" 
              className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 transition-all"
              value={data.height}
              onChange={(e) => setData({...data, height: e.target.value})}
            />
            <input 
              type="number" 
              placeholder="Вес (кг)" 
              className="w-full bg-black/40 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-orange-500 transition-all"
              value={data.weight}
              onChange={(e) => setData({...data, weight: e.target.value})}
            />
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 text-zinc-500 font-bold uppercase text-[10px]">Назад</button>
              <button onClick={nextStep} className="flex-[2] bg-white text-black font-black py-4 rounded-2xl uppercase text-xs tracking-widest">Далее</button>
            </div>
          </div>
        )}

        {/* Шаг 3: Цель */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white uppercase italic">Твоя цель<span className="text-orange-500">.</span></h2>
            <div className="space-y-3">
              {[
                {id: 'lose', label: 'Похудение', desc: 'Сжигаем жир'},
                {id: 'maintain', label: 'Поддержание', desc: 'Держим форму'},
                {id: 'gain', label: 'Набор массы', desc: 'Строим мышцы'}
              ].map((goal) => (
                <button 
                  key={goal.id}
                  onClick={() => setData({...data, goal: goal.id})}
                  className={`w-full p-5 rounded-2xl border text-left transition-all ${data.goal === goal.id ? 'bg-orange-500 border-orange-500' : 'border-zinc-800'}`}
                >
                  <p className={`font-black uppercase text-[11px] ${data.goal === goal.id ? 'text-black' : 'text-white'}`}>{goal.label}</p>
                  <p className={`text-[9px] font-medium ${data.goal === goal.id ? 'text-black/60' : 'text-zinc-500'}`}>{goal.desc}</p>
                </button>
              ))}
            </div>
            <button 
              onClick={() => onComplete(data)}
              className="w-full bg-orange-500 text-black font-black py-5 rounded-3xl uppercase text-xs tracking-[0.2em] shadow-lg active:scale-95 transition-all mt-4"
            >
              Завершить настройку
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;