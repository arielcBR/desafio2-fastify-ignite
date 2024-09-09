import { FastifyInstance } from "fastify";
import { userController } from "../controllers/users.controllers";

export async function usersRoutes(app: FastifyInstance) {
  app.get("/metrics/:id", userController.getMetrics);
  app.post("/", userController.create);
  app.post("/signin", userController.createSessionForUser);
}
