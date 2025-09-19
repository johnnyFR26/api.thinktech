import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

const helloFlow = ai.defineFlow('helloFlow', async (name) => {
  const { text } = await ai.generate(`Hello Gemini, my name is ${name}`);
  console.log(text);
});
