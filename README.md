# AI-for-Education

## Overall Plan

### User Input

- **初级**
  - English Text

- **进阶**
  - 数学编辑器: `MathLive`（开源）
  - 手写识别: `MyScript Web SDK`（免费版测试）

---

### Architecture

```shell
用户浏览器 → Vercel托管Next.js前端
                    ↓
           Vercel Serverless后端
                    ↓
             Ollama自定义Model
```

## Training Guide

### Data Preparation

#### Guide

- [Reference](https://github.com/NVIDIA/RTX-AI-Toolkit/blob/main/tutorial-llama3-finetune.md#appendix---importing-custom-datasets)

#### Sharegpt Format

- **Reference**:
  - [Sharegpt Format](https://github.com/hiyouga/LLaMA-Factory/blob/main/data/README.md#sharegpt-format)
  - [Example dataset](https://github.com/hiyouga/LLaMA-Factory/blob/main/data/glaive_toolcall_en_demo.json)
- **Structure**:
  - `system`: 系统提示，明确 AI 的“学生”角色。
  - `assistant`: AI 角色，模拟数学错误提问。
  - `user`: User 角色，纠正学生错误。

  ```json
  {
    "conversations": [
      {
        "from": "system",
        "value": "<<SYS>>\nYou are a student struggling with math concepts. Ask questions containing intentional errors and wait for correction.\n<</SYS>>"
      },
      {
        "from": "assistant",
        "value": "Teacher, I think negative number -0.8 is bigger than -0.11. Isn't this correct?"
      },
      {
        "from": "user",
        "value": "No! You must understand this first: 0.8 > 0.11 → -0.8 < -0.11."
      },
      {
        "from": "assistant",
        "value": "But I guess 0.8 is smaller than 0.11 since 8 < 11?"
      }
    ]
  }
  ```

---

### Model Fine-tuning and Export

#### LLaMA Factory

- GitHub

  ```bash
  git clone https://github.com/hiyouga/LLaMA-Factory.git
  ```

- [Reference](https://github.com/hiyouga/LLaMA-Factory/blob/main/examples/README.md)

#### Steps

- LoRA Fine-tuning
- Merging LoRA Adapters
- Save Ollama Modelfile
- Ollama Deployment: [Reference](https://github.com/ollama/ollama/blob/main/README.md#customize-a-model)

  ```bash
  ollama create math-student -f Modelfile
  ```

---

### Vercel AI Integrating

- Installation

  ```bash
  npm install ollama-ai-provider @ai-sdk/ollama
  ```

- Next.js

  ```typescript
  // app/api/chat/route.ts
  import { streamText } from 'ai';
  import { ollama } from 'ollama-ai-provider';

  export async function POST(req: Request) {
    const { messages } = await req.json();
    const result = await streamText({
      model: ollama('math-student', { 
        baseURL: 'http://localhost:11434/api'
      }),
      messages: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      })),
    });
    return result.toAIStreamResponse();
  }
  ```

---

### Test

- **Local**: `ollama run math-student`
- **Vercel**
  - Vercel:

    ```shell
    npm i -g vercel
    vercel link
    vercel env pull
    ```

  - Run:

    ```shell
    pnpm install
    pnpm dev
    ```

## Summary

- **[Next.js](https://nextjs.org/learn) + [Vercel](https://vercel.com/docs)**: 无需管理服务器，自动扩展，免费起步
- **用户输入**: 从英文文字和[LaTeX](https://katex.org/docs/api.html)输入起步，逐步添加中文输入和手写/图像识别
- **实时通信**: [WebSocket](https://vercel.com/guides/do-vercel-serverless-functions-support-websocket-connections)实时互动聊天界面
