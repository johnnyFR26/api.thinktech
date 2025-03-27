import { Client, GatewayIntentBits } from "discord.js";

// Cria uma Promise que só é resolvida quando o bot estiver pronto
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// Função que retorna uma Promise que resolve quando o client estiver pronto
const waitForClientReady = () => {
  return new Promise<void>((resolve) => {
    client.once('ready', () => {
      console.log(`✅ Bot conectado como ${client.user!.tag}`);
      resolve(); // Resolve a Promise quando o client estiver pronto
    });
  });
};

// Inicializa o login e aguarda o client estar pronto
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    // Espera até que o client esteja pronto
    return waitForClientReady();
  })
  .catch((error) => {
    console.error("Erro ao tentar conectar o bot:", error);
  });

client.on("disconnect", () => {
  console.warn("⚠️ Bot desconectado! Tentando reconectar...");
});

client.on("reconnecting", () => {
  console.log("🔄 Reconectando ao Discord...");
});

export { client, waitForClientReady };
