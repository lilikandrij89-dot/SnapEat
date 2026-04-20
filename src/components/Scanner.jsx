import React, { useRef, useState, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const Scanner = ({ onClose, onScanSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Инициализация AI (Ключ который ты скинул)
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
        alert("Доступ к камере отклонен");
        onClose();
      }
    }
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose]);

  const capture = async () => {
    if (!videoRef.current || isAnalyzing) return;
    setIsAnalyzing(true);

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Делаем снимок
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

    try {
      // Настройка модели
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `Идентифицируй еду на фото. 
      Верни ТОЛЬКО JSON объект (без лишних слов и markdown): 
      {"food_name": "название продукта на русском для поиска в базе", "weight": примерный вес в граммах}`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
      ]);

      const response = await result.response;
      let text = response.text();
      
      // Очистка текста от возможных маркдаун-кавычек ```json ... ```
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const aiData = JSON.parse(text);

      // Передаем {food_name, weight} в Dashboard
      onScanSuccess(aiData); 

    } catch (err) {
      console.error("AI Analysis error:", err);
      alert("Не удалось распознать. Попробуй еще раз.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col animate-in fade-in">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      
      {/* Рамка сканера */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 border-2 border-orange-500/30 rounded-[50px] relative shadow-[0_0_0_2000px_rgba(0,0,0,0.6)]">
           <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-orange-500 rounded-tl-[30px]"></div>
           <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-orange-500 rounded-tr-[30px]"></div>
           <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-orange-500 rounded-bl-[30px]"></div>
           <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-orange-500 rounded-br-[30px]"></div>
           
           {/* Линия сканирования */}
           {!isAnalyzing && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/50 shadow-[0_0_15px_orange] animate-scan-line"></div>}
        </div>
      </div>

      <div className="absolute bottom-16 inset-x-0 flex justify-around items-center px-10">
        <button onClick={onClose} className="w-14 h-14 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white active:scale-90 transition-all">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        
        <button onClick={capture} className="w-24 h-24 bg-orange-500 rounded-full border-[6px] border-black/20 flex items-center justify-center active:scale-95 shadow-[0_0_50px_rgba(249,115,22,0.4)] transition-all">
          <div className="w-18 h-18 border-2 border-white/40 rounded-full"></div>
        </button>

        <div className="w-14 h-14 invisible"></div>
      </div>

      <canvas ref={canvasRef} width="640" height="480" className="hidden" />

      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center z-[210]">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-6"></div>
          <p className="text-orange-500 font-black uppercase tracking-[0.3em] italic animate-pulse">AI Анализ тарелки...</p>
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          position: absolute;
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Scanner;