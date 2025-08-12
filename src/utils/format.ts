export function formatSimilarity(
  value: number,
  codeFilename: string,
  documentationFilename: string,
  projectRoot: string,
): string {
  const shortenPath = (filePath: string) => {
    if (filePath.startsWith(projectRoot)) {
      return filePath.substring(projectRoot.length + 1);
    }
    return filePath;
  };

  const shortCodeFilename = shortenPath(codeFilename);
  const shortDocFilename = shortenPath(documentationFilename);

  const percentage = 100 / (1 + value);
  const totalBlocks = 20;
  const filledBlocks = Math.round((percentage / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;

  const bar = `▕${'█'.repeat(filledBlocks)}${' '.repeat(emptyBlocks)}▏`;

  const percentageString = `${Math.round(percentage)}%`.padStart(4, ' ');

  return `${shortCodeFilename.padEnd(60, ' ')} ${bar} ${percentageString} ${shortDocFilename}`;
}
