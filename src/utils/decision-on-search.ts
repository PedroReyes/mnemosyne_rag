// TODO: Worthy to update it? There are many deprecated things
import { Ollama } from '@langchain/community/llms/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

import type { SearchResult } from '../types';

// eslint-disable-next-line no-console -- whatever
export const decisionOnSearch = (results: SearchResult[]): void => {
  // eslint-disable-next-line no-restricted-syntax -- whatever
  for (const [, score] of results) {
    if (score > 1) {
      // eslint-disable-next-line no-console -- whatever
      console.log(
        '⚠️ The documentation may be outdated. Please, consider updating it.',
      );
      // We can break here since we only need to show the message once
      break;
    }
  }
};

// TODO: All this code below probably is better to start from scratch in order
// TODO: to implement the business AI logic that is in prompt.md
export enum YesNoAnswer {
  No = 'no',
  Unknown = 'unknown', // For ambiguous or malformed answers
  Yes = 'yes',
}

interface AskYesNoOptions {
  modelName?: string; // defaults to "llama3"
  question: string;
}

export async function askYesNoQuestion({
  modelName = 'llama3',
  question,
}: AskYesNoOptions): Promise<YesNoAnswer> {
  const model = new Ollama({
    model: modelName,
    temperature: 0,
  });

  const prompt = PromptTemplate.fromTemplate(
    `
Answer strictly with "yes" or "no". Do not provide any explanation or rephrase the question.

Question: {question}
Answer:`.trim(),
  );

  const chain = new LLMChain({ llm: model, prompt });

  const result = await chain.call({ question });
  const raw = result.text.trim().toLowerCase();

  // Normalize and validate
  if (['yes', 'sí', 'si'].includes(raw)) return YesNoAnswer.Yes;
  if (['no'].includes(raw)) return YesNoAnswer.No;

  return YesNoAnswer.Unknown;
}
