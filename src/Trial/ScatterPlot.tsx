import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const MARGIN = { top: 20, right: 30, bottom: 50, left: 50 };

const Scatterplot: React.FC<{
  width: number;
  height: number;
  datasets: { x: number; y: number }[][];
  labels: string[];
}> = ({ width, height, datasets, labels }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    svg.style("background-color", "white");

    const g = svg
      .attr("width", width + MARGIN.left + MARGIN.right)
      .attr("height", height + MARGIN.top + MARGIN.bottom)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const colors = d3.schemeCategory10;

    // Calculate the maximum and minimum values of x and y across all datasets
    const maxX = d3.max(datasets.flat(), (d) => d.x) || 10;
    const maxY = d3.max(datasets.flat(), (d) => d.y) || 10;
    const minX = d3.min(datasets.flat(), (d) => d.x) || 0;
    const minY = d3.min(datasets.flat(), (d) => d.y) || 0;

    const bufferX = 3;
    const bufferY = 3;
    const xScale = d3
      .scaleLinear()
      .domain([minX, maxX + bufferX])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([minY, maxY + bufferY])
      .range([height, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .call((g) => g.selectAll(".domain, .tick line").attr("stroke", "#000"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#000"))
      .append("text")
      .attr("class", "x-axis-label")
      .attr("fill", "#000")
      .attr("x", width / 2)
      .attr("y", MARGIN.bottom - 10)
      .attr("dy", "1em")
      .style("text-anchor", "middle");

    g.append("g")
      .call(yAxis)
      .call((g) => g.selectAll(".domain, .tick line").attr("stroke", "#000"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#000"))
      .append("text")
      .attr("class", "y-axis-label")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -MARGIN.left + 10)
      .attr("dy", "1em")
      .style("text-anchor", "middle");

    datasets.forEach((data, i) => {
      const color = colors[i % colors.length];

      // Render circles for each data point
      g.selectAll(`.dot${i}`)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", `dot${i}`)
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("stroke", color) // Set stroke color
        .attr("stroke-opacity", 1) // Set stroke opacity to 1
        .attr("stroke-width", 1)
        .attr("r", 5)
        .attr("fill", color)
        .attr("fill-opacity", 0.2);

      const legend = g
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - MARGIN.right},${i * 20})`);

      legend
        .append("rect")
        .attr("x", -18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

      legend
        .append("text")
        .attr("x", -24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(`Dataset ${i + 1}`);
      // Add labels
      // g.append("text")
      //   .attr("class", `label${i}`)
      //   .attr("x", width - 60)
      //   .attr("y", height - i * 20)
      //   .text(labels[i])
      //   .style("font-size", "12px")
      //   .style("fill", color);
    });
    
  }, [width, height, datasets, labels]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Scatterplot;
