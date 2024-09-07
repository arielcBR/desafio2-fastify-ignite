import { FastifyReply, FastifyRequest } from "fastify";
import { mealRepositoryPrisma } from "../repositories/meals.repository";
import { sessionRepositoryPrisma } from "../repositories/sessions.repository";
import {
  CreateMealRequest,
  Meal,
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

  private validateIdParam(request: FastifyRequest) {
    const getMealIdParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const result = getMealIdParamsSchema.safeParse(request.params);
    return result.success ? result.data.id.toString() : false;
  }

  private verifyOwnership({
    userId,
    meal,
  }: {
    userId: string;
    meal: Meal;
  }): boolean {
    return userId === meal.authorId;
  }

  create = async (
    request: FastifyRequest<CreateMealRequest>,
    reply: FastifyReply
  ) => {
    const createMealSchema = z.object({
      name: z.string().min(2, { message: "Must be 2 or more characters long" }),
      mealTime: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?([+-]\d{2}:\d{2}|Z)?$/
        ),
      description: z.string({ message: "Invalid email address" }),
      isWithinDiet: z.boolean(),
    });

    const session = request.cookies.sessionId;

    if (!session) {
      return reply.status(401).send({ message: "Session not found!" });
    }

    try {
      const { name, description, mealTime, isWithinDiet } =
        createMealSchema.parse(request.body);
      const sessionDetails = await this.sessionRepository.findUserBySession(
        session
      );

      if (!sessionDetails) {
        return reply
          .status(401)
          .send({ message: "Unauthorized, user without a session" });
      }

      const meal = await this.mealsRepository.create({
        authorId: sessionDetails.userId,
        name,
        description,
        mealTime: new Date(mealTime),
        isWithinDiet,
      });

      return reply.send({ meal });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  };

  indexByUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.cookies.sessionId;

    if (!sessionId) {
      return reply.status(401).send({ message: "Session not found!" });
    }

    try {
      const session = await this.sessionRepository.findUserBySession(sessionId);

      if (!session) {
        return reply
          .status(401)
          .send({ message: "Unauthorized, User not found" });
      }

      const AllMeals = await this.mealsRepository.getAllByUser(session.userId);

      if (!AllMeals) {
        return reply
          .status(404)
          .send({ message: "The user does not registered a meal yet." });
      }

      return reply.send(AllMeals);
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  };

  get = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const mealId = this.validateIdParam(request);

      if (!mealId) {
        return reply
          .status(401)
          .send({ message: "The meal ID was not provided or is invalid" });
      }

      const meal = await this.mealsRepository.findById(mealId);

      if (!meal) {
        return reply.status(404).send({ message: "The meal does not exist" });
      }

      return reply.send(meal);
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  };

  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    const mealIdParam = this.validateIdParam(request);
    const userId = request.cookies.userId;

    if (!mealIdParam) {
      return reply
        .status(400)
        .send({ message: "The meal ID was not provided or is invalid" });
    }

    if (!userId) {
      return reply
        .status(400)
        .send({ message: "The user ID was not provided or is invalid" });
    }

    try {
      const meal = await this.mealsRepository.findById(mealIdParam);

      if (!meal) {
        return reply
          .status(404)
          .send({ message: "The meal searched does not exist" });
      }

      const isTheOwner = this.verifyOwnership({ userId, meal });

      if (!isTheOwner) {
        return reply
          .status(401)
          .send({ message: "Unauthorized, only the author can delete" });
      }

      const deleteStatus = await this.mealsRepository.delete(mealIdParam);
      if (!deleteStatus) {
        return reply.status(500).send({ message: "Error when deleting meal" });
      }

      return reply
        .status(200)
        .send({ message: "The meal was deleted successfully" });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const mealId = this.validateIdParam(request);
    const userId = request.cookies.userId;

    if (!mealId) {
      return reply
        .status(401)
        .send({ message: "The meal ID provided is invalid" });
    }

    if (!userId) {
      return reply
        .status(400)
        .send({ message: "The user ID was not provided or is invalid" });
    }

    const updateMealSchema = z.object({
      name: z
        .string()
        .min(2, { message: "Must be 2 or more characters long" })
        .optional(),
      mealTime: z
        .string()
        .regex(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?([+-]\d{2}:\d{2}|Z)?$/
        ),
      description: z.string({ message: "Invalid email address" }).optional(),
      isWithinDiet: z.boolean().optional(),
    });

    const { success, data } = updateMealSchema.safeParse(request.body);

    if (!success)
      return reply
        .status(400)
        .send({ message: "The body provided is invalid" });

    const { name, description, mealTime, isWithinDiet } = data;

    const meal = await this.mealsRepository.findById(mealId);

    if (!meal) {
      return reply.status(404).send({ message: "The meal was not found" });
    }

    const isTheOwner = this.verifyOwnership({ userId, meal });

    if (!isTheOwner) {
      return reply
        .status(401)
        .send({ message: "Unauthorized, only the author can delete" });
    }

    meal.name = name ?? meal.name;
    meal.mealTime = new Date(mealTime) ?? meal.mealTime;
    meal.description = description ?? meal.description;
    meal.isWithinDiet = isWithinDiet ?? meal.isWithinDiet;

    try {
      const mealUpdated = await this.mealsRepository.update({
        Body: meal,
        id: mealId,
      });
      return reply.status(200).send({ mealUpdated });
    } catch (error) {
      console.log(error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  };
}

const mealsController = new MealsController();

export { mealsController };
