import { JSX, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Center, Group, Stack, Tooltip, Text, Divider, Button, Badge,
} from '@mantine/core';
import {
  IconBrain,
  IconCheck, IconExternalLink, IconHourglassEmpty, IconX,
} from '@tabler/icons-react';
import { ParticipantData } from '../../../storage/types';
import { SingleTaskLabelLines } from './SingleTaskLabelLines';
import { SingleTask } from './SingleTask';
import { encryptIndex } from '../../../utils/encryptDecryptIndex';
import { humanReadableDuration } from '../../../utils/humanReadableDuration';
import { StudyConfig } from '../../../parser/types';
import { PREFIX } from '../../../utils/Prefix';
import { participantName } from '../../../utils/participantName';

const LABEL_GAP = 25;
const CHARACTER_SIZE = 8;

const margin = {
  left: 20, top: 0, right: 20, bottom: 0,
};

export function AllTasksTimeline({
  participantData, width, height, selectedTask, studyId, studyConfig, maxLength,
} : {participantData: ParticipantData, width: number, studyId: string, height: number, selectedTask?: string | null, studyConfig: StudyConfig | undefined, maxLength: number | undefined}) {
  const clickTask = useCallback((task: string) => {
    const split = task.split('_');
    const index = +split[split.length - 1];

    window.open(`${PREFIX}${studyId}/${encryptIndex(index)}?participantId=${participantData.participantId}`, '_blank');
  }, [participantData.participantId, studyId]);

  const xScale = useMemo(() => {
    const allStartTimes = Object.values(participantData.answers || {}).filter((answer) => answer.startTime).map((answer) => [answer.startTime, answer.endTime]).flat();

    const extent = d3.extent(allStartTimes) as [number, number];

    const scale = d3.scaleLinear([margin.left, width - margin.left - margin.right]).domain([extent[0], maxLength ? extent[0] + maxLength : extent[1]]).clamp(true);

    return scale;
  }, [maxLength, participantData.answers, width]);

  // Creating labels for the tasks
  const [numComponentsAnsweredCorrectly, numComponentsWithCorrectAnswer, numComponentsAttentionCheck, numComponentsAttentionCheckCorrect, tasks] : [number, number, number, number, {line: JSX.Element | null, label: JSX.Element}[]] = useMemo(() => {
    let currentHeight = 0;

    const sortedEntries = Object.entries(participantData.answers || {}).filter((answer) => !!(answer[1].startTime)).sort((a, b) => a[1].startTime - b[1].startTime);

    let _numComponentsAnsweredCorrectly = 0;
    let _numComponentsWithCorrectAnswer = 0;
    let _numComponentsAttentionCheck = 0;
    let _numComponentsAttentionCheckCorrect = 0;

    const allElements = sortedEntries.map((entry, i) => {
      const [name, answer] = entry;

      const prev = i > 0 ? sortedEntries[i - currentHeight - 1] : null;

      if (prev && prev[0].length * (CHARACTER_SIZE + 1) + xScale(prev[1].startTime) > xScale(answer.startTime)) {
        currentHeight += 1;
      } else {
        currentHeight = 0;
      }

      let isCorrect = true;
      let hasCorrect = false;

      if (answer && answer.correctAnswer) {
        answer.correctAnswer.forEach((a) => {
          const { id, answer: componentCorrectAnswer } = a;

          if (!answer || !answer.correctAnswer || answer.answer[id] !== componentCorrectAnswer) {
            isCorrect = false;
          }
        });
        hasCorrect = true;
      } else {
        hasCorrect = false;
      }

      if (hasCorrect) {
        _numComponentsWithCorrectAnswer += 1;
        if (answer.parameters.isAttentionCheck) {
          _numComponentsAttentionCheck += 1;
        }

        if (isCorrect) {
          _numComponentsAnsweredCorrectly += 1;
          if (answer.parameters.isAttentionCheck) {
            _numComponentsAttentionCheckCorrect += 1;
          }
        }
      }

      return {
        line: sortedEntries.length < 50 ? <SingleTaskLabelLines key={name} labelHeight={currentHeight * LABEL_GAP} answer={answer} height={height} xScale={xScale} /> : null,
        label: (
          <Tooltip
            key={`${name}-tooltip`}
            withinPortal
            position="bottom-start"
            px={4}
            py={0}
            withArrow
            label={(
              <Stack gap={0}>
                <Text size="sm" style={{ fontWeight: 'bold' }}>{name}</Text>
                {Object.entries(answer.answer).map((a) => {
                  const [id, componentAnswer] = a;
                  const correctAnswer = answer?.correctAnswer?.find((c) => c.id === id)?.answer;

                  return <Text key={id}>{`${id}: ${componentAnswer} ${correctAnswer ? `[${correctAnswer}]` : ''}`}</Text>;
                })}
              </Stack>
            )}
          >
            <g>
              <SingleTask showLabel={sortedEntries.length < 50} isCorrect={isCorrect} hasCorrect={hasCorrect} key={name} labelHeight={currentHeight * LABEL_GAP} isSelected={selectedTask === name} setSelectedTask={clickTask} answer={answer} height={height} name={name} xScale={xScale} />
            </g>
          </Tooltip>),
      };
    });

    return [_numComponentsAnsweredCorrectly, _numComponentsWithCorrectAnswer, _numComponentsAttentionCheck, _numComponentsAttentionCheckCorrect, allElements];
  }, [participantData.answers, xScale, height, selectedTask, clickTask]);

  const duration = useMemo(() => {
    if (!participantData.answers || Object.entries(participantData.answers).length === 0) {
      return 0;
    }

    const answersSorted = Object.values(participantData.answers).filter((data) => data.startTime).sort((a, b) => a.startTime - b.startTime);

    return new Date(answersSorted[answersSorted.length - 1].endTime - (answersSorted[0] ? answersSorted[0].startTime : 0)).getTime();
  }, [participantData]);

  // Find entries of someone browsing away. Show them
  const browsedAway = useMemo(() => {
    const sortedEntries = Object.entries(participantData.answers || {}).sort((a, b) => a[1].startTime - b[1].startTime);

    return sortedEntries.map((entry) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [name, answer] = entry;

      const browsedAwayList: [number, number][] = [];
      let currentBrowsedAway: [number, number] = [-1, -1];
      let currentState: 'visible' | 'hidden' = 'visible';
      if (answer.windowEvents) {
        for (let i = 0; i < answer.windowEvents.length; i += 1) {
          if (answer.windowEvents[i][1] === 'visibility') {
            if (answer.windowEvents[i][2] === 'hidden' && currentState === 'visible') {
              currentBrowsedAway = [answer.windowEvents[i][0], -1];
              currentState = 'hidden';
            } else if (answer.windowEvents[i][2] === 'visible' && currentState === 'hidden') {
              currentBrowsedAway[1] = answer.windowEvents[i][0];
              browsedAwayList.push(currentBrowsedAway);
              currentBrowsedAway = [-1, -1];
              currentState = 'visible';
            }
          }
        }
      }

      return (
        browsedAwayList.map((browse, i) => <Tooltip withinPortal key={i} label="Browsed away"><rect x={xScale(browse[0])} width={xScale(browse[1]) - xScale(browse[0])} y={height - 5} height={10} /></Tooltip>)
      );
    });
  }, [xScale, height, participantData.answers]);

  const partName = useMemo(() => participantName(participantData, studyConfig), [participantData, studyConfig]);

  const completionTime = useMemo(() => {
    if (!participantData.answers || Object.entries(participantData.answers).length === 0) {
      return '';
    }

    const answersSorted = Object.values(participantData.answers).filter((data) => data.startTime).sort((a, b) => a.startTime - b.startTime);

    const date = new Date(answersSorted[answersSorted.length - 1].endTime);

    return participantData.completed ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : '';
  }, [participantData]);

  return (
    <Center>
      <Stack gap={15} style={{ width: '100%' }}>
        <Divider size="md" />
        <Group justify="space-between">
          <Group justify="center">
            {participantData.participantIndex
              ? (
                <Text>
                  {`P-${participantData.participantIndex.toString().padStart(3, '0')}`}
                </Text>
              ) : null }

            <Text size="md" fw={700}>
              {partName || participantData.participantId}
            </Text>

            <Text size="md">
              {completionTime}
            </Text>

            {participantData.completed ? null : <Text size="xl" c="red">Not completed</Text>}

            <Group gap={10}>
              <Badge
                variant="light"
                size="lg"
                color="green"
                leftSection={<IconCheck width={18} height={18} style={{ paddingTop: 1 }} />}
                pb={1}
              >
                {numComponentsAnsweredCorrectly}
              </Badge>
              <Badge
                variant="light"
                size="lg"
                color="red"
                leftSection={<IconX width={18} height={18} style={{ paddingTop: 1 }} />}
                pb={1}
              >
                {numComponentsWithCorrectAnswer - numComponentsAnsweredCorrectly}
              </Badge>
              {numComponentsAttentionCheck > 0
                ? (
                  <Tooltip label="Attention Checks">
                    <Badge
                      variant="light"
                      size="lg"
                      color="orange"
                      leftSection={<IconBrain width={18} height={18} style={{ paddingTop: 1 }} />}
                      pb={1}
                    >
                      {`${numComponentsAttentionCheckCorrect}/${numComponentsAttentionCheck}`}
                    </Badge>
                  </Tooltip>
                ) : null}
              <Badge
                variant="light"
                size="lg"
                color="gray"
                leftSection={<IconHourglassEmpty width={18} height={18} style={{ paddingTop: 1 }} />}
                pb={1}
              >
                {humanReadableDuration(duration)}
              </Badge>
            </Group>

          </Group>
          <Button
            rightSection={<IconExternalLink size={14} />}
            component="a"
            href={`${PREFIX}${studyId}/${encryptIndex(0)}?participantId=${participantData.participantId}`}
            target="_blank"
          >
            Go to replay
          </Button>
        </Group>

        { participantData.completed ? (
          <svg style={{ width, height, overflow: 'hidden' }}>
            {tasks.map((t) => t.line)}
            {tasks.map((t) => t.label)}
            {browsedAway}
          </svg>
        ) : null}
      </Stack>
    </Center>

  );
}
