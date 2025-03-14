import { useState, useCallback } from 'react';
import {
  Center, Stack, Text,
} from '@mantine/core';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import ScatterWrapper from './ScatterWrapper';
import { StimulusParams } from '../../../../../../store/types';

export default function PracticeScatter({
  setAnswer, parameters,
}: StimulusParams<{ r1: number; r2: number, taskid: string, shouldNegate: boolean }>) {
  const [result, setResult] = useState<string | null>(null);
  const {
    r1, r2, taskid, shouldNegate,
  } = parameters;
  const r1DatasetName = `dataset_${r1}_size_100.csv`;
  const r2DatasetName = `dataset_${r2}_size_100.csv`;

  const onClick = useCallback(
    (n: number) => {
      const correct = (n === 1 && r1 > r2) || (n === 2 && r2 > r1);
      setResult(correct ? 'Correct' : 'Incorrect');
      setAnswer({
        status: true,
        provenanceGraph: undefined,
        answers: {
          [taskid]: correct,
        },
      });
    },
    [r1, r2, setAnswer, taskid],
  );

  return (
    <Stack style={{ width: '100%', height: '100%' }}>
      <Text style={{
        textAlign: 'center', paddingBottom: '0px', fontSize: '18px', fontWeight: 'bold',
      }}
      >
        Please select the visualization that appears to have a larger correlation. (This may be difficult, but try your best!)
      </Text>
      <Text style={{
        textAlign: 'center', paddingBottom: '24px', fontSize: '18px', fontWeight: 'bold',
      }}
      >
        You can either click the buttons (A or B) or use the‚ left and right keys.
      </Text>
      <Center>
        <ScatterWrapper
          onClick={onClick}
          r1={parameters.r1}
          r2={parameters.r2}
          shouldReRender={false}
          shouldNegate={shouldNegate}
          r1DatasetName={r1DatasetName}
          r2DatasetName={r2DatasetName}
        />
      </Center>
      {result && (
        <>
          <Text style={{
            textAlign: 'center', marginTop: '1rem', minHeight: '28px', fontSize: '18px', fontWeight: 'bold',
          }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: result === 'Correct' ? 'green' : 'red',
            }}
            >
              {result === 'Correct' ? (
                <>
                  <IconCircleCheck size={18} stroke={2} />
                  <span>Correct</span>
                </>
              ) : (
                <>
                  <IconCircleX size={18} stroke={2} />
                  <span>Incorrect</span>
                </>
              )}
            </div>

          </Text>
          <Text style={{ textAlign: 'center', marginTop: '1rem', minHeight: '28px' }}>{ `A is ${shouldNegate ? '-' : ''}${r1}, B is ${shouldNegate ? '-' : ''}${r2}`}</Text>
        </>
      )}
    </Stack>
  );
}
