import { FastifyInstance } from "fastify";
import { mealsController } from '../controllers/meals.controller';
import { authUser } from "../middlewares/auth.middleware";

export async function mealsRoutes(app: FastifyInstance) {
    app.addHook('preHandler', authUser);

    app.post('/', mealsController.create);
    app.get('/', mealsController.indexByUser);
    app.get("/:id", mealsController.get);
    app.delete('/:id', mealsController.delete);
}