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
  const correctedUrl = urlString.replace(/\/chat(\/|$)/, '/v1/chat/completions$1');

  const response = await fetch(correctedUrl, init);
  if (!response.ok) {
    console.error('Fetch error:', await response.text());
    return response;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    return response;
  }

  const stream = new ReadableStream({
    async start(controller) {
      // All stream-related variables are encapsulated within the 'start' function.
      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // An async IIFE (Immediately Invoked Function Expression) to handle the processing loop.
      // This allows us to use a clean try/catch/finally structure for resource management.
      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            // If the underlying stream from fetch is finished, exit the loop.
            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // Keep the last, possibly incomplete, event.

            for (const event of events) {
              if (!event.startsWith('data: ')) {
                continue;
              }

              const jsonText = event.replace(/^data:\s*/, '').trim();
              if (!jsonText) {
                continue;
              }

              // When the '[DONE]' message is received, we exit the loop immediately.
              // This is the clean exit strategy from the other person's code.
              if (jsonText === '[DONE]') {
                return; // Exit the async IIFE entirely.
              }

              try {
                const chunk = JSON.parse(jsonText);
                controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
              } catch (err) {
                console.warn('JSON parse error in stream chunk:', jsonText, err);
              }
            }
          }
        } catch (err) {
          // If any error occurs during the read loop, propagate it to the controller.
          controller.error(err);
        } finally {
          // This block is guaranteed to execute, ensuring the stream is always closed
          // and the reader lock is released, preventing memory leaks.
          // This is the most robust way to handle cleanup.
          controller.close();
          reader.releaseLock();
        }
      })();
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