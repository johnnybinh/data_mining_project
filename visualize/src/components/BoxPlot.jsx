import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BoxPlot = ({ data, attribute, width = 400, height = 300, margin = { top: 20, right: 20, bottom: 50, left: 60 } }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Calculate quartiles and statistics
    const values = data.map(d => d[attribute]).sort(d3.ascending);
    const q1 = d3.quantile(values, 0.25);
    const q2 = d3.quantile(values, 0.5); // median
    const q3 = d3.quantile(values, 0.75);
    const iqr = q3 - q1;
    const min = d3.min(values);
    const max = d3.max(values);
    
    // Whiskers (1.5 * IQR)
    const lowerWhisker = Math.max(min, q1 - 1.5 * iqr);
    const upperWhisker = Math.min(max, q3 + 1.5 * iqr);
    
    // Outliers
    const outliers = values.filter(d => d < lowerWhisker || d > upperWhisker);

    // Scale
    const yScale = d3
      .scaleLinear()
      .domain([Math.min(min, lowerWhisker - iqr * 0.5), Math.max(max, upperWhisker + iqr * 0.5)])
      .nice()
      .range([innerHeight, 0]);

    const boxWidth = 60;
    const centerX = innerWidth / 2;

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(255, 255, 255, 0.95)')
      .style('border', '1px solid #b1ada1')
      .style('border-radius', '8px')
      .style('padding', '10px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
      .style('z-index', '1000');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(8);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '11px')
      .style('fill', '#b1ada1');

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale).ticks(8).tickSize(-innerWidth))
      .selectAll('line')
      .style('stroke', '#b1ada1')
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);

    g.selectAll('.grid .tick text').remove();

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -innerHeight / 2)
      .style('text-anchor', 'middle')
      .style('font-size', '13px')
      .style('fill', '#c15f3c')
      .style('font-weight', '500')
      .text(attribute.replace(/_/g, ' '));

    // Lower whisker
    g.append('line')
      .attr('x1', centerX)
      .attr('x2', centerX)
      .attr('y1', yScale(lowerWhisker))
      .attr('y2', yScale(q1))
      .attr('stroke', '#c15f3c')
      .attr('stroke-width', 2);

    // Upper whisker
    g.append('line')
      .attr('x1', centerX)
      .attr('x2', centerX)
      .attr('y1', yScale(q3))
      .attr('y2', yScale(upperWhisker))
      .attr('stroke', '#c15f3c')
      .attr('stroke-width', 2);

    // Whisker caps
    g.append('line')
      .attr('x1', centerX - boxWidth / 4)
      .attr('x2', centerX + boxWidth / 4)
      .attr('y1', yScale(lowerWhisker))
      .attr('y2', yScale(lowerWhisker))
      .attr('stroke', '#c15f3c')
      .attr('stroke-width', 2);

    g.append('line')
      .attr('x1', centerX - boxWidth / 4)
      .attr('x2', centerX + boxWidth / 4)
      .attr('y1', yScale(upperWhisker))
      .attr('y2', yScale(upperWhisker))
      .attr('stroke', '#c15f3c')
      .attr('stroke-width', 2);

    // Box (Q1 to Q3)
    const box = g.append('rect')
      .attr('x', centerX - boxWidth / 2)
      .attr('y', yScale(q3))
      .attr('width', boxWidth)
      .attr('height', yScale(q1) - yScale(q3))
      .attr('fill', '#c15f3c')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#c15f3c')
      .attr('stroke-width', 2)
      .on('mouseover', function(event) {
        d3.select(this).attr('fill-opacity', 0.5);
        tooltip
          .transition()
          .duration(200)
          .style('opacity', 1);
        tooltip
          .html(`
            <div style="font-weight: 600; margin-bottom: 4px; color: #1a1a1a;">
              ${attribute.replace(/_/g, ' ')} Statistics
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              Min: <strong>${min.toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              Q1: <strong>${q1.toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              Median: <strong>${q2.toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              Q3: <strong>${q3.toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              Max: <strong>${max.toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280;">
              IQR: <strong>${iqr.toFixed(4)}</strong>
            </div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill-opacity', 0.3);
        tooltip
          .transition()
          .duration(200)
          .style('opacity', 0);
      });

    // Median line
    g.append('line')
      .attr('x1', centerX - boxWidth / 2)
      .attr('x2', centerX + boxWidth / 2)
      .attr('y1', yScale(q2))
      .attr('y2', yScale(q2))
      .attr('stroke', '#b1ada1')
      .attr('stroke-width', 2);

    // Outliers
    if (outliers.length > 0) {
      g.selectAll('.outlier')
        .data(outliers)
        .enter()
        .append('circle')
        .attr('cx', centerX)
        .attr('cy', d => yScale(d))
        .attr('r', 4)
        .attr('fill', '#dc2626')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .style('opacity', 0.8)
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6)
            .style('opacity', 1);
          tooltip
            .transition()
            .duration(200)
            .style('opacity', 1);
          tooltip
            .html(`
              <div style="font-weight: 600; margin-bottom: 4px; color: #1a1a1a;">
                Outlier
              </div>
              <div style="color: #6b7280;">
                Value: <strong>${d.toFixed(4)}</strong>
              </div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 4)
            .style('opacity', 0.8);
          tooltip
            .transition()
            .duration(200)
            .style('opacity', 0);
        });
    }

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, attribute, width, height, margin]);

  return (
    <div style={{ margin: '20px' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block', margin: '0 auto' }}
      />
    </div>
  );
};

export default BoxPlot;
