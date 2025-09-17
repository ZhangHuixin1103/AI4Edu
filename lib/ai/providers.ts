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
  const urlString = typeof input === "string" ? input : input.toString();
  const correctedUrl = urlString.replace(/\/chat(\/|$)/, "/v1/chat/completions$1");

  const response = await fetch(correctedUrl, init);
  if (!response.ok) {
    console.error("[STREAM] Fetch error:", await response.text());
    return response;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/event-stream") || !response.body) {
    console.warn("[STREAM] No event-stream or empty body");
    return response;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let closed = false;

      try {
        while (!closed) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[STREAM] Reader done, breaking loop");
            break; // 不再 close，由 [DONE] 分支统一负责
          }

          if (!value) continue;
          const chunkText = decoder.decode(value, { stream: true });
          console.log("[STREAM] Raw chunk received:", chunkText.length, "bytes");
          buffer += chunkText;

          const events = buffer.split("\n\n");
          buffer = events.pop()?.trim() || ""; // 保留未完整的部分

          for (const event of events) {
            if (!event.startsWith("data: ")) {
              console.debug("[STREAM] Skipping non-data event:", event.substring(0, 50));
              continue;
            }

            const dataLine = event.replace(/^data:\s*/, "").trim();
            if (!dataLine) continue;

            if (dataLine === "[DONE]") {
              console.log("[STREAM] DONE received, closing stream");
              if (!closed) {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                controller.close();
                closed = true;
              }
              break;
            }

            try {
              const chunk = JSON.parse(dataLine);
              console.log("[STREAM] Parsed chunk:", {
                id: chunk.id,
                role: chunk?.choices?.[0]?.delta?.role,
                content: chunk?.choices?.[0]?.delta?.content ?? "",
                finish_reason: chunk?.choices?.[0]?.finish_reason,
              });

              if (!closed) {
                const sseChunk = `data: ${JSON.stringify(chunk)}\n\n`;
                controller.enqueue(new TextEncoder().encode(sseChunk));
              }
            } catch (err) {
              console.warn("[STREAM] JSON parse error, skipping:", dataLine.substring(0, 100), err);
              continue; // 直接跳过错误行
            }
          }
        }
      } catch (err) {
        console.error("[STREAM] Error during read loop:", err);
        if (!closed) controller.error(err);
      } finally {
        console.log("[STREAM] Releasing reader lock");
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
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