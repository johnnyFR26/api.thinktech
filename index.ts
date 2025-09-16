import "reflect-metadata";
import Fastify from "fastify";
import mercurius from "mercurius";
import { buildSchema } from "type-graphql";

import { registerRoutes } from "./routes";
import { UsersResolver } from "./graphql/resolvers/users-resolver";
import cors from "@fastify/cors"
const server = Fastify({ logger: true });

registerRoutes(server);

async function setupGraphQL() {
  const schema = await buildSchema({
    resolvers: [UsersResolver],
    validate: true,
    emitSchemaFile: false,
  });

  server.register(mercurius, {
    schema,
    graphiql: true,
  });
}

server.get("/", async (request, reply) => {
  reply.send("Server running");
});

async function bootstrap() {
  await server.register(cors, {
    origin: [
      'https://finanz.app.br',
      'https://finanz-beta.vercel.app',
      'https://*.vercel.app',
      /\.vercel\.app$/,
      'http://localhost:3000',
      'http://localhost:4200',
    ],
    credentials: false
  })
  await setupGraphQL();

  server.listen({ port: 3000 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}

bootstrap();

export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit("request", req, res);
};

export { server };
