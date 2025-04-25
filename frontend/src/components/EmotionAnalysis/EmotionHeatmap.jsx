import React, { useEffect, useRef } from 'react';
import { Box, Card, Typography } from '@mui/material';
import { styled } from '@mui/system';
import * as d3 from 'd3';
import emotionAnalysisService from '../../services/emotionAnalysis.service';

const HeatmapContainer = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  marginTop: theme.spacing(2)
}));

const EmotionHeatmap = ({ sessionData }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    if (sessionData && svgRef.current) {
      drawHeatmap();
    }
  }, [sessionData]);

  const drawHeatmap = () => {
    const heatmapData = emotionAnalysisService.getEmotionHeatmap();
    const data = Object.entries(heatmapData).map(([time, value]) => ({
      time: parseInt(time),
      emotion: value.dominantEmotion,
      intensity: value.intensity
    }));

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 30, left: 60 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Set up scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.time)))
      .range([0, width]);

    const emotions = ['happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted', 'neutral'];
    const yScale = d3.scaleBand()
      .domain(emotions)
      .range([height, 0])
      .padding(0.1);

    const colorScale = d3.scaleSequential()
      .domain([0, 1])
      .interpolator(d3.interpolateRdYlBu);

    // Draw heatmap cells
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => xScale(new Date(d.time)))
      .attr('y', d => yScale(d.emotion))
      .attr('width', width / data.length)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => colorScale(d.intensity))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .append('title')
      .text(d => `${d.emotion}: ${(d.intensity * 100).toFixed(1)}%`);

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d3.timeFormat('%H:%M:%S'));

    const yAxis = d3.axisLeft(yScale);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    svg.append('g')
      .call(yAxis);

    // Add labels
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Emotions');

    svg.append('text')
      .attr('transform', `translate(${width/2},${height + margin.bottom})`)
      .style('text-anchor', 'middle')
      .text('Time');
  };

  return (
    <HeatmapContainer>
      <Typography variant="h6" gutterBottom>
        Emotion Heatmap
      </Typography>
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <svg ref={svgRef} style={{ width: '100%', minWidth: '500px' }} />
      </Box>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        Intensity of emotions over time. Darker colors indicate stronger emotions.
      </Typography>
    </HeatmapContainer>
  );
};

export default EmotionHeatmap;
