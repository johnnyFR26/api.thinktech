import Fastify from "fastify";
import mercurius from "mercurius";
import "reflect-metadata"; // necessário pro type-graphql funcionar
import { buildSchema } from "type-graphql";

import { registerRoutes } from "./routes";
import corsMiddleware from "./middlewares/cors.middlerare";
import { UsersResolver } from "./graphql/resolvers/users-resolver";

// 📦 Import resolvers GraphQL

const server = Fastify();

// 🔁 Middleware CORS
corsMiddleware(server, {});

// 📡 Rotas REST
registerRoutes(server);

// 📦 Inicialização do schema GraphQL
async function setupGraphQL() {
  const schema = await buildSchema({
    resolvers: [UsersResolver],
    validate: true,
    emitSchemaFile: true,
  });

  server.register(mercurius, {
    schema,
    graphiql: true, // habilita playground
  });
}

await setupGraphQL();

// 🧪 Rota simples REST
server.get("/", async (request, reply) => {
  reply.send("Server running");
});

// 🚀 Inicializa o servidor
server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

// 🔄 Export handler universal
export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit("request", req, res);
};

export { server };
