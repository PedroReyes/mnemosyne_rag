import React, { useEffect, useState } from 'react';
import { Box, Static, Text, useInput } from 'ink';
import {
  getRagDataFromCommitDiff,
  type FileItemType,
} from '../../db/rag-wrapper.js';

const files: FileItemType[] = [
  {
    filePath: 'src/components/Button.tsx',
    score: 0.98,
    docPath: 'docs/components/Button.md',
  },
  {
    filePath: 'src/utils/api.ts',
    score: 0.85,
    docPath: 'docs/api/endpoints.md',
  },
  {
    filePath: 'src/App.tsx',
    score: 0.72,
    docPath: 'README.md',
  },
  {
    filePath: 'src/api/v1/endpoints/user.ts',
    score: 0.52,
    docPath: 'docs/api/v1/endpoints/user/profiles.md',
  },
];

const actions = [
  {
    key: 'y',
    label: '✅ Proceed with Commit',
  },
  { key: 'n', label: '❌ Do Not Proceed', description: 'Abort commit' },

  // TODO: Uncomment these actions when implemented (las idas de olla de Pedro)
  // { key: 'e', label: '✏️ Edit File', description: 'Open file in your editor' },
  // {
  //   key: 'u',
  //   label: '✨ Update with AI',
  //   description: 'Let AI improve your docs',
  // },
  // {
  //   key: 'n',
  //   label: '📝 New File',
  //   description: 'Create a new documentation file',
  // },
];

// Helpers

const colorForScore = (score: number) => {
  if (score >= 0.9) return 'green';
  if (score >= 0.75) return 'yellow';
  return 'red';
};

const createBar = (score: number, length = 20) => {
  const filledLength = Math.round(score * length);
  const emptyLength = length - filledLength;

  const leftEdge = '▕';
  const rightEdge = '▏';
  const bar =
    leftEdge + '█'.repeat(filledLength) + ' '.repeat(emptyLength) + rightEdge;

  return bar;
};

const truncatePath = (path: string, maxLength = 30) => {
  if (path.length <= maxLength) return path;
  const start = path.slice(0, Math.floor(maxLength / 2) - 3);
  const end = path.slice(-Math.floor(maxLength / 2));
  return `${start}...${end}`;
};

export default function FileListMenu() {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [ragData, setRagData] = useState<FileItemType[]>([]);

  useEffect(() => {
    // TODO: Replace with real data fetching logic
    const fetchData = async () => {
      const data = await getRagDataFromCommitDiff('HEAD');
      setRagData(data);
    };

    fetchData();
  }, []);

  useInput((input, key) => {
    if (key.downArrow) {
      setSelectedFileIndex((prev) => (prev + 1) % files.length); // TODO: Replace `files` with `ragData` when ready
      setMessage(null);
    } else if (key.upArrow) {
      setSelectedFileIndex((prev) => (prev - 1 + files.length) % files.length);
      setMessage(null);
    } else {
      const action = actions.find((a) => a.key === input.toLowerCase());
      if (action) {
        const selectedFile = files[selectedFileIndex];
        setMessage(
          `✔ You chose "${action.label}" for file: ${selectedFile.filePath}`,
        );
      }
    }
  });

  return (
    <Box flexDirection="column">
      {/* FILES PANEL */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="cyan"
        paddingX={1}
      >
        {files.map((file, i) => {
          const isSelected = i === selectedFileIndex;
          const scoreColor = colorForScore(file.score);
          const bar = createBar(file.score);
          const docPathTruncated = truncatePath(file.docPath);
          const filePathTruncated = truncatePath(file.filePath, 40);

          return (
            <Box key={file.filePath} flexDirection="row">
              <Box width="45%">
                <Text color={isSelected ? 'green' : undefined}>
                  {isSelected ? '> ' : '  '}
                  {filePathTruncated.padEnd(42)}
                </Text>
              </Box>
              <Box width="55%" flexDirection="row">
                <Text color={scoreColor}>
                  {bar} {(file.score * 100).toFixed(0)}%
                </Text>
                <Text color="cyan"> {docPathTruncated}</Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ACTIONS PANEL */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="magenta"
        marginTop={1}
        paddingX={1}
      >
        <Text color="magenta">──────── ACTIONS ─────────────</Text>
        <Text>Press:</Text>

        {actions.map((action) => (
          <Box key={action.key}>
            <Text color="magenta">[ {action.key} ]</Text>
            <Text> → {action.label.padEnd(20)} </Text>
            <Text color="gray">{action.description}</Text>
          </Box>
        ))}
      </Box>

      {/* Message output */}
      {message && (
        <Box marginTop={1}>
          <Text color="green">{message}</Text>
        </Box>
      )}
    </Box>
  );
}
