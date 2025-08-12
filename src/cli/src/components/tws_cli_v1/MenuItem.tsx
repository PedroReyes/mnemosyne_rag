import React from 'react';
import { Box, Text } from 'ink';

export type MENU_OPTIONS =
  | 'create_file'
  | 'edit_file'
  | 'update_with_ai'
  | 'go_back';

export type MenuItemType = {
  key: MENU_OPTIONS;
  label: string;
  component?: React.JSX.Element;
  isSelected?: boolean;
};

export function MenuItem({ item }: { item: MenuItemType }) {
  return (
    <Box paddingX={2} paddingY={1}>
      <Box
        borderStyle={item.isSelected ? 'round' : 'classic'}
        borderColor={item.isSelected ? 'green' : 'white'}
        width="100%"
        justifyContent="center"
      >
        <Text color={item.isSelected ? 'green' : 'white'}>{item.label}</Text>
      </Box>
    </Box>
  );
}
