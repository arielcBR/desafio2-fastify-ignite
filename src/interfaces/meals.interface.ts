export interface Meal {
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    isWithinDiet: boolean;
}

export type MealCreate = Omit<Meal, 'createdAt' | 'updatedAt'>;
export interface CreateMealRequest {
    Body: MealCreate;
}
export interface UpdateMeal {
  id: string;
  Body: MealCreate
}

export interface MealRepository {
  create: (data: MealCreate) => Promise<Meal>;
  findById: (id: string) => Promise<Meal | null>;
  delete: (id: string) => Promise<boolean>;
  update: (data: UpdateMeal) => Promise<Meal>;
  getAllByUser: (id: string) => Promise<Meal[] | null>;
}