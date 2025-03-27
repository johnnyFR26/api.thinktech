import { FastifyReply, FastifyRequest } from "fastify";
import { client, waitForClientReady } from "../lib/bot";
import { TextChannel, NewsChannel, Channel } from "discord.js";

interface GitHubWebhookPayload {
  action?: string;
  pull_request?: {
    title: string;
    html_url: string;
    user: {
      login: string;
    };
  };
}

async function handleGitHubWebhook(
  request: FastifyRequest<{ Body: GitHubWebhookPayload }>,
  reply: FastifyReply
) {
  const payload = request.body;

  if (payload?.action === "opened" && payload.pull_request) {
    try {
      const channelId = process.env.CHANNEL_ID;
      if (!channelId) throw new Error("⚠️ CHANNEL_ID não definido no .env");

      console.log(`🔍 Buscando canal com ID: ${channelId}`);

      await waitForClientReady()

      // Verifica se o bot está pronto antes de buscar o canal
      if (!client.isReady()) {
        throw new Error("🤖 O bot ainda não está pronto para receber comandos.");
      }

      const channel: Channel | null = await client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel || channel instanceof NewsChannel)) {
        throw new Error(`❌ Canal ${channelId} não encontrado ou não é de texto.`);
      }

      console.log(`✅ Canal encontrado: ${channel.name} (${channel.id})`);

      const pr = payload.pull_request;
      await channel.send(
        `🔔 Novo Pull Request aberto! **${pr.title}**\n🔗 ${pr.html_url}\n👤 Autor: ${pr.user.login}`
      ).catch(console.error);

      console.log(`✅ Mensagem enviada para ${channel.name}`);

    } catch (error) {
      console.error("❌ Erro ao processar webhook:", error);
      return reply.status(500).send({ error: error.message });
    }
  }

  reply.send({ success: true });
}

export { handleGitHubWebhook };
