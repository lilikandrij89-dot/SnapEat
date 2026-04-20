// src/services/fatsecret.js

export const searchFood = async (query) => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`/api/food?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Сервер вернул ошибку:", errorText);
      return [];
    }

    const hints = await response.json();
    
    // Преобразуем данные Edamam под твой интерфейс
    return hints.map(item => ({
      food_id: item.food.foodId,
      food_name: item.food.label,
      food_description: `${Math.round(item.food.nutrients.ENERC_KCAL)} ккал / 100г`,
      image: item.food.image
    }));

  } catch (error) {
    console.error("Критическая ошибка на фронтенде:", error);
    return [];
  }
}; 
