import { app } from "./app";

app
  .listen({
    port: 3133
  })
  .then(() => {
    console.log("HTTP Server Running!");
  });
