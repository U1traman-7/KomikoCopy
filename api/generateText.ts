/* eslint-disable */
// export const dynamic = 'force-dynamic'; // static by default, unless reading the request

import { parse } from 'cookie';
import { decode } from 'next-auth/jwt';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://komiko.app', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'KomikoAI', // Optional. Site title for rankings on openrouter.ai.
  },
});

export async function POST(request: Request) {
  try {
    const { prompt, noNeedLogin } = await request.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
      });
    }

    if (!noNeedLogin) {
      // Parse cookies from the request headers
      const cookies = parse(request.headers.get('cookie') || '');
      const sessionToken = cookies['next-auth.session-token'];
      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Log in to continue' }), {
          status: 401,
        });
      }
      const token = await decode({
        token: sessionToken,
        secret: process.env.NEXTAUTH_SECRET!,
      });
      if (!token) {
        return new Response(JSON.stringify({ error: 'Invalid login status' }), {
          status: 401,
        });
      }
    }

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'x-ai/grok-4-fast',
    });

    const output = completion.choices[0].message.content;

    // // https://freeai.openai.azure.com/openai/deployments/gpt-4o-mini/chat/completions?api-version=2023-03-15-preview
    // const deployment = "gpt-4o-mini";
    // const apiVersion = "2024-02-15-preview";
    // const client = new AzureOpenAI(
    //     {
    //         endpoint: "https://dalleinstant.openai.azure.com/",
    //         apiKey: process.env.azure_chatgpt_api_key,
    //         deployment: deployment,
    //         apiVersion: apiVersion,
    //         // dangerouslyAllowBrowser: true
    //     }
    // );
    // const result = await client.chat.completions.create({
    //     messages: [
    //         { role: "user", content: prompt },
    //     ],
    //     model: '',
    // });

    // const output = result.choices[0].message.content;

    // const generationConfig = {
    //     temperature: 1,
    //     topP: 0.95,
    //     topK: 40,
    //     maxOutputTokens: 8192,
    //     responseMimeType: "text/plain",
    // };
    // const chatSession = model.startChat({
    //     generationConfig,
    //     history: [
    //     ],
    // });

    // const result = await chatSession.sendMessage(prompt);
    // const output = result.response.text();

    return new Response(JSON.stringify(output), {
      status: 200,
    });
  } catch (error) {
    console.error('Error generating text:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate text' }), {
      status: 500,
    });
  }
}
