export interface Meal {
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    isWithinDiet: boolean;
}

export type MealCreate = Omit<Meal, 'createdAt' | 'updatedAt' >;

export interface CreateMealRequest {
    Body: MealCreate;
}

export interface MealRepository {
  create: (data: MealCreate) => Promise<Meal>;
}