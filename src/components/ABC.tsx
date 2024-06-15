// HISTOGRAM!

import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const ABC: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const faithfulData = [
    -2.34, -5.32, -2.11, -1.78, -1.54, -0.32, 0.67, 0.78, 1.63, 1.73, 2.48,
    2.88, 6.72,
  ];
  const secondData = [-1.6, -1.1, -0.2, 1.5, 4.4, 5.8];

  useEffect(() => {
    const margin = { top: 20, right: 30, bottom: 30, left: 40 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    const xExtent = d3.extent([...faithfulData, ...secondData]) as [
      number,
      number
    ];
    const x = d3.scaleLinear().domain(xExtent).range([0, width]);

    const histogram = d3
      .histogram()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(10))
      .value((d) => d);

    const data1 = histogram(faithfulData as number[]);
    const data2 = histogram(secondData as number[]);

    const maxFrequency = d3.max([...data1, ...data2], (d) => d.length) || 1;
    data1.forEach((d: any) => {
      d.normalizedLength = d.length / maxFrequency;
    });
    data2.forEach((d: any) => {
      d.normalizedLength = d.length / maxFrequency;
    });

    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    const xAxis = d3.axisBottom(x).tickFormat((_, i) => {
      const bin = data1[i] || data2[i];
      return bin
        ? `[${Math.floor(bin.x0 ?? 0)}, ${Math.floor(bin.x1 ?? 0)})`
        : "";
    });

    const yAxis = d3.axisLeft(y);

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "1.0em")
      .attr("dy", "0.5em")
      .attr("transform", "rotate(0)");

    svg
      .append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("fill", "black")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 10)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .style("fill", "black")
      .text("Frequency");

    // Plot histogram for the first dataset
    svg
      .selectAll(".bar1")
      .data(data1)
      .enter()
      .append("rect")
      .attr("class", "bar1")
      .attr("x", (d) => x(d.x0 ?? 0))
      .attr("y", (d: any) => y(d.normalizedLength))
      .attr("width", x(data1[0].x1 ?? 0) - x(data1[0].x0 ?? 0) - 1)
      .attr("height", (d: any) => height - y(d.normalizedLength))
      .attr("fill", "steelblue");

    // Plot histogram for the second dataset
    svg
      .selectAll(".bar2")
      .data(data2)
      .enter()
      .append("rect")
      .attr("class", "bar2")
      .attr(
        "x",
        (d) => x(d.x0 ?? 0) + (x(data2[0].x1 ?? 0) - x(data2[0].x0 ?? 0)) / 2
      )
      .attr("y", (d: any) => y(d.normalizedLength))
      .attr("width", x(data2[0].x1 ?? 0) - x(data2[0].x0 ?? 0) - 1)
      .attr("height", (d: any) => height - y(d.normalizedLength))
      .attr("fill", "orange");

    console.log(data1);
    console.log(data2);
  }, [faithfulData, secondData]);

  return <svg ref={svgRef}></svg>;
};

export default ABC;
