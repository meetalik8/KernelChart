import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

function kernelDensityEstimator(kernel: (v: number) => number, x: number[]) {
  return function (sample: number[]) {
    return x.map(function (x) {
      return [x, d3.mean(sample, (v) => kernel(x - v))] as [number, number];
    });
  };
}

function epanechnikovKernel(scale: number) {
  return function (u: number) {
    return Math.abs((u /= scale)) <= 1 ? (0.75 * (1 - u * u)) / scale : 0;
  };
}

const Curve: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  useEffect(() => {
    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const faithfulData = [
      -5.32, -2.34, -2.11, -1.78, -1.54, -0.32, 0.67, 0.78, 1.63, 1.73, 2.48,
      2.88, 6.72,
    ];

    const xExtent = d3.extent(faithfulData) as [number, number];
    const x = d3.scaleLinear().domain(xExtent).range([0, width]);

    const bandwidth = 1.5;
    const kernel = epanechnikovKernel(bandwidth);
    const kde = kernelDensityEstimator(kernel, x.ticks(100));
    const kdeData = kde(faithfulData);

    const yExtent = [0, d3.max(kdeData, (d) => d[1]) as number];
    const y = d3.scaleLinear().domain(yExtent).range([height, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    const line = d3
      .line<[number, number]>()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]))
      .curve(d3.curveBasis);

    svg
      .append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(xAxis)
      .append("text")
      .attr("fill", "#000")
      .attr("x", width / 2)
      .attr("y", margin.bottom)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Value");

    svg
      .append("g")
      .call(yAxis)
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 10)
      .attr("dy", "-1.5em")
      .style("text-anchor", "middle")
      .text("Density");

    svg
      .append("path")
      .datum(kdeData)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5);

    // Add data points on the curve
    svg
      .selectAll(".dot")
      .data(kdeData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d[0]))
      .attr("cy", (d) => y(d[1]))
      .attr("r", 3)
      .attr("fill", "red");
  }, []);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Curve;
