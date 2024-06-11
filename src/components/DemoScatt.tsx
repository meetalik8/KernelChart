import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

type DemoScattProps = {
  width: number;
  height: number;
  data: { x: number; y: number }[];
};

export const DemoScatt: React.FC<DemoScattProps> = ({
  width,
  height,
  data,
}: DemoScattProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const scale = d3.scaleLinear().domain([0, 10]).range([0, 200]);

    const svg = d3.select(svgRef.current);

    svg.selectAll("circle").remove();

    svg
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => scale(d.x)) // Using scale for x value
      .attr("cy", (d) => d.y)
      .attr("r", 5)
      .style("fill", "steelblue");

    const range = scale.range();

    const ticks = scale.ticks(Math.floor((range[1] - range[0]) / 50));

    svg
      .selectAll(".x-axis")
      .data([0])
      .enter()
      .append("g")
      .classed("x-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(scale).tickValues(ticks));

    svg
      .selectAll(".y-axis")
      .data([0])
      .enter()
      .append("g")
      .classed("y-axis", true)
      .attr("transform", `translate(0, ${height})`)
      .call(
        d3.axisLeft(
          d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.y)!])
            .range([height, 0])
        )
      );
  }, [data, height, width]);

  return (
    <div>
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};
