/* eslint-disable class-methods-use-this -- whatever */
/* eslint-disable no-restricted-syntax -- whatever */
/* eslint-disable import/no-extraneous-dependencies -- whatever */
/* eslint-disable @typescript-eslint/lines-between-class-members -- whatever */
/* eslint-disable no-console -- whatever  */

import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OllamaEmbeddings } from '@langchain/ollama';
import { QdrantVectorStore } from '@langchain/qdrant';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { QdrantClient } from '@qdrant/js-client-rest';
import fs from 'fs';

import { loadMarkdownDocs } from '../utils/file-loader.js';
import { DB_PATH } from './config.js';
import path from 'path';
import { extractPathUpToKeyword } from '../utils/directory-path.js';
import type { SearchResult } from '../types/index.js';

export class RagHandler {
  model: string;

  vectorStore: FaissStore | null | QdrantVectorStore = null;

  QdrantNameCollection = 'domain_olympus';

  constructor({ model }: { model: string }) {
    this.model = model;
  }

  public async processAndStore(
    vectorDatabase: 'faiss' | 'qdrant',
    markdownDir: string,
  ): Promise<void> {
    // TODO: This should be handled by the kafka topic from Holly
    // TODO: If a file changes, then we should update the vector store related to that file in Qdrant
    const docs = loadMarkdownDocs(markdownDir);
    console.log(`📥 Loaded ${docs.length} Markdown documents`);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkOverlap: 0,
      chunkSize: 500,
    });

    const splitDocs = await splitter.splitDocuments(docs);
    console.log(`✂️ Split into ${splitDocs.length} chunks`);

    const embeddings = new OllamaEmbeddings({
      model: 'nomic-embed-text',
    });

    if (vectorDatabase === 'qdrant') {
      console.log('🔄 Creating vector store in Qdrant...');
      this.vectorStore = await QdrantVectorStore.fromDocuments(
        splitDocs,
        embeddings,
        {
          client: new QdrantClient({ url: 'http://localhost:6333' }),
          collectionName: this.QdrantNameCollection,
        },
      );
    } else if (vectorDatabase === 'faiss') {
      console.log('🔄 Creating vector store in Faiss...');
      this.vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
      await this.vectorStore.save(DB_PATH);

      console.log('✅ Vector store created');

      console.log(`💾 Vector store saved at ${DB_PATH}`);
    }
  }

  public async loadVectorStore(database: 'faiss' | 'qdrant'): Promise<void> {
    if (fs.existsSync(DB_PATH)) {
      // --------------------- Embedding (Ollama) -------------------
      const embeddings = new OllamaEmbeddings({
        model: 'nomic-embed-text',
      });

      // --------------------- Loading vector store (Qdrant) -------------------
      if (database === 'qdrant') {
        console.log('💾 Loading vector store from Qdrant...');

        if (!(await this.isCollectionAvailable(this.QdrantNameCollection))) {
          const projectRoot = extractPathUpToKeyword(
            path.resolve(process.cwd()),
            'pantheon-monorepo',
          );
          await this.processAndStore(database, projectRoot);
        }

        this.vectorStore = await QdrantVectorStore.fromExistingCollection(
          embeddings,
          {
            client: new QdrantClient({ url: 'http://localhost:6333' }),
            collectionName: this.QdrantNameCollection,
          },
        );
      }

      // ------------------- Loading vector store (FaissStore) -------------------
      if (database === 'faiss') {
        if (!fs.existsSync(DB_PATH)) {
          const projectRoot = extractPathUpToKeyword(
            path.resolve(process.cwd()),
            'pantheon-monorepo',
          );
          await this.processAndStore(database, projectRoot);
        }

        console.log('💾 Loading vector store from Faiss...');
        this.vectorStore = await FaissStore.load(DB_PATH, embeddings);
        console.log('✅ Vector store loaded');
      }
    } else {
      console.log('No local vector store found. Please create one first.');
    }
  }

  public async isCollectionAvailable(name: string): Promise<boolean> {
    try {
      const qdrant = new QdrantClient({ url: 'http://localhost:6333' });
      console.log(`🔍 Checking if collection "${name}" exists...`);
      await qdrant.getCollection(name);
      console.log(`✅ The collection "${name}" exists.`);
      return true;
    } catch (error: any) {
      console.log(error);
      if (error?.response?.status === 404) {
        console.log(`❌ The collection "${name}" does not exist.`);
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
    // console.log(`\n🔍 k=${k} Searching for: \n${query}`);

    if (this.vectorStore) {
      const results = await this.vectorStore.similaritySearchWithScore(
        query,
        k,
      );

      // for (const [doc, score] of results) {
      //   console.log(`- ${doc.metadata.source} (Score: ${score})`);
      // }

      // console.log(`\n📝Found ${results.length} results\n\n`);

      return results;
    }

    // console.log('Vector store not available for searching.');

    return [];
  }
}
