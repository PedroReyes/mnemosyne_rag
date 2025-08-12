import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

export type FileItemType = {
  fileChanged: string;
  closerDocumentation: string;
  documentationScore: string;
  isSelected?: boolean;
};

const colorForScore = (score: number) => {
  if (score >= 0.9) return 'green';
  if (score >= 0.75) return 'yellow';
  return 'red';
};

const createBar = (score: number, length = 20) => {
  const filledLength = Math.round(score * length);
  const emptyLength = length - filledLength;

  // Optional rounded edges
  const leftEdge = '▕';
  const rightEdge = '▏';
  const bar =
    leftEdge + '█'.repeat(filledLength) + ' '.repeat(emptyLength) + rightEdge;

  return bar;
};

export function FileItem({ file }: { file: FileItemType }) {
  const numericScore = parseFloat(file.documentationScore);
  const scoreColor = colorForScore(numericScore);

  // 🔥 NEW: state for animated progress
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = numericScore / 10; // adjust speed
    const interval = setInterval(() => {
      current += step;
      if (current >= numericScore) {
        current = numericScore;
        clearInterval(interval);
      }
      setAnimatedScore(current);
    }, 50);

    return () => clearInterval(interval);
  }, [numericScore]);

  const bar = createBar(animatedScore);

  return (
    <Box
      borderStyle="round"
      paddingX={2}
      paddingY={1}
      flexDirection="column"
      marginBottom={1}
      borderColor={file.isSelected ? 'magenta' : 'gray'}
    >
      <Box>
        <Text bold>🗎 File Changed: </Text>
        <Text>{'\u00A0'}</Text>
        <Text>{file.fileChanged}</Text>
      </Box>

      <Box justifyContent="space-between" width="100%" marginTop={1}>
        <Box>
          <Text>↳ 📄 </Text>
          <Text color="cyan">{file.closerDocumentation}</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text bold color={scoreColor}>
          Score:{' '}
        </Text>
        <Text color={scoreColor}>
          {bar} {(animatedScore * 100).toFixed(0)}%
        </Text>
      </Box>
    </Box>
  );
}
