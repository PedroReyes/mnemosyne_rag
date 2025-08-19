import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";

import type { SearchResult } from "../types";
import { ModelName } from "../db/rag-handler";
import { logInfo } from "./logging";
import { readFile } from "fs/promises";

export const generateResponse = async (
    model: ModelName,
    question: string,
    searchResult: SearchResult
): Promise<string> => {
    // Smart file content context selection
    const filePath = searchResult[0].metadata.source;
    const contextContent = await getContextContent(
        filePath,
        searchResult[0].pageContent
    );

    // Remove duplicate block below (if present)

    const safeContextContent = validStringWithCurlyBraces(contextContent);
    const prompt = PromptTemplate.fromTemplate(
        `
            Try to be very concise in your answer. You will have provide your answer solely based on the next context provided:
            - Score: ${searchResult[0].metadata.score}
            - Source filepath: ${searchResult[0].metadata.source}
            - Source location within the file: ${searchResult[0].metadata.loc}
            - File content context:\n ${safeContextContent}

            Question: {question}
            Answer:`.trim()
    );

    if (true) {
        console.log("--------------------------------------");
        // console.log(prompt);
        console.log(`${JSON.stringify(searchResult, null, 2)}`);
        console.log(`Score: ${searchResult[1]}`);
        console.log(contextContent);
        console.log("--------------------------------------");
    }

    const llm = new Ollama({
        model,
        temperature: 0,
    });

    // Pre-processing: uppercase the question
    const toUpperCase = RunnableLambda.from((input: { question: string }) => ({
        question: input.question.toUpperCase(),
    }));

    // Prompt step
    const promptStep = prompt;

    // LLM step
    const llmStep = llm;

    // Post-processing: append signature
    const addSignature = RunnableLambda.from(
        (output: string) => output + "\n\n⚙️  Author: AI"
    );

    // Post-processing: adding at the beginning the source of the answer
    const addSource = RunnableLambda.from((output: string) => {
        const source = searchResult[0].metadata.source;
        return `${output}\n🔗 Source: ${source}`;
    });

    // Compose the chain: toUpperCase -> prompt -> llm -> addSignature -> replaceNumbers
    const chain = RunnableSequence.from([
        toUpperCase,
        promptStep,
        llmStep,
        addSignature,
        addSource,
    ]);

    const result = await chain.invoke({ question });
    const raw =
        typeof result === "string" ? result.trim() : String(result).trim();
    return raw;
};

// Extract context content from fileContent based on pageContent and word limits
async function getContextContent(
    filePath: string,
    pageContent: string
): Promise<string> {
    let fileContent = "";
    try {
        fileContent = await readFile(filePath, "utf-8");
    } catch (error) {
        logInfo(`Failed to read file at ${filePath}: ${error}`);
    }

    if (!filePath || typeof filePath !== "string") {
        return "❌ Error retrieving file content";
    }

    const words = fileContent.split(/\s+/);

    if (words.length > 1000) {
        const pageWords = pageContent.split(/\s+/);
        let firstIdx = -1;
        let lastIdx = -1;
        for (let i = 0; i < words.length; i++) {
            if (pageWords.includes(words[i])) {
                if (firstIdx === -1) firstIdx = i;
                lastIdx = i;
            }
        }
        if (firstIdx !== -1 && lastIdx !== -1) {
            const start = Math.max(0, firstIdx - 50);
            const end = Math.min(words.length, lastIdx + 51);
            return words.slice(start, end).join(" ");
        } else {
            return words.slice(0, 100).join(" ");
        }
    }
    return fileContent;
}

// Escapes curly braces for PromptTemplate compatibility
function validStringWithCurlyBraces(str: string): string {
    return str.replace(/[{]/g, "{{").replace(/[}]/g, "}}");
}
