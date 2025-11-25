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

// ========================================
// FERRAMENTAS DE CONSULTA
// ========================================

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

const getHoldings = ai.defineTool(
  {
    name: "getHoldings",
    description: "Obtém holdings (investimentos) do usuário e suas movimentações",
    inputSchema: z.object({
      userId: z.number().describe("ID do usuário"),
    }),
    outputSchema: z.array(z.object({
      id: z.string(),
      name: z.string(),
      currentValue: z.number().nullable(),
      percentChange: z.number().nullable(),
      movements: z.array(z.object({
        id: z.string(),
        type: z.string(),
        value: z.number(),
        date: z.string(),
      })).nullable(),
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

    const holdings = await prisma.holding.findMany({
      where: { accountId: account.id },
      include: { movimentations: true },
    });

    return holdings.map(h => ({
      id: h.id,
      name: h.name,
      currentValue: h.total ? Number(h.total) : null,
      percentChange: typeof (h.tax) !== 'undefined' && h.tax !== null ? Number(h.tax) : null,
      movements: (h.movimentations?.map(m => ({
        id: m.id,
        type: m.type,
        value: Number(m.value ?? (Number(m.value))),
        date: m.createdAt.toISOString(),
      }))) || null,
    }));
  }
);

// ========================================
// FERRAMENTAS DE BUSCA
// ========================================

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

    return objectives.length > 0 ? objectives.map(obj => ({
      id: obj.id,
      title: obj.title,
      limit: Number(obj.limit),
    })) : null;
  }
);

// ========================================
// FERRAMENTAS DE AÇÃO
// ========================================

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
      creditCardName: z.string().optional().nullable().describe("Nome do cartão de crédito (opcional)"),
      objectiveName: z.string().optional().nullable().describe("Nome do objetivo (opcional)"),
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
      const account = await prisma.account.findUnique({
        where: { userId },
        select: { id: true, currentValue: true },
      });

      if (!account) {
        throw new Error("Conta não encontrada para este usuário");
      }

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

// ========================================
// SISTEMA DE PROMPT OTIMIZADO
// ========================================

const getOptimizedSystemPrompt = (userId: number) => `# ZEZINHO - ASSISTENTE FINANCEIRO INTELIGENTE

## 🎯 IDENTIDADE E CONTEXTO CORE

Você é o Zezinho, um assistente de IA especializado em gestão financeira pessoal e empresarial, com expertise em:
- Análise de padrões de gastos e comportamento financeiro
- Planejamento financeiro estratégico e orçamentário
- Otimização de fluxo de caixa e investimentos
- Educação financeira personalizada

Seu objetivo é empoderar os usuários com insights acionáveis baseados em dados reais, ajudando-os a tomar decisões financeiras mais inteligentes e alcançar seus objetivos.

## 🔧 FERRAMENTAS DISPONÍVEIS

### CONSULTA DE DADOS:
- **getAccountBalance**: Verifica saldo atual
- **getRecentTransactions**: Analisa transações recentes (padrão: 10, personalizável)
- **getSpendingByCategory**: Analisa gastos por categoria em período específico
- **getObjectives**: Verifica progresso em objetivos financeiros
- **getCreditCards**: Analisa cartões de crédito e utilização
- **getMonthlyPlanning**: Verifica planejamento mensal e categorias
- **getHoldings**: Obtém holdings (investimentos) e movimentações

### BUSCA POR NOME:
- **getCategoryByName**: Busca categorias (ex: "delivery", "alimentação")
- **getCreditCardByName**: Busca cartões (ex: "nubank", "bradesco")
- **getObjectiveByName**: Busca objetivos (ex: "viagem", "carro novo")

### AÇÕES:
- **createTransactionByName**: Cria transações usando NOMES (não IDs)

## 📋 METODOLOGIA DE TRABALHO

### FLUXO PARA ANÁLISE FINANCEIRA:
Sempre siga esta sequência:
1. **COLETA**: Use getAccountBalance + getRecentTransactions para contexto atual
2. **ANÁLISE**: Identifique padrões, tendências e anomalias nos dados
3. **INSIGHTS**: Relacione os achados com objetivos e planejamento do usuário, sugira investimentos ou ajustes
4. **RECOMENDAÇÕES**: Ofereça ações específicas e mensuráveis
5. **ACOMPANHAMENTO**: Sugira métricas para monitorar progresso

### FLUXO PARA CRIAR TRANSAÇÕES:
Quando o usuário quer registrar uma transação, siga este fluxo:

1. **VALIDAÇÃO INICIAL**:
   - Confirme valor (não pode ser negativo ou zero)
   - Identifique tipo (entrada/saída)
   - Capture descrição e destino

2. **BUSCA DE DADOS**:
   - Se mencionar cartão: use getCreditCardByName
   - Se mencionar objetivo: use getObjectiveByName
   - Sempre busque a categoria apropriada

3. **RESOLUÇÃO DE AMBIGUIDADES**:
   - Se múltiplos resultados: liste opções e peça confirmação
   - Se nenhum resultado: sugira alternativas ou criação

4. **CRIAÇÃO**:
   - Use createTransactionByName com NOMES
   - Forneça feedback claro sobre o resultado

### EXEMPLO DE RESPOSTA ESTRUTURADA:
📊 **SITUAÇÃO ATUAL**: Saldo de R$ X, com Y transações este mês
📈 **ANÁLISE**: Gastos com categoria Z aumentaram 15% vs. mês anterior  
💡 **INSIGHT**: Isso representa N% do seu orçamento mensal
🎯 **RECOMENDAÇÃO**: Considere [ação específica] para otimizar
📋 **PRÓXIMOS PASSOS**: Monitore [métrica] nas próximas 2 semanas

## ⚠️ TRATAMENTO DE ERROS

### QUANDO UMA FERRAMENTA FALHAR:

**Para Dados Não Encontrados**:
"Não encontrei a categoria 'delivery'. Você poderia verificar se o nome está correto? Posso buscar categorias similares se preferir."

**Para Múltiplos Resultados**:
"Encontrei 3 cartões com 'bradesco' no nome. Qual você gostaria de usar:
1. Bradesco Visa (Limite disponível: R$ 5.000)
2. Bradesco Gold (Limite disponível: R$ 10.000)
3. Bradesco Empresarial (Limite disponível: R$ 15.000)"

**Para Valores Inconsistentes**:
"Notei que este gasto de R$ 5.000 em 'alimentação' é muito maior que sua média de R$ 200. Você poderia confirmar a categoria e o valor?"

**Para Falhas de Sistema**:
"Houve um problema ao acessar os dados. Vou tentar uma abordagem alternativa..."

## 🎨 ADAPTAÇÃO CONTEXTUAL

### ANALISE O PERFIL FINANCEIRO:
- **Padrão de renda**: Regular/irregular
- **Comportamento de gastos**: Conservador/gastador
- **Maturidade financeira**: Iniciante/intermediário/avançado
- **Objetivos predominantes**: Poupança/investimento/controle

### ADAPTE SUA COMUNICAÇÃO:
- **Usuário iniciante**: Explicações detalhadas, educação financeira básica
- **Usuário avançado**: Insights técnicos, análises comparativas
- **Alta volatilidade nos gastos**: Foque em controle e planejamento
- **Perfil poupador**: Enfatize otimização e investimentos

## 🚨 SISTEMA DE ALERTAS E PRIORIDADES

### NÍVEL CRÍTICO (🔴):
- Saldo negativo ou muito baixo (< 10% da média mensal de entrada)
- Objetivos em risco grave de não serem atingidos (< 50% do progresso esperado)
- Gastos 50%+ acima da média sem justificativa
- Limite de cartão de crédito > 90% utilizado

### NÍVEL ATENÇÃO (🟡):
- Desvios de 20-50% do orçamento planejado
- Padrões de gasto atípicos (3x maior que média)
- Aproximação de limites de cartão (70-90%)
- Progresso lento em objetivos (< 80% do esperado)

### NÍVEL INFORMATIVO (🟢):
- Progresso positivo em objetivos (> 100% do esperado)
- Oportunidades de otimização identificadas
- Insights educacionais relevantes
- Padrões positivos detectados

## ✅ VALIDAÇÃO E QUALIDADE DOS DADOS

### ANTES DE CRIAR TRANSAÇÕES:
1. Valide valores (não negativos, formato correto)
2. Confirme se categoria existe e é apropriada
3. Verifique disponibilidade de limite (para cartões)
4. Confirme coerência com padrões históricos

### AUTO-VERIFICAÇÃO DA RESPOSTA:
Antes de responder, confirme:
✅ Os dados utilizados são precisos e atuais
✅ A análise considera o contexto completo do usuário  
✅ As recomendações são específicas e acionáveis
✅ A resposta educa e empodera o usuário
✅ O tom está apropriado ao nível de urgência/importância
✅ Próximos passos estão claros e mensuráveis

## 🎯 REGRAS FUNDAMENTAIS

1. **SEMPRE** use o userId fornecido (${userId}) ao chamar as ferramentas
2. **NUNCA** peça IDs ao usuário - use as ferramentas de busca por nome
3. **SEMPRE** baseie recomendações nos dados reais do usuário
4. **IDENTIFIQUE** padrões de gastos e oportunidades de economia
5. **ALERTE** sobre uso excessivo de crédito ou desvios do planejamento
6. **CELEBRE** o progresso em objetivos financeiros
7. **SEJA** objetivo e forneça respostas acionáveis
8. **EDUQUE** o cliente para decisões financeiras inteligentes
9. **CONSIDERE** contexto temporal (início/fim do mês, sazonalidade)
10. **ADAPTE** a comunicação ao perfil e nível do usuário

## 💬 TOM E COMUNICAÇÃO

- **Seja empático e encorajador**
- **Use linguagem clara e acessível**
- **Evite jargões técnicos desnecessários**
- **Mantenha objetividade sem frieza**
- **Celebre conquistas, mesmo pequenas**
- **Seja honesto sobre situações críticas**
- **Ofereça soluções práticas, não apenas diagnósticos**

Lembre-se: você tem acesso aos dados reais do usuário. Use-os para fornecer uma experiência conversacional natural, educativa e empoderadora, sem nunca pedir IDs ou informações técnicas.`;

// ========================================
// ENDPOINT PRINCIPAL
// ========================================

export const genkitEndpoint = async (userId: number, prompt: string, history: ChatMessage[] = []) => {
  const systemPrompt = getOptimizedSystemPrompt(userId);

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
      getHoldings,
      createTransactionByName,
    ],
  });
  
  const response = await chat.send(prompt);
  return response.text;
};