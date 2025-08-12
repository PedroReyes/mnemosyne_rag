import { Box, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import React, { useEffect, useState } from 'react';
import { Menu } from './Menu.js';
import { FileItem, type FileItemType } from './FileItem.js';
import type { MenuItemType } from './MenuItem.js';
import { spawnSync } from 'child_process';

const DataDisplay = ({ filesChanged }: { filesChanged: FileItemType[] }) => {
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(-1);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
  const options: MenuItemType[] = [
    { key: 'edit_file', label: '✏️  Edit File' },
    { key: 'update_with_ai', label: '✨ Update with AI' },
    { key: 'create_file', label: '📝 Create File' },
    { key: 'go_back', label: '⬅️  Go Back' },
  ];
  //   const { exit } = useApp();

  const handleFileSelect = (index: number) => {
    setSelectedFileIndex(index);
  };

  const handleMenuSelect = (index: number) => {
    setSelectedMenuIndex(index);

    const keySelected = options[index].key;

    switch (keySelected) {
      case 'edit_file':
        // NOTE: Handle edit file action
        spawnSync(
          'code-insiders',
          [
            `${spawnSync('git', ['rev-parse', '--show-toplevel'])
              .stdout.toString()
              .trim()}/${filesChanged[selectedFileIndex].fileChanged}`,
          ],
          {
            stdio: 'inherit',
          },
        );
        break;
      case 'update_with_ai':
        // TODO: Handle update with AI action
        break;
      case 'create_file':
        // TODO: Handle create file action
        break;
      case 'go_back':
        // NOTE: Handle go back action
        setSelectedFileIndex(-1);
        break;
    }
  };

  //   useEffect(() => {}, [selectedFileIndex, selectedMenuIndex]);

  if (selectedFileIndex !== -1) {
    const selectedFile = filesChanged[selectedFileIndex];
    return (
      <Box flexDirection="column">
        <FileItem file={selectedFile} />
        <Menu options={options} onSelect={handleMenuSelect} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Menu options={filesChanged} onSelect={handleFileSelect} />
    </Box>
  );
};

export default DataDisplay;
