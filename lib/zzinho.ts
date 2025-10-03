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
    // Fake weather data
    const randomTemp = Math.floor(Math.random() * 30) + 50; // Random temp between 50 and 80
    const conditions = ["sunny", "cloudy", "rainy", "snowy"] as any;
    const randomCondition =
      conditions[Math.floor(Math.random() * conditions.length)];

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

export const genkitEndpoint = (async ({ system, messages, prompt }) => {
  const chat = ai.chat({ system, messages, tools: [getWeather, rollDice] });
  return chat.sendStream({ prompt });
});