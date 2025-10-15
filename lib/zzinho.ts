import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit/beta';
import { z } from 'genkit';
import { PrismaClient } from '@prisma/client';

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const prisma = new PrismaClient();

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'),
});

// Ferramenta: Buscar saldo da conta
const getAccountBalance = ai.defineTool(
  {
    name: "getAccountBalance",
    description: "Obtém o saldo atual da conta do usuário",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
    }),
    outputSchema: z.object({
      currentValue: z.number(),
      currency: z.string(),
    }),
  },
  async ({ userId }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { currentValue: true, currency: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    return {
      currentValue: Number(account.currentValue),
      currency: account.currency,
    };
  }
);

// Ferramenta: Buscar transações recentes
const getRecentTransactions = ai.defineTool(
  {
    name: "getRecentTransactions",
    description: "Obtém as transações mais recentes do usuário",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
      limit: z.number().optional().default(10).describe("Número de transações a retornar"),
      type: z.enum(["input", "output"]).optional().describe("Tipo de transação a filtrar"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      value: z.number(),
      type: z.string(),
      destination: z.string(),
      description: z.string(),
      category: z.string(),
      createdAt: z.string(),
    })),
  },
  async ({ userId, limit, type }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: account.id,
        ...(type && { type }),
      },
      include: {
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return transactions.map(t => ({
      id: t.id,
      value: Number(t.value),
      type: t.type,
      destination: t.destination,
      description: t.description,
      category: t.category.name,
      createdAt: t.createdAt.toISOString(),
    }));
  }
);

// Ferramenta: Analisar gastos por categoria
const getSpendingByCategory = ai.defineTool(
  {
    name: "getSpendingByCategory",
    description: "Analisa os gastos do usuário agrupados por categoria em um período",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
      startDate: z.string().optional().describe("Data inicial (ISO string)"),
      endDate: z.string().optional().describe("Data final (ISO string)"),
    }),
    outputSchema: z.array(z.object({
      category: z.string(),
      totalSpent: z.number(),
      transactionCount: z.number(),
    })),
  },
  async ({ userId, startDate, endDate }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        accountId: account.id,
        type: 'output',
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        category: { select: { name: true } },
      },
    });

    // Agrupar por categoria
    const grouped = transactions.reduce((acc, t) => {
      const categoryName = t.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = { totalSpent: 0, count: 0 };
      }
      acc[categoryName].totalSpent += Number(t.value);
      acc[categoryName].count += 1;
      return acc;
    }, {} as Record<string, { totalSpent: number; count: number }>);

    return Object.entries(grouped).map(([category, data]) => ({
      category,
      totalSpent: data.totalSpent,
      transactionCount: data.count,
    }));
  }
);

// Ferramenta: Verificar objetivos
const getObjectives = ai.defineTool(
  {
    name: "getObjectives",
    description: "Obtém os objetivos financeiros do usuário e seu progresso",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      title: z.string(),
      limit: z.number(),
      currentValue: z.number(),
      milestone: z.string(),
      progress: z.number(),
    })),
  },
  async ({ userId }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const objectives = await prisma.objective.findMany({
      where: { accountId: account.id },
      include: {
        transactions: {
          select: { value: true },
        },
      },
    });

    return objectives.map(obj => {
      const currentValue = obj.transactions.reduce(
        (sum, t) => sum + Number(t.value),
        0
      );
      const progress = (currentValue / Number(obj.limit)) * 100;

      return {
        id: obj.id,
        title: obj.title,
        limit: Number(obj.limit),
        currentValue,
        milestone: obj.milestone.toISOString(),
        progress: Math.min(progress, 100),
      };
    });
  }
);

// Ferramenta: Verificar cartões de crédito
const getCreditCards = ai.defineTool(
  {
    name: "getCreditCards",
    description: "Obtém informações sobre os cartões de crédito do usuário",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      company: z.string(),
      limit: z.number(),
      availableLimit: z.number(),
      usedPercentage: z.number(),
      closeDay: z.number(),
      dueDay: z.number(),
    })),
  },
  async ({ userId }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const creditCards = await prisma.creditCard.findMany({
      where: { accountId: account.id },
    });

    return creditCards.map(card => ({
      id: card.id,
      name: card.name,
      company: card.company,
      limit: Number(card.limit),
      availableLimit: Number(card.availableLimit),
      usedPercentage: ((Number(card.limit) - Number(card.availableLimit)) / Number(card.limit)) * 100,
      closeDay: card.close,
      dueDay: card.expire,
    }));
  }
);

// Ferramenta: Verificar planejamento mensal
const getMonthlyPlanning = ai.defineTool(
  {
    name: "getMonthlyPlanning",
    description: "Obtém o planejamento financeiro mensal do usuário",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
      month: z.string().optional().describe("Mês no formato YYYY-MM"),
    }),
    outputSchema: z.object({
      planningId: z.string(),
      title: z.string(),
      limit: z.number(),
      availableLimit: z.number(),
      usedPercentage: z.number(),
      categories: z.array(z.object({
        categoryName: z.string(),
        limit: z.number(),
        availableLimit: z.number(),
        usedPercentage: z.number(),
      })),
    }).nullable(),
  },
  async ({ userId, month }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const targetDate = month ? new Date(month) : new Date();
    
    const planning = await prisma.planning.findFirst({
      where: {
        accountId: account.id,
        month: {
          gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1),
          lt: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1),
        },
      },
      include: {
        planningCategories: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
    });

    if (!planning) {
      return null;
    }

    return {
      planningId: planning.id,
      title: planning.title,
      limit: Number(planning.limit),
      availableLimit: Number(planning.availableLimit),
      usedPercentage: ((Number(planning.limit) - Number(planning.availableLimit)) / Number(planning.limit)) * 100,
      categories: planning.planningCategories.map(pc => ({
        categoryName: pc.category.name,
        limit: Number(pc.limit),
        availableLimit: Number(pc.availableLimit),
        usedPercentage: ((Number(pc.limit) - Number(pc.availableLimit)) / Number(pc.limit)) * 100,
      })),
    };
  }
);

// Endpoint principal
export const genkitEndpoint = async (userId: number, prompt: string, history: ChatMessage[] = []) => {
  const systemPrompt = `Você é o Zezinho, um especialista em finanças e na plataforma Finanz (aplicativo de gestão financeira).

Seu objetivo é ajudar os clientes a tomar decisões financeiras inteligentes e otimizadas, ajudando-os a alcançar seus objetivos financeiros de forma eficiente e segura.

Você tem acesso às seguintes ferramentas para analisar os dados financeiros do usuário:
- getAccountBalance: Para verificar o saldo atual
- getRecentTransactions: Para analisar transações recentes
- getSpendingByCategory: Para entender onde o dinheiro está sendo gasto
- getObjectives: Para verificar progresso em objetivos financeiros
- getCreditCards: Para analisar uso de cartões de crédito
- getMonthlyPlanning: Para verificar o planejamento mensal

Ao analisar os dados:
1. Sempre use o userId fornecido (${userId}) ao chamar as ferramentas
2. Seja específico e baseie suas recomendações nos dados reais do usuário
3. Identifique padrões de gastos e oportunidades de economia
4. Alerte sobre uso excessivo de crédito ou desvios do planejamento
5. Celebre o progresso em objetivos financeiros
6. Dê respostas objetivas e acionáveis
7. Fornecer insights personalizados e relevantes
8. Sempre que puder use as ferramentas para fornecer insights personalizados e relevantes
9. sempre ensine o cliente para que ele consiga tomar decisões financieras inteligentes e otimizadas, ajudando-o a alcancar seus objetivos financeiros de forma eficiente e segura

Lembre-se: você tem acesso aos dados reais do usuário. Use-os para fornecer insights personalizados e relevantes.`;

  const messages = history.map(msg => ({
    role: msg.role,
    content: [{ text: msg.content }]
  }));

  const chat = ai.chat({ 
    system: systemPrompt,
    messages,
    tools: [
      getAccountBalance,
      getRecentTransactions,
      getSpendingByCategory,
      getObjectives,
      getCreditCards,
      getMonthlyPlanning,
    ],
  });
  
  const response = await chat.send(prompt);
  return response.text;
};