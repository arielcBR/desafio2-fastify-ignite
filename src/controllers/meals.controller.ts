import { FastifyReply, FastifyRequest } from "fastify";
import { mealRepositoryPrisma } from "../repositories/meals.repository";
import { sessionRepositoryPrisma } from "../repositories/sessions.repository";
import {
  CreateMealRequest,
  MealRepository,
} from "../interfaces/meals.interface";
import { z } from "zod";
import { SessionRepository } from "../interfaces/sessions.interface";

class MealsController {
  private mealsRepository: MealRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    this.mealsRepository = mealRepositoryPrisma;
    this.sessionRepository = sessionRepositoryPrisma;
  }

  create = async (
    request: FastifyRequest<CreateMealRequest>,
    reply: FastifyReply
  ) => {
    const createMealSchema = z.object({
      name: z.string().min(2, { message: "Must be 2 or more characters long" }),
      description: z.string({ message: "Invalid email address" }),
      isWithinDiet: z.boolean(),
    });

    const session = request.cookies.sessionId;

    if (!session) {
      return reply
        .status(401)
        .send({ message: "Unauthorized, session not found" });
    }

    try {
      const { name, description, isWithinDiet } = createMealSchema.parse(
        request.body
      );
      const sessionDetails = await this.sessionRepository.findUserBySession(session);

      if (!sessionDetails) {
        return reply
          .status(401)
          .send({ message: "Unauthorized, user without a session" });
      }

      const meal = await this.mealsRepository.create({
          authorId: sessionDetails.userId,
          name,
          description,
          isWithinDiet
      });
        
      return reply.send({ meal });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  };
}

const mealsController = new MealsController();

export { mealsController };
