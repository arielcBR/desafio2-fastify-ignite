import { FastifyReply, FastifyRequest } from "fastify";
import { mealRepositoryPrisma } from '../repositories/meals.repository';
import { CreateMealRequest, MealRepository } from '../interfaces/meals.interface';
import { z } from "zod";


class MealsController {
    private mealsRepository: MealRepository;

    constructor() {
        this.mealsRepository = mealRepositoryPrisma;
    }

    create = async (request: FastifyRequest<CreateMealRequest>, reply: FastifyReply) => {
        const createMealSchema = z.object({
            name: z.string().min(2, { message: "Must be 2 or more characters long" }),
            description: z.string({ message: "Invalid email address" }),
            isWithinDiet: z.boolean()
        });

        try {
            const { name, description, isWithinDiet } = createMealSchema.parse(request.body);
            const meal = { name, description, isWithinDiet };
            return reply.send({ meal });

        } catch (error) {
            console.log(error);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    }
}

const mealsController = new MealsController();

export { mealsController };