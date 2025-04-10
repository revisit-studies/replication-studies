/**
 * Authors: The ReVISit team
 * Description:
 *    This file is the base component for the Parallel Coordinate plot trials written in the config.json
 * Possible next steps:
 *    regarding the paper,
 *    https://classes.engineering.wustl.edu/cse557/spring2017/readings/ranking-correlations.pdf,
 *    add an F-test after 24 user selections, "the 24 user judgments are divided into 3 subgroups,
 *    and convergence is reached when there is no significant difference between these three
 *    subgroups".
 */

import { Center, Stack, Text } from '@mantine/core';
import { StimulusParams } from '../../../../../../store/types';
import ParallelCoordinatesWrapper from './ParallelCoordinatesWrapper';
import { useNextStep } from '../../../../../../store/hooks/useNextStep';

/**
 * Displays user's experiemnt. (This includes 2 parallel plots).
 * Once completed (after 50 selections or the graphs converge) it nofifys the user
 * to continue on.
 * @param param0 - setAnswer is a function that fills the response, parameters are
 * r1 (base correlation value, does not change), r2 (other correlation value, does change
 * depending on the user's actions), above (a boolean determining whether it is an above or
 * below experiment)
 * @returns 2 scatter plots during the experiment or a message of completion
 * of the trial
 */
export default function JND({ setAnswer, parameters } : StimulusParams<{r1: number, r2:number, above: boolean, counter: number, shouldNegate: boolean, r1Left: boolean, r1DatasetName: string, r2DatasetName: string, correlationDirection: string}>) {
  const {
    r1, r2, shouldNegate, r1Left, above, r1DatasetName, r2DatasetName, correlationDirection,
  } = parameters;
  const { goToNextStep } = useNextStep();

  const onClick = (n: number) => {
    // setCounter(counter + 1);
    setAnswer({
      status: true,
      answers: { participantSelections: above ? n === 2 : n === 1 },
    });

    setTimeout(() => {
      goToNextStep();
    }, 0);
  };

  return (
    <Stack style={{ width: '100%', height: '100%' }}>
      <Text style={{
        textAlign: 'center', paddingBottom: '0px', fontSize: '18px', fontWeight: 'bold',
      }}
      >
        Please select the visualization that appears to have a larger
        {correlationDirection === 'negative' && ' negative'}
        {' '}
        correlation. (This may be difficult, but try your best!)
      </Text>
      <Text style={{
        textAlign: 'center', paddingBottom: '24px', fontSize: '18px', fontWeight: 'bold',
      }}
      >
        You can either click the buttons (A or B) or use the‚ left and right keys.
      </Text>
      <Center>
        <ParallelCoordinatesWrapper onClick={onClick} r1={r1} r2={r2} shouldNegate={shouldNegate} r1Left={r1Left} r1DatasetName={r1DatasetName} r2DatasetName={r2DatasetName} />
      </Center>
    </Stack>
  );
}
