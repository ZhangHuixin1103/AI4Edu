import { deepinfra } from "@ai-sdk/deepinfra";
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { createOllama } from 'ollama-ai-provider-v2';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const urlString = typeof input === 'string' ? input : input.toString();
  // Replace /chat with /v1/chat/completions for OpenAI-compatible endpoint
  const correctedUrl = urlString.replace(/\/chat(\/|$)/, '/v1/chat/completions$1');
  console.log('Original URL:', urlString);
  console.log('Corrected URL:', correctedUrl);
  console.log('Request Body:', init?.body);

  const response = await fetch(correctedUrl, init);
  if (!response.ok) {
    console.error('Fetch error:', await response.text());
    return response;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    return response;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Split on \n\n for complete SSE events
          const events = buffer.split('\n\n');
          buffer = events.pop() || ''; // Keep incomplete event

          for (const event of events) {
            if (closed) break;
            const lines = event.split('\n').filter(line => line.startsWith('data: '));
            for (const line of lines) {
              const jsonText = line.replace(/^data:\s*/, '').trim();
              if (!jsonText) continue;
              if (jsonText === '[DONE]') {
                if (!closed) {
                  controller.close();
                  closed = true;
                }
                continue; // Process remaining lines in the event
              }
              try {
                const chunk = JSON.parse(jsonText);
                if (!closed) {
                  controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
                }
              } catch (err) {
                console.warn('JSON parse error in main loop:', jsonText, err);
              }
            }
          }
        }

        // Process residual buffer
        if (buffer.trim() && !closed) {
          const events = buffer.split('\n\n');
          for (const event of events) {
            if (closed) break;
            const lines = event.split('\n').filter(line => line.startsWith('data: '));
            for (const line of lines) {
              const jsonText = line.replace(/^data:\s*/, '').trim();
              if (!jsonText) continue;
              if (jsonText === '[DONE]') {
                if (!closed) {
                  controller.close();
                  closed = true;
                }
                continue;
              }
              try {
                const chunk = JSON.parse(jsonText);
                if (!closed) {
                  controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
                }
              } catch (err) {
                console.warn('JSON parse error in residual buffer:', jsonText, err);
              }
            }
          }
        }

        if (!closed) {
          controller.close();
          closed = true;
        }
      } catch (err) {
        if (!closed) {
          console.error('Stream processing error:', err);
          controller.error(err);
        }
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
};

const ollamaProvider = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL, // https://tamu-ta.tamu.ngrok.app/v1
  compatibility: "strict",
  fetch: customFetch,
});

const languageModels = {
  "Llama-3.3": wrapLanguageModel({
    middleware: extractReasoningMiddleware({
      tagName: "think",
    }),
    model: deepinfra("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
  }),
  "Qwen-2.5": deepinfra("Qwen/Qwen2.5-72B-Instruct"),
  "Gemini-1.5": wrapLanguageModel({
    middleware: extractReasoningMiddleware({
      tagName: "think",
    }),
    model: google("gemini-1.5-pro"),
  }),
  "Llama-3.1-Math": wrapLanguageModel({
    middleware: extractReasoningMiddleware({
      tagName: "think",
    }),
    model: ollamaProvider("llama-math"),
  }),
  'title-model': deepinfra("Qwen/Qwen2.5-72B-Instruct"),
  'artifact-model': deepinfra("meta-llama/Llama-3.3-70B-Instruct-Turbo"),
};

export const myProvider = isTestEnvironment
  ? customProvider({
    languageModels: {
      'Llama-3.3': reasoningModel,
      'Qwen-2.5': chatModel,
      'Gemini-1.5': reasoningModel,
      'Llama-3.1-Math': chatModel,
      'title-model': titleModel,
      'artifact-model': artifactModel,
    },
  })
  : customProvider({
    languageModels,
    imageModels: {
      'image-model': xai.image('grok-2-image'),
    },
  });

export type modelID = keyof typeof languageModels;

export const MODELS = Object.keys(languageModels);

export const defaultModel: modelID = "Llama-3.1-Math";