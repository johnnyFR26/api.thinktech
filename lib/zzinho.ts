import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit/beta';
import { z } from 'genkit'

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.0-flash'),
});

const getWeather = ai.defineTool(
  {
    name: "getWeather",
    description: "Gets the current weather in a given location",
    inputSchema: z.object({
      location: z
        .string()
        .describe("The location to get the current weather for"),
    }),
    outputSchema: z.object({
      temperature: z
        .number()
        .describe("The current temperature in degrees Fahrenheit"),
      condition: z
        .enum(["sunny", "cloudy", "rainy", "snowy"])
        .describe("The current weather condition"),
    }),
  },
  async ({ location }) => {
    const randomTemp = Math.floor(Math.random() * 30) + 50;
    const conditions = ["sunny", "cloudy", "rainy", "snowy"] as const;
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    return { temperature: randomTemp, condition: randomCondition };
  }
);

const rollDice = ai.defineTool(
  {
    name: "rollDice",
    description: "Rolls a six-sided die",
    outputSchema: z.number().int().min(1).max(6),
  },
  async () => {
    return Math.floor(Math.random() * 6) + 1;
  }
);

// Simplifique: não passe mensagens vazias ou system no chat
export const genkitEndpoint = async (prompt: string) => {
  const systemPrompt = `Você é o Zezinho, um especialista em finanças e na plataforma Finanz(aplicativo de gestão financeira)
seu objetivo é ajudar os seus clientes a tomar decisões financieras inteligentes e otimizadas, ajudando-os a alcancar seus objetivos financeiros de forma eficiente e segura.
Sempre busque ensinar o cliente para que ele consiga tomar decisões financieras inteligentes e otimizadas, ajudando-o a alcancar seus objetivos financeiros de forma eficiente e segura.
Dê respostas eficientes e objetivas`;

  const chat = ai.chat({ 
    system: systemPrompt,
    tools: [getWeather, rollDice] 
  });
  
  const response = await chat.send(prompt);
  return response.text;
};