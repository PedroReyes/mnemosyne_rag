/* eslint-disable no-console -- whatever */

import { getProjectRoot } from "./src/db/config";
import { RagHandler } from "./src/db/rag-handler";
import { decisionOnSearch } from "./src/utils/decision-on-search";
import { formatSimilarity } from "./src/utils/format";
import { getCommitDiff } from "./src/utils/git-details";

import { execSync } from "child_process";

// TODO: Take a commit hash as an argument to the script and:
// - get the file names,
// - the file contents,
// - and the file paths from the commit hash.
// And response with:
// - `Lack of documentation according to documentation threshold`
// - or `Documentation threshold is good`
// Ask the user if he wants to proceed with the commit or not.
// If the user decides to not proceed, then suggest either the documentation files
// that are closer to the changes done in the commit or if the threshold is not
// good enough, then suggest the creation of documentation files.
// TODO: git commit -m "feat(rag) - research on RAG requests - diff filenames, diff file contents, diff file differences, diff file dependencies, and AI"
type VECTOR_DATABASE_TYPE = "faiss" | "qdrant";
const VECTOR_DATABASE: VECTOR_DATABASE_TYPE = "qdrant";
const main = async () => {
    const customPath = process.argv[2];

    const ragHandler = new RagHandler({
        model: "llama3",
        path: customPath,
    });

    let projectRoot: string = getProjectRoot();

    console.log(`Project root directory: ${projectRoot}`);

    // NOTE: Executed on each commit in local
    await ragHandler.loadVectorStore(VECTOR_DATABASE);

    if (ragHandler.vectorStore) {
        // Get last 20 non-merge commit hashes from remote (origin/main)
        let commitHashes: string[] = [];
        try {
            // Fetch latest from remote
            execSync("git fetch origin master", { stdio: "ignore" });
            // Get last 20 non-merge commit hashes from origin/master
            const log = execSync(
                'git log origin/master --no-merges --pretty=format:"%H" -n 20',
                { encoding: "utf-8" }
            );
            commitHashes = log.split("\n").filter(Boolean);
        } catch (err) {
            console.error("Error fetching commit hashes:", err);
            return;
        }

        for (const commitHash of commitHashes) {
            console.log(`\n===== Processing commit: ${commitHash} =====`);
            const commitDetails = await getCommitDiff(commitHash);
            for (const file of commitDetails) {
                const commitFilePathChanged = file.path;
                const commitFileDiffChanged = file.diff;
                const gitDiffResults = await ragHandler.search(
                    commitFilePathChanged,
                    1
                );
                if (gitDiffResults.length > 0) {
                    const [doc, score] = gitDiffResults[0];
                    const docFilename = doc.metadata.source as string;
                    console.log(
                        formatSimilarity(
                            score,
                            commitFilePathChanged,
                            docFilename,
                            projectRoot
                        )
                    );
                }
                // TODO: See the prompt.md to know what exactly is the next step
                // const query = `Given the commit ${commitHash}, this file ${commitFilePathChanged} has the next changes: \n\n${commitFileDiffChanged}\n\n I want you to tell me whether or not given the scores which `;
                // const query = `Given the name for the next files could you tell me create a list of which are related so it wou`;
                // TODO: See the prompt.md to know what exactly is the next step
                // askYesNoQuestion({ modelName: 'ollama3', question: query });
                // decisionOnSearch(gitDiffResults);
            }
        }
        return;

        const results1 = await ragHandler.search(
            "Who made this Artificial Intelligence?",
            3
        );
        decisionOnSearch(results1);

        const results2 = await ragHandler.search(
            "What can you tell me about referrals?",
            3
        );
        decisionOnSearch(results2);

        const results3 = await ragHandler.search(
            "What can you tell me something about sports?",
            3
        );
        decisionOnSearch(results3);
    }
};

main().catch((err) => {
    console.error(err);
});
