import path from "path";
import { RagHandler } from "./rag-handler.js";
import { extractPathUpToKeyword } from "../utils/directory-path.js";
import { execSync } from "child_process";
import { get } from "http";
import { getProjectRoot } from "./config.js";

export type FileItemType = {
    filePath: string;
    score: number; // 0 → 1
    docPath: string;
};

type VECTOR_DATABASE_TYPE = "faiss" | "qdrant";
const VECTOR_DATABASE: VECTOR_DATABASE_TYPE = "qdrant";

export async function getRagDataFromCommitDiff(
    commitHash: string
): Promise<FileItemType[]> {
    const ragHandler = new RagHandler({
        model: "llama3",
    });

    const projectRoot = getProjectRoot();

    // NOTE: Executed on each commit in local
    await ragHandler.loadVectorStore(VECTOR_DATABASE);

    if (ragHandler.vectorStore) {
        let commitDetails: FileItemType[] = [];
        try {
            // Fetch latest from remote
            execSync("git fetch origin master", { stdio: "ignore" });
            // Get commit details
            const log = execSync(
                `git show ${commitHash} --name-status --pretty=format:""`,
                { encoding: "utf-8" }
            );
            const lines = log.split("\n").filter(Boolean);

            for (const line of lines) {
                const [status, filePath] = line.split("\t");
                if (status === "M" || status === "A") {
                    const gitDiffResults = await ragHandler.search(filePath, 1);
                    if (gitDiffResults.length > 0) {
                        const [doc, score] = gitDiffResults[0];
                        const docFilename = doc.metadata.source as string;
                        commitDetails.push({
                            filePath,
                            score,
                            docPath: docFilename,
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching commit details:", err);
            return [];
        }
    }

    return [];
}
