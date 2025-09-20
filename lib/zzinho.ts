import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from 'genkit'
import { db } from '../lib/db'

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

const helloFlow = ai.defineFlow('helloFlow', async (name) => {
  const { text } = await ai.generate(`Hello Gemini, my name is ${name}`);
  console.log(text);
});

export const getUserInfoTool = ai.defineTool(
    {
        name: 'getUserInfo',
        description: 'Get user info',
        inputSchema: z.object({
            email: z.string().describe('User email')
        }),
        outputSchema: z.object({
            name: z.string().describe('User name'),
            email: z.string().email().describe('User email'),
            cpf: z.string().describe('User cpf'),
            phone: z.string().describe('User phone'),          
        })
    },
    async (input) => {
        const user = await db.user.findUnique({
           where: {email: input.email},
           include: {
               account: {
                   include: {
                       categories: {
                           include: {
                               transactions: true
                           }
                       }
                   }
               }
           } 
        })

        return user
    }
)

const userInfoFlow = ai.defineFlow('userInfoFlow', async (input) => {
  const userInfo = await getUserInfoTool(input);
  console.log(userInfo);
  const { text } = await ai.generate(`Hello Gemini, my name is ${userInfo.name}, how can i be more rich? my account is ${userInfo}`);
  console.log(text);
});

userInfoFlow({ email: 'johnny.rabelo.cf@gmail.com' });