import type { Document } from 'langchain/document';

export type SimilarityScore = number;

// Defines the type for a search result, which is a tuple containing a Document and its similarity score.
export type SearchResult = [Document, SimilarityScore];
