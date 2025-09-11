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
  // Ollama's strict compatibility mode requires the OpenAI-compatible `/v1/chat/completions` endpoint.
  const correctedUrl = urlString.replace(/\/chat(\/|$)/, '/v1/chat/completions$1');

  const response = await fetch(correctedUrl, init);
  if (!response.ok) {
    console.error('Fetch error:', await response.text());
    return response;
  }

  // Ensure the response is a stream and has a body before proceeding.
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
      // The main processing function to be called recursively.
      const processText = async () => {
        try {
          const { done, value } = await reader.read();
          if (done) {
            // If the source stream ends without a `[DONE]` message, we close our controller.
            if (!closed) {
              controller.close();
              closed = true;
            }
            return;
          }

          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const event of events) {
            const lines = event.split('\n').filter(line => line.startsWith('data: '));
            for (const line of lines) {
              const jsonText = line.replace(/^data:\s*/, '').trim();
              if (!jsonText) continue;

              if (jsonText === '[DONE]') {
                // ✅ **CRITICAL FIX**: Immediately terminate the entire `start` function.
                if (!closed) {
                  controller.close();
                  closed = true;
                }
                return; // This exits the entire processing logic.
              }

              // It is crucial to check `closed` here before enqueueing.
              if (closed) {
                  console.warn('Attempted to enqueue chunk after stream was closed:', jsonText);
                  continue; // Skip if closed.
              }

              try {
                const chunk = JSON.parse(jsonText);
                controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
              } catch (err) {
                console.warn('JSON parse error:', jsonText, err);
              }
            }
          }
          
          // If not closed, continue reading the stream.
          if (!closed) {
            await processText();
          }

        } catch (err) {
          if (!closed) {
            console.error('Stream processing error:', err);
            controller.error(err);
          }
        }
      };

      // Start processing and ensure resources are released in the end.
      processText().finally(() => {
        if (!closed) {
          controller.close();
          closed = true;
        }
        reader.releaseLock();
      });
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