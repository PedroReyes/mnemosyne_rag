/* eslint-disable no-console -- whatever */
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

type FileDiff = {
  diff: string;
  path: string;
};

/**
 * Returns the list of changed files and their diffs for a given commit hash,
 * excluding "package-lock.json".
 */
export async function getCommitDiff(commitHash: string): Promise<FileDiff[]> {
  if (!commitHash) {
    console.log('🤔 No commit hash provided. Skipping analysis.');
    return [];
  }

  console.log(`---------------------------------`);
  console.log(`🔍 Analyzing commit: ${commitHash}`);
  console.log(`---------------------------------`);

  try {
    // Get list of changed files (excluding package-lock.json)
    const { stdout: changedFiles } = await exec(
      `git diff-tree --no-commit-id --name-only -r ${commitHash} | grep -v "package-lock.json"`,
    );

    const files = changedFiles
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const result: FileDiff[] = await Promise.all(
      files.map(async (filePath) => {
        const { stdout: diffDetails } = await exec(
          `git show ${commitHash} -- ${filePath}`,
        );
        return {
          diff: diffDetails.trim(),
          path: filePath,
        };
      }),
    );

    return result;
  } catch (error) {
    console.error(`❌ Error getting diff for commit ${commitHash}:`, error);
    return [];
  }
}
