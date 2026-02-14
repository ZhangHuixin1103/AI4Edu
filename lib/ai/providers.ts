import { deepinfra } from "@ai-sdk/deepinfra";
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';
import { createOllama } from 'ollama-ai-provider-v2';
import { createOpenAI } from '@ai-sdk/openai';
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
  const response = await fetch(urlString, init);
  if (!response.ok) {
    const errorText = await response.clone().text();
    console.error("[STREAM] Fetch error:", errorText);
    return response;
  }

  return response;
};

let base = process.env.OLLAMA_BASE_URL || "";
base = base.replace(/\/+$/, "");
if (!base.endsWith("/api")) {
  base = `${base}/api`;
}

const ollamaProvider = createOllama({
  baseURL: base,
  fetch: customFetch,
});

const vllmProvider = createOpenAI({
  baseURL: process.env.VLLM_BASE_URL || "http://localhost:8001/v1",
  apiKey: "EMPTY",
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
  "Llama-3.1-Math": vllmProvider("Qwen3-32B-SFT"),
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
