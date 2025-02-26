/**
 * Authors: WPI Data Visualization Team
 * Modified by: The ReVISit Team
 * Description:
 *    This file contains the functionality to create a Heatmap Plot.
 */

import * as d3 from 'd3';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { select } from 'd3-selection';
import { generateCorrelatedDataset, generateDataSetFixed } from '../../utils/dataGeneration';

const width = 400;
const height = 40;
const spacing = 10;

export default function HeatmapPlots({ r, onClick }: { r: number, onClick: () => void }) {
  const d3Container = useRef(null);
  const seedRef = useRef(Date.now().toString());

  const [isHover, setIsHover] = useState<boolean>(false);

  const createChart = useCallback(() => {
    const dataUnsorted: [number, number][] = generateDataSetFixed(1, seedRef.current) as [number, number][];
    const xSorted = dataUnsorted.map((d) => d[0]).sort((a, b) => a - b);
    const yCorrelated = generateCorrelatedDataset(xSorted, r, seedRef.current);

    const svg = select(d3Container.current)
      .attr('width', width)
      .attr('height', height * 2 + spacing);

    svg.selectAll('*').remove();

    svg.append('g')
      .selectAll('rect')
      .data(xSorted)
      .enter()
      .append('rect')
      .attr('x', (_, i) => i * (width / xSorted.length))
      .attr('y', 0)
      .attr('width', width / xSorted.length)
      .attr('height', height)
      .style('fill', (d) => d3.interpolateRdBu((d - d3.min(xSorted)!) / (d3.max(xSorted)! - d3.min(xSorted)!)))
      .style('cursor', 'pointer')
      .on('click', onClick);

    svg.append('g')
      .selectAll('rect')
      .data(yCorrelated)
      .enter()
      .append('rect')
      .attr('x', (_, i) => i * (width / yCorrelated.length))
      .attr('y', height + spacing)
      .attr('width', width / yCorrelated.length)
      .attr('height', height)
      .style('fill', (d) => d3.interpolateRdBu((d - d3.min(yCorrelated)!) / (d3.max(yCorrelated)! - d3.min(yCorrelated)!)))
      .style('cursor', 'pointer')
      .on('click', onClick);
  }, [r, onClick]);

  useEffect(() => {
    createChart();
  }, [createChart]);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{
        display: 'inline-block',
        padding: '5px',
        border: isHover ? '4px solid cornflowerblue' : '4px solid transparent',
        opacity: isHover ? 0.8 : 1,
        cursor: 'pointer',
      }}
    >
      <svg
        ref={d3Container}
        className="d3-component"
        width={width}
        height={height * 2 + spacing}
      />
    </div>
  );
}
