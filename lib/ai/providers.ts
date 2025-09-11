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
      try {
        // Continue reading from the stream until it's explicitly closed.
        while (!closed) {
          const { done, value } = await reader.read();

          // If the original source stream is finished, break the loop.
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // SSE events are separated by double newlines. Split them.
          const events = buffer.split('\n\n');
          // The last item might be an incomplete event, so keep it in the buffer for the next read.
          buffer = events.pop() || '';

          for (const event of events) {
            // If the stream was closed in a previous iteration, stop processing new events.
            if (closed) break;

            const lines = event.split('\n').filter(line => line.startsWith('data: '));
            for (const line of lines) {
              const jsonText = line.replace(/^data:\s*/, '').trim();
              if (!jsonText) continue;

              // The '[DONE]' message signifies the end of the stream.
              if (jsonText === '[DONE]') {
                controller.close();
                closed = true;
                // **CRITICAL FIX**: Immediately break out of the inner loop to stop processing any more lines.
                break;
              }

              try {
                const chunk = JSON.parse(jsonText);
                // Enqueue the parsed data chunk to our new stream.
                controller.enqueue(new TextEncoder().encode(JSON.stringify(chunk) + '\n'));
              } catch (err) {
                console.warn('JSON parse error:', jsonText, err);
              }
            }
          }
        }
      } catch (err) {
        // Handle any unexpected errors during stream processing.
        if (!closed) {
          console.error('Stream processing error:', err);
          controller.error(err);
        }
      } finally {
        // This block ensures the stream is always properly closed and resources are released,
        // even if the stream ends without a '[DONE]' message.
        if (!closed) {
          controller.close();
        }
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