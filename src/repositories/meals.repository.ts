import { prisma } from "../database/prisma-client";
import {
  Meal,
  MealCreate,
  MealRepository,
} from "../interfaces/meals.interface";

class MealRepositoryPrisma implements MealRepository {
  async create(data: MealCreate): Promise<Meal> {
    const meal = await prisma.meals.create({
      data: {
        name: data.name,
        description: data.description,
        authorId: data.authorId,
        isWithinDiet: data.isWithinDiet,
        createdAt: new Date(),
      },
    });

    return meal;
  }

  async findById(id: string): Promise<Meal | null> {
    const meal = await prisma.meals.findUnique({
      where: {
        id,
      },
    });

    return meal || null;
  }

  async delete(id: string): Promise<boolean> {
    const mealDeleted = await prisma.meals.delete({
      where: {
        id,
      },
    });

    return !!mealDeleted;
  }

    async getAllByUser(id: string): Promise<Meal[] | null> {
        const meals = await prisma.meals.findMany({
            where: {
                authorId: id
            }
        });

        return meals || null;
  }
}

const mealRepositoryPrisma = new MealRepositoryPrisma();
export { mealRepositoryPrisma };
