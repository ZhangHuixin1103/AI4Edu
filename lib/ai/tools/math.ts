import { tool } from "ai";
import * as mathjs from 'mathjs';
import { z } from "zod";

export const mathTool = tool({
  description: 'A tool for evaluating mathematical expressions.',
  parameters: z.object({ expression: z.string() }),
  execute: async ({ expression }) => mathjs.evaluate(expression),
});
