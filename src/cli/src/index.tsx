// NOTE: Run using the next command: npm run twsemini-cli:input
import { Box, render, Static, Text, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import React, { useState, useEffect, useCallback } from 'react';
import figlet from 'figlet';
import gradient from 'gradient-string';
import TextInput from 'ink-text-input';
import DataDisplay from './components/tws_cli_v1/DataDisplay.js';
import FileListMenu from './components/tws_cli_v2/FileListMenu.js';

const App = () => {
  const [step, setStep] = useState('select');
  const [answers, setAnswers] = useState<any>({});
  const [textValue, setTextValue] = useState('');
  // TODO: Use a real commit hash like here: mnemosyne/index.ts
  const [sampleData] = useState([
    {
      fileChanged: 'src/components/Button.tsx',
      closerDocumentation: 'docs/components/Button.md',
      documentationScore: '0.98',
    },
    {
      fileChanged: 'src/utils/api.ts',
      closerDocumentation: 'docs/api/endpoints.md',
      documentationScore: '0.85',
    },
    {
      fileChanged: 'src/App.tsx',
      closerDocumentation: 'README.md',
      documentationScore: '0.72',
    },
  ]);
  const { exit } = useApp();

  const handleSelect = (item: any) => {
    setAnswers({ ...answers, choice: item.value });
    setStep(item.value);
  };

  const handleConfirm = (item: any) => {
    setAnswers({ ...answers, confirm: item.value });
    setStep('done');
  };

  const handleTextSubmit = (value: string) => {
    setAnswers({ ...answers, text: value });
    setStep('done');
  };

  // useEffect(() => {
  //   if (step === 'done') {
  //     console.log('You selected:', answers);
  //     exit();
  //   }
  // }, [step, answers, exit]);

  const TWS_CLI = useCallback(() => {
    return (
      <Box flexDirection="column">
        <Text>
          {gradient.pastel.multiline(
            figlet.textSync('TWS CLI', { horizontalLayout: 'full' }),
          )}
        </Text>
        <Text>Welcome to the TWS CLI!</Text>
      </Box>
    );
  }, []);

  return (
    <Box flexDirection="column">
      {/* <Text>
        {gradient.pastel.multiline(
          figlet.textSync('TWS CLI', { horizontalLayout: 'full' }),
        )}
      </Text>
      <Text>Welcome to the TWS CLI!</Text> */}

      {/* <TWS_CLI /> */}
      <Static key={1} items={[{ id: 1 }]}>
        {() => (
          <Box key={1} flexDirection="column" rowGap={1}>
            <Text>
              {gradient.pastel.multiline(
                figlet.textSync('TWS CLI', { horizontalLayout: 'full' }),
              )}
            </Text>
            <Text>Welcome to the TWS CLI!</Text>
            <Text>{'\u00A0'}</Text>
          </Box>
        )}
      </Static>

      {step === 'select' && (
        <Box flexDirection="column">
          <Text>What would you like to do?</Text>
          <SelectInput
            items={[
              { label: 'TWS CLI 1', value: 'tws_cli_1' },
              { label: 'TWS CLI 2', value: 'tws_cli_2' },
              { label: 'Asking yes or no', value: 'confirm' },
              { label: 'Type an input', value: 'text' },
            ]}
            onSelect={handleSelect}
          />
        </Box>
      )}

      {step === 'confirm' && (
        <Box flexDirection="column">
          <Text>Do you want to continue?</Text>
          <SelectInput
            items={[
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ]}
            onSelect={handleConfirm}
          />
        </Box>
      )}

      {step === 'text' && (
        <Box borderColor="cyan" borderStyle="round" paddingX={1} paddingY={1}>
          <Box>
            <Text color="magenta">{'> '}</Text>
            <TextInput
              onChange={setTextValue}
              onSubmit={handleTextSubmit}
              placeholder="Type your message or @path/to/file"
              value={textValue}
            />
          </Box>
        </Box>
      )}

      {step === 'tws_cli_1' && <DataDisplay filesChanged={sampleData} />}

      {step === 'tws_cli_2' && <FileListMenu />}
    </Box>
  );
};

// console.log(
//   gradient.pastel.multiline(
//     figlet.textSync('TWS CLI', { horizontalLayout: 'full' }),
//   ),
// );

// console.log('Welcome to the TWS CLI!');

render(<App />);
