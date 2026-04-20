
/**
 * Функция поиска еды.
 * Теперь она не содержит ключей и просто вызывает наш API на Vercel.
 */
export const searchFood = async (query) => {
  if (!query || query.length < 2) return [];

  try {
    // Запрос идет к серверной функции /api/food.js
    const response = await fetch(`/api/food?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      console.error("Ошибка API маршрута");
      return [];
    }

    const data = await response.json();

    // FatSecret возвращает либо массив, либо объект (если 1 результат), либо ничего.
    const foodResults = data.foods?.food || [];

    // Приводим всегда к массиву, чтобы .map() не выдавал ошибку
    return Array.isArray(foodResults) ? foodResults : [foodResults];

  } catch (error) {
    console.error("Ошибка при поиске:", error);
    return [];
  }
};
