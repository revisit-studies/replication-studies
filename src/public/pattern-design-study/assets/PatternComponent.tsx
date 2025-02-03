import { Text } from '@mantine/core';
import { StimulusParams } from '../../../store/types';


export default function Example({ parameters, setAnswer }: StimulusParams<{condition_chart: string, condition_texture: string, pageLink: string}>) {

  localStorage.setItem("measurements", JSON.stringify({condition_chart: parameters.condition_chart, condition_texture: parameters.condition_texture}));

  console.log(parameters)

  setAnswer({
    answers: {
      "answer": localStorage.getItem('measurements')
    },
    status: true,
  })

  console.log(localStorage.getItem('measurements'))
  
  return     <iframe
  src={parameters.pageLink}
  style={{
    minHeight: '500px',
    width: '100%',
    border: 0,
  }}
/>
}