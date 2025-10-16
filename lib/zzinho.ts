import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit/beta';
import { z } from 'genkit';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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

// Ferramenta: Buscar categoria por nome
const getCategoryByName = ai.defineTool(
  {
    name: "getCategoryByName",
    description: "Busca uma categoria pelo nome (parcial)",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
      categoryName: z.string().describe("Nome da categoria a buscar"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).nullable(),
  },
  async ({ userId, categoryName }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const categories = await prisma.category.findMany({
      where: {
        accountId: account.id,
        name: {
          contains: categoryName,
          mode: 'insensitive',
        },
      },
      select: { id: true, name: true },
    });

    return categories.length > 0 ? categories : null;
  }
);

// Ferramenta: Buscar cartão de crédito por nome
const getCreditCardByName = ai.defineTool(
  {
    name: "getCreditCardByName",
    description: "Busca um cartão de crédito pelo nome ou empresa",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
      cardName: z.string().describe("Nome ou empresa do cartão a buscar"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      company: z.string(),
      availableLimit: z.number(),
    })).nullable(),
  },
  async ({ userId, cardName }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const creditCards = await prisma.creditCard.findMany({
      where: {
        accountId: account.id,
        OR: [
          {
            name: {
              contains: cardName,
              mode: 'insensitive',
            },
          },
          {
            company: {
              contains: cardName,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: { id: true, name: true, company: true, availableLimit: true },
    });

    return creditCards.length > 0 ? creditCards.map(card => ({
      id: card.id,
      name: card.name,
      company: card.company,
      availableLimit: Number(card.availableLimit),
    })) : null;
  }
);

// Ferramenta: Buscar objetivo por nome
const getObjectiveByName = ai.defineTool(
  {
    name: "getObjectiveByName",
    description: "Busca um objetivo financeiro pelo nome",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
      objectiveName: z.string().describe("Nome do objetivo a buscar"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      title: z.string(),
      limit: z.number(),
    })).nullable(),
  },
  //@ts-ignore
  async ({ userId, objectiveName }) => {
    const account = await prisma.account.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!account) {
      throw new Error("Conta não encontrada");
    }

    const objectives = await prisma.objective.findMany({
      where: {
        accountId: account.id,
        title: {
          contains: objectiveName,
          mode: 'insensitive',
        },
      },
      select: { id: true, title: true, limit: true },
    });

    return objectives.length > 0 ? objectives : null;
  }
);

// Ferramenta: Criar transação com nomes
const createTransactionByName = ai.defineTool(
  {
    name: "createTransactionByName",
    description: "Cria uma transação usando nomes em vez de IDs. Busca automaticamente a conta, categoria e outros dados.",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
      value: z.number().describe("Valor da transação"),
      type: z.enum(["input", "output"]).describe("Tipo: input (entrada) ou output (saída)"),
      destination: z.string().describe("Destino ou origem"),
      description: z.string().describe("Descrição da transação"),
      categoryName: z.string().describe("Nome da categoria"),
      creditCardName: z.string().optional().describe("Nome do cartão de crédito (opcional)"),
      objectiveName: z.string().optional().describe("Nome do objetivo (opcional)"),
    }),
    outputSchema: z.object({
      success: z.boolean().optional(),
      transactionId: z.string().optional(),
      newAccountBalance: z.number().optional(),
      message: z.string().optional(),
    }),
  },
  async ({ userId, value, type, destination, description, categoryName, creditCardName, objectiveName }) => {
    try {
      // Buscar conta
      const account = await prisma.account.findUnique({
        where: { userId },
        select: { id: true, currentValue: true },
      });

      if (!account) {
        throw new Error("Conta não encontrada para este usuário");
      }

      // Buscar categoria
      const categories = await prisma.category.findMany({
        where: {
          accountId: account.id,
          name: {
            contains: categoryName,
            mode: 'insensitive',
          },
        },
      });

      if (categories.length === 0) {
        throw new Error(`Nenhuma categoria encontrada com o nome "${categoryName}"`);
      }

      if (categories.length > 1) {
        const categoryList = categories.map(c => `- ${c.name} (ID: ${c.id})`).join('\n');
        throw new Error(`Múltiplas categorias encontradas:\n${categoryList}\nPor favor, seja mais específico.`);
      }

      const categoryId = categories[0].id;

      // Buscar cartão de crédito se fornecido
      let creditCardId: string | undefined;
      if (creditCardName) {
        const creditCards = await prisma.creditCard.findMany({
          where: {
            accountId: account.id,
            OR: [
              { name: { contains: creditCardName, mode: 'insensitive' } },
              { company: { contains: creditCardName, mode: 'insensitive' } },
            ],
          },
        });

        if (creditCards.length === 0) {
          throw new Error(`Nenhum cartão encontrado com o nome "${creditCardName}"`);
        }

        if (creditCards.length > 1) {
          const cardList = creditCards.map(c => `- ${c.name || c.company} (Limite: ${c.availableLimit})`).join('\n');
          throw new Error(`Múltiplos cartões encontrados:\n${cardList}\nPor favor, seja mais específico.`);
        }

        creditCardId = creditCards[0].id;
      }

      // Buscar objetivo se fornecido
      let objectiveId: string | undefined;
      if (objectiveName) {
        const objectives = await prisma.objective.findMany({
          where: {
            accountId: account.id,
            title: {
              contains: objectiveName,
              mode: 'insensitive',
            },
          },
        });

        if (objectives.length === 0) {
          throw new Error(`Nenhum objetivo encontrado com o nome "${objectiveName}"`);
        }

        if (objectives.length > 1) {
          const objectiveList = objectives.map(o => `- ${o.title}`).join('\n');
          throw new Error(`Múltiplos objetivos encontrados:\n${objectiveList}\nPor favor, seja mais específico.`);
        }

        objectiveId = objectives[0].id;
      }

      // Processar cartão e fatura
      let invoiceId: string | undefined;
      if (creditCardId) {
        const creditCard = await prisma.creditCard.findUnique({
          where: { id: creditCardId },
          include: { invoices: { where: { status: true } } },
        });

        if (!creditCard) {
          throw new Error("Cartão de crédito não encontrado");
        }

        if (creditCard.invoices.length === 0) {
          const invoice = await prisma.invoice.create({
            data: {
              creditCardId: creditCard.id,
              closingDate: new Date(creditCard.close),
              dueDate: new Date(creditCard.expire),
            },
          });
          invoiceId = invoice.id;
        } else {
          invoiceId = creditCard.invoices[creditCard.invoices.length - 1].id;
        }

        await prisma.creditCard.update({
          where: { id: creditCard.id },
          data: {
            availableLimit: {
              decrement: value,
            },
          },
        });
      }

      // Processar planejamento
      const planningCategories = await prisma.planningCategories.findMany({
        where: { categoryId },
        select: { id: true, planningId: true },
      });

      if (planningCategories.length > 0) {
        const categoryIds = planningCategories.map(pc => pc.id);
        const planningIds = [...new Set(planningCategories.map(pc => pc.planningId))];

        await prisma.planningCategories.updateMany({
          where: { id: { in: categoryIds } },
          data: { availableLimit: { decrement: value } },
        });

        await prisma.planning.updateMany({
          where: { id: { in: planningIds } },
          data: { availableLimit: { decrement: value } },
        });
      }

      // Criar transação
      const transaction = await prisma.transaction.create({
        data: {
          value: new Decimal(value),
          description,
          type,
          destination,
          accountId: account.id,
          categoryId,
          ...(creditCardId && { creditCardId }),
          ...(objectiveId && { objectiveId }),
          ...(invoiceId && { invoiceId }),
        },
      });

      // Atualizar saldo
      const accountUpdate = await prisma.account.update({
        where: { id: account.id },
        data: {
          currentValue:
            type === "output"
              ? { decrement: value }
              : { increment: value },
        },
        select: { currentValue: true },
      });

      return {
        success: true,
        transactionId: transaction.id,
        newAccountBalance: Number(accountUpdate.currentValue),
        message: `✓ Transação registrada! Novo saldo: R$ ${Number(accountUpdate.currentValue).toFixed(2)}`,
      };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
);

// Endpoint principal
export const genkitEndpoint = async (userId: number, prompt: string, history: ChatMessage[] = []) => {
  const systemPrompt = `Você é o Zezinho, um especialista em finanças e na plataforma Finanz (aplicativo de gestão financeira).

Seu objetivo é ajudar os clientes a tomar decisões financeiras inteligentes e otimizadas, ajudando-os a alcançar seus objetivos financeiros de forma eficiente e segura.

Você tem acesso às seguintes ferramentas:

FERRAMENTAS DE CONSULTA:
- getAccountBalance: Verifica o saldo atual da conta
- getRecentTransactions: Analisa transações recentes
- getSpendingByCategory: Entende onde o dinheiro está sendo gasto
- getObjectives: Verifica progresso em objetivos financeiros
- getCreditCards: Analisa cartões de crédito disponíveis
- getMonthlyPlanning: Verifica o planejamento mensal

FERRAMENTAS DE BUSCA POR NOME:
- getCategoryByName: Busca categorias pelo nome (use isso antes de criar transações)
- getCreditCardByName: Busca cartões de crédito pelo nome (use isso para identificar cartões)
- getObjectiveByName: Busca objetivos pelo nome

FERRAMENTAS DE AÇÃO:
- createTransactionByName: Cria transações usando NOMES em vez de IDs (ferramenta principal para criar transações)

IMPORTANTE - FLUXO PARA CRIAR TRANSAÇÕES:
Quando o usuário quer registrar uma transação, siga este fluxo:

1. Se o usuário menciona um cartão, use getCreditCardByName para buscar. Se houver múltiplos, pergunte qual ele quer usar.
2. Se o usuário menciona um objetivo, use getObjectiveByName para buscar.
3. Use createTransactionByName com os NOMES (não IDs):
   - categoryName: Nome da categoria (ex: "delivery", "alimentação", "uber")
   - creditCardName: Nome do cartão (opcional, ex: "nubank", "bradesco")
   - objectiveName: Nome do objetivo (opcional)
4. A ferramenta criará a transação automaticamente buscando os IDs internamente.

EXEMPLO DE USO:
Usuário: "Registre uma saída de 30 reais na categoria delivery"
Você: Cria transação com createTransactionByName(userId, 30, "output", "Delivery", "Gasto com entrega", "delivery")

Usuário: "Registre um gasto de 50 no cartão nubank em alimentação"
Você: Cria transação com createTransactionByName(userId, 50, "output", "Alimentação", "Compra de alimentos", "alimentação", "nubank")

REGRAS:
1. Sempre use o userId fornecido (${userId}) ao chamar as ferramentas
2. NUNCA peça IDs ao usuário - use as ferramentas de busca por nome
3. Se um campo não for especificado, tente inferir pelo contexto
4. Se não conseguir encontrar um item (categoria, cartão, objetivo), avise o usuário com uma mensagem clara
5. Seja específico e baseie suas recomendações nos dados reais do usuário
6. Identifique padrões de gastos e oportunidades de economia
7. Alerte sobre uso excessivo de crédito ou desvios do planejamento
8. Celebre o progresso em objetivos financeiros
9. Dê respostas objetivas e acionáveis
10. Ensine o cliente para que consiga tomar decisões financeiras inteligentes e otimizadas

Lembre-se: você tem acesso aos dados reais do usuário e ferramentas para buscar por nome. Use-os para fornecer uma experiência conversacional sem pedir IDs.`;

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
      getCategoryByName,
      getCreditCardByName,
      getObjectiveByName,
      createTransactionByName,
    ],
  });
  
  const response = await chat.send(prompt);
  return response.text;
};
