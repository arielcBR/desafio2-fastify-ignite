import { prisma } from '../database/prisma-client';
import { Meal, MealCreate, MealRepository } from '../interfaces/meals.interface';

class MealRepositoryPrisma implements MealRepository{
    async create (data: MealCreate): Promise<Meal> {
        const meal = await prisma.meals.create({
            data: {
                name: data.name,
                description: data.description,
                authorId: data.authorId,
                isWithinDiet: data.isWithinDiet,
                createdAt: new Date()
            }
        });

        return meal;
    }
}

const mealRepositoryPrisma = new MealRepositoryPrisma();
export { mealRepositoryPrisma }