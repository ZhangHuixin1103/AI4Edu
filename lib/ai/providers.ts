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
    console.error('%c[STREAM] Fetch error:', 'color: red;', await response.text());
    return response;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') || !response.body) {
    console.warn('%c[STREAM] No event-stream or empty body', 'color: orange;');
    return response;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let closed = false;

      try {
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('%c[STREAM] Reader done, emitting final DONE and closing', 'color: green;');
            // Emit a final DONE event for SDK compatibility
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
            break;
          }

          if (!value) continue;
          const chunkText = decoder.decode(value, { stream: true });
          console.log('%c[STREAM] Raw chunk received:', 'color: green;', chunkText.length, 'bytes');
          buffer += chunkText;

          const events = buffer.split('\n\n');
          buffer = events.pop()?.trim() || '';  // Trim partial buffer for safety

          for (const event of events) {
            if (event.trim() === '') continue;
            if (!event.startsWith('data: ')) {
              console.debug('%c[STREAM] Skipping non-data event:', 'color: blue;', event.substring(0, 50));
              continue;
            }

            const dataLine = event.replace(/^data:\s*/, '').trim();
            if (!dataLine) continue;

            if (dataLine === '[DONE]') {
              console.log('%c[STREAM] DONE received, closing stream', 'color: green;');
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              closed = true;
              break;
            }

            // Re-emit as SSE without re-parsing (backend is OpenAI-compatible)
            // If needed, parse and modify: const chunk = JSON.parse(dataLine); /* edit */ const newJson = JSON.stringify(chunk);
            const sseChunk = `data: ${dataLine}\n\n`;
            console.log('%c[STREAM] Emitting SSE chunk:', 'color: green;', dataLine.substring(0, 100) + '...');  // Log first 100 chars
            controller.enqueue(new TextEncoder().encode(sseChunk));
          }
        }
      } catch (err) {
        console.error('%c[STREAM] Error during read loop:', 'color: red;', err);
        controller.error(err);
      } finally {
        console.log('%c[STREAM] Releasing reader lock', 'color: green;');
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
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