import { FastifyInstance } from 'fastify';
import { userController } from '../controllers/users.controllers';

export async function usersRoutes(app: FastifyInstance) {
    app.post('/', userController.create);
    app.post("/signin", userController.createSession);
}
