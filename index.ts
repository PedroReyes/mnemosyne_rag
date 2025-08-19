/* eslint-disable no-console -- whatever */

import { RagHandler } from "./src/db/rag-handler";
import { generateResponse } from "./src/utils/decision-on-search";
import { logError, logInfo } from "./src/utils/logging";

type VECTOR_DATABASE_TYPE = "faiss" | "qdrant";
const VECTOR_DATABASE: VECTOR_DATABASE_TYPE = "qdrant";

import { parseArg } from "./src/utils/parse-arg";
import { SearchResult } from "./src/types";

export const DEBUG = true;

const main = async () => {
    const brainDir = parseArg("brain");
    const userQuestion = parseArg("request");
    const shouldReload = process.argv.includes("--reload");
    const collectionName = parseArg("collection");

    // Example: received arguments
    if (brainDir || userQuestion) {
        logInfo(`--brain argument received: ${brainDir}`);
        logInfo(`--request argument received: ${userQuestion}`);
    }

    const ragHandler = new RagHandler({
        model: "llama3",
        path: brainDir || "/Users/pedreyes/Documents/brain",
        reload: shouldReload,
        collection: collectionName,
    });

    // NOTE: Executed on each commit locally
    await ragHandler.loadVectorStore(VECTOR_DATABASE);

    if (brainDir && userQuestion) {
        // await ragHandler.loadCustomPath(customPath);
        logInfo(`Custom path loaded: ${ragHandler.path}`);

        const results = await ragHandler.search(userQuestion, 3);
        const bestResult: SearchResult = results[0];

        // TODO: We could provide the other files that were probably relevant
        // logInfo(
        //     `Results for the question "${userQuestion}":\n`,
        //     results1.map(([doc, score]) => ({
        //         filename: doc.metadata.source,
        //         score,
        //         content: doc.pageContent,
        //     }))
        // );

        const answer = await generateResponse(
            ragHandler.model,
            userQuestion,
            bestResult
        );
        console.log(answer);

        return;
    }
};

main().catch((err) => {
    logError(err);
});
