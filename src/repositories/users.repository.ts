import {
  User,
  UserCreate,
  UserRepository,
} from "../interfaces/users.interface";
import { prisma } from "../database/prisma-client";
import { Meal } from "../interfaces/meals.interface";

class UserRepositoryPrisma implements UserRepository {
  private calculateBestConsecutiveDietMealsSequence(meals: Meal[]): number {
    if (meals.length === 0) return 0;

    let maxSequence = 0;
    let currentSequence = 1; // Começa com 1 porque a primeira refeição conta como uma sequência

    for (let i = 1; i < meals.length; i++) {
      const previousMealTime = new Date(meals[i - 1].mealTime);
      const currentMealTime = new Date(meals[i].mealTime);

      // Verifica se a refeição atual é no dia seguinte da refeição anterior
      if (
        currentMealTime.getDate() === previousMealTime.getDate() + 1 &&
        currentMealTime.getMonth() === previousMealTime.getMonth() &&
        currentMealTime.getFullYear() === previousMealTime.getFullYear()
      ) {
        currentSequence++;
      } else {
        // Reinicia a sequência
        maxSequence = Math.max(maxSequence, currentSequence);
        currentSequence = 1; // Reinicia a sequência para a próxima sequência
      }
    }

    // Verifica a última sequência
    maxSequence = Math.max(maxSequence, currentSequence);

    return maxSequence;
  }

  async create(data: UserCreate): Promise<User> {
    const result = await prisma.users.create({
      data: {
        email: data.email,
        createdAt: new Date(),
      },
    });

    return result;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await prisma.users.findFirst({
      where: {
        email,
      },
    });

    return result || null;
  }

  async getMetrics(userId: string) {
    const amountOfMealsCreated = await prisma.meals.count({
      where: { authorId: userId },
    });

    const amountOfMealsWhitinTheDiet = await prisma.meals.count({
      where: {
        AND: {
          isWithinDiet: true,
          authorId: userId,
        },
      },
    });

    const amountOfMealsOutOfTheDiet = await prisma.meals.count({
      where: {
        AND: {
          isWithinDiet: false,
          authorId: userId,
        },
      },
    });

    const dietMealsForUser = await prisma.meals.findMany({
      where: {
        AND: {
          authorId: userId,
          isWithinDiet: true,
        },
      },
      orderBy: {
        mealTime: "asc",
      },
    });

    const bestConsecutiveDietMealsSequence =
      this.calculateBestConsecutiveDietMealsSequence(dietMealsForUser);

    return {
      amountOfMealsCreated,
      amountOfMealsWhitinTheDiet,
      amountOfMealsOutOfTheDiet,
      bestConsecutiveDietMealsSequence,
    };
  }
}

const userRepositoryPrisma = new UserRepositoryPrisma();
export { userRepositoryPrisma };
