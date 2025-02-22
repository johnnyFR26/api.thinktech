import Fastify from "fastify";
import { registerRoutes } from "./routes";
import corsMiddleware from "./middlewares/cors.middlerare";

const server = Fastify();
registerRoutes(server)
corsMiddleware(server, {});

server.get("/", async (request, reply) => {
  reply.send("Server running");
});

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

export default async (req: any, res: any) => {
    await server.ready();
    server.server.emit("request", req, res);
};

export { server };
