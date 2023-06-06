import { Meal } from './../@types/meal.d';

export function getBestSequenceWithinDiet(meals: Meal[]): number {
  const dietMeals = meals
    .filter((meal) => meal.is_diet_meal)
    .map((meal) => ({ ...meals, date: new Date(meal.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let maxConsecutiveDays = 0;
  let consecutiveDays = 0;
  let lastDate: Date | null = null;

  dietMeals.forEach((meal) => {
    const mealDate = new Date(meal.date).setHours(0, 0, 0, 0);

    if (
      lastDate === null ||
      (mealDate - lastDate.getTime()) / (1000 * 60 * 60 * 24) === 1
    ) {
      consecutiveDays++;
    } else {
      consecutiveDays = 1;
    }

    if (consecutiveDays > maxConsecutiveDays) {
      maxConsecutiveDays = consecutiveDays;
    }

    lastDate = new Date(mealDate);
  });

  return maxConsecutiveDays;
}
