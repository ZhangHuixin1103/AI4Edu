export const defaultModel: string = "Llama-3.3";

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'Llama-3.3',
    name: 'Llama',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'Gemini-1.5',
    name: 'Gemini',
    description: 'Uses advanced reasoning',
  },
  {
    id: 'Qwen-2.5',
    name: 'Qwen',
    description: 'Primary chat model',
  }
];
