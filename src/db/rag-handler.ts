/* eslint-disable class-methods-use-this -- whatever */
/* eslint-disable no-restricted-syntax -- whatever */
/* eslint-disable import/no-extraneous-dependencies -- whatever */
/* eslint-disable @typescript-eslint/lines-between-class-members -- whatever */
/* eslint-disable no-console -- whatever  */

import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { QdrantClient } from "@qdrant/js-client-rest";
import fs from "fs";

import type { SearchResult } from "../types";
import { loadMarkdownDocs } from "../utils/file-loader";
import { DB_PATH, getProjectRoot } from "./config";
import path from "path";
import { extractPathUpToKeyword } from "../utils/directory-path";
import { logError, logInfo } from "../utils/logging";

export type ModelName = "llama3";

export type RagHandlerOptions = {
    model: ModelName;
    path?: string;
    reload?: boolean;
    collection?: string;
};

export class RagHandler {
    model: ModelName;
    path?: string;
    reload?: boolean;

    vectorStore: FaissStore | null | QdrantVectorStore = null;

    QdrantNameCollection: string = "domain_olympus";

    constructor({ model, path, reload, collection }: RagHandlerOptions) {
        this.model = model;
        this.path = path;
        this.reload = reload;
        if (collection) {
            this.QdrantNameCollection = collection;
        }
    }

    public async processAndStore(
        vectorDatabase: "faiss" | "qdrant",
        markdownDir: string
    ): Promise<void> {
        // TODO: This should be handled by the kafka topic from Holly
        // TODO: If a file changes, then we should update the vector store related to that file in Qdrant
        const docs = loadMarkdownDocs(markdownDir);
        logInfo(`📥 Loaded ${docs.length} Markdown documents`);

        const splitter = new RecursiveCharacterTextSplitter({
            chunkOverlap: 0,
            chunkSize: 500,
        });

        const splitDocs = await splitter.splitDocuments(docs);
        logInfo(`✂️ Split into ${splitDocs.length} chunks`);

        const embeddings = new OllamaEmbeddings({
            model: "nomic-embed-text",
        });

        if (vectorDatabase === "qdrant") {
            logInfo("🔄 Creating vector store in Qdrant...");
            this.vectorStore = await QdrantVectorStore.fromDocuments(
                splitDocs,
                embeddings,
                {
                    client: new QdrantClient({ url: "http://localhost:6333" }),
                    collectionName: this.QdrantNameCollection,
                }
            );
        } else if (vectorDatabase === "faiss") {
            logInfo("🔄 Creating vector store in Faiss...");
            this.vectorStore = await FaissStore.fromDocuments(
                splitDocs,
                embeddings
            );
            await this.vectorStore.save(DB_PATH);

            logInfo("✅ Vector store created");

            logInfo(`💾 Vector store saved at ${DB_PATH}`);
        }
    }

    public async loadVectorStore(database: "faiss" | "qdrant"): Promise<void> {
        // --------------------- Embedding (Ollama) -------------------
        const embeddings = new OllamaEmbeddings({
            model: "nomic-embed-text",
        });

        // --------------------- Loading vector store (Qdrant) -------------------
        if (database === "qdrant") {
            logInfo("💾 Loading vector store from Qdrant...");
            const isCollectionAvailable = await this.isCollectionAvailable(
                this.QdrantNameCollection
            );

            if (this.reload && isCollectionAvailable) {
                logInfo(`🔄 Reloading vector store from Qdrant...`);

                const client = new QdrantClient({
                    host: "localhost",
                    port: 6333,
                });

                await client.deleteCollection(this.QdrantNameCollection);
            }

            if (this.reload) {
                const projectRoot = this.path ?? getProjectRoot();

                await this.processAndStore(database, projectRoot);
            }

            this.vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddings,
                {
                    client: new QdrantClient({
                        url: "http://localhost:6333",
                    }),
                    collectionName: this.QdrantNameCollection,
                }
            );
        }

        // ------------------- Loading vector store (FaissStore) -------------------
        if (database === "faiss") {
            if (!fs.existsSync(DB_PATH)) {
                const projectRoot = getProjectRoot();
                await this.processAndStore(database, projectRoot);
            }

            logInfo("💾 Loading vector store from Faiss...");
            this.vectorStore = await FaissStore.load(DB_PATH, embeddings);
            logInfo("✅ Vector store loaded");
        }
    }

    public async isCollectionAvailable(name: string): Promise<boolean> {
        try {
            const qdrant = new QdrantClient({ url: "http://localhost:6333" });
            logInfo(`🔍 Checking if collection "${name}" exists...`);
            await qdrant.getCollection(name);
            logInfo(`✅ The collection "${name}" exists.`);
            return true;
        } catch (error: any) {
            logInfo(
                "----------------------------------------------------------------------"
            );
            logInfo(
                `Please, remember to run qdrant. For such goal, do the next commands:`
            );
            logInfo(`docker pull qdrant/qdrant`);
            logInfo(`docker run -p 6333:6333 qdrant/qdrant`);
            logInfo(
                "----------------------------------------------------------------------"
            );

            logInfo(error);
            if (error?.response?.status === 404) {
                logError(`❌ The collection "${name}" does not exist.`);
            }

            return false;
        }
    }

    /**
     * Search the vector store for relevant documents based on a query.
     * @param query The search query.
     * @param k The number of results to return (default is 1).
     * @returns An array of search results with document metadata and scores.
     */
    public async search(query: string, k = 1): Promise<SearchResult[]> {
        // logInfo(`\n🔍 k=${k} Searching for: \n${query}`);

        if (this.vectorStore) {
            const results = await this.vectorStore.similaritySearchWithScore(
                query,
                k
            );

            // for (const [doc, score] of results) {
            //   logInfo(`- ${doc.metadata.source} (Score: ${score})`);
            // }

            // logInfo(`\n📝Found ${results.length} results\n\n`);

            return results;
        }

        // logInfo('Vector store not available for searching.');

        return [];
    }
}
