/* eslint-disable import/no-extraneous-dependencies -- whatever */
/* eslint-disable no-restricted-syntax -- whatever */
import fs from 'fs';
import { Document } from 'langchain/document';
import path from 'path';

import { IGNORED_FOLDERS } from '../db/config';

// Function to recursively read all .md files from a directory
export function loadMarkdownDocs(dirPath: string): Document[] {
  const markdownDocs: Document[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_FOLDERS.includes(entry.name)) {
        markdownDocs.push(...loadMarkdownDocs(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      markdownDocs.push(
        new Document({
          metadata: { source: fullPath },
          pageContent: content,
        }),
      );
    }
  }

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      // eslint-disable-next-line no-console -- whatever
      console.log(`📄 Found document: ${path.join(dirPath, entry.name)}`);
    }
  }

  return markdownDocs;
}
