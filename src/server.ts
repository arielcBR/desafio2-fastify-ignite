import { app } from "./app";

const port = 3133;

app
  .listen({ port })
  .then(() => console.log(`Server Running in the port ${port}!`));
