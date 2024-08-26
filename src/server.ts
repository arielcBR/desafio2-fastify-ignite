import fastify from 'fastify';
import 'dotenv/config';

const PORT = Number(process.env.PORT || 3133);

const app = fastify({
  logger: true
});

app.get('/', async (request, reply) => {
  return { hello: 'world' }
});

app
  .listen({ port: PORT })
  .then(() => console.log(`Server online in the port ${PORT}!`));