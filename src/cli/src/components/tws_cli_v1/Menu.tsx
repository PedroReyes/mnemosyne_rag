import React, { useState } from 'react';
import { render, Box, Text, useInput } from 'ink';
import { FileItem, type FileItemType } from './FileItem.js';
import { MenuItem, type MenuItemType } from './MenuItem.js';

export type MenuType = {
  options: FileItemType[] | MenuItemType[];
  onSelect: (index: number) => void;
};

export function Menu({ onSelect, options }: MenuType) {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.downArrow) {
      setSelected((prev) => (prev + 1) % options.length);
    } else if (key.upArrow) {
      setSelected((prev) => (prev - 1 + options.length) % options.length);
    } else if (key.return) {
      if (onSelect) {
        onSelect(selected);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Box paddingX={2} paddingY={1}>
        <Text color="white">Use ↑ ↓ to navigate, Enter to select</Text>
      </Box>

      <Box paddingX={2} marginBottom={1}>
        <Text dimColor>Score Legend: ✅ ≥ 90% | 🟡 ≥ 75% | 🔴 &lt; 75%</Text>
      </Box>

      {options.map((option, i) => {
        return 'fileChanged' in option ? (
          <FileItem
            key={option.fileChanged}
            file={
              {
                fileChanged: option?.fileChanged,
                closerDocumentation: option?.closerDocumentation,
                documentationScore: option?.documentationScore,
                isSelected: i === selected,
              } as FileItemType
            }
          />
        ) : (
          <MenuItem
            key={option.key}
            item={{
              key: option.key,
              label: option.label,
              isSelected: i === selected,
            }}
          />
        );
      })}
    </Box>
  );
}
