import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  x: number;
  y: number;
}

interface KernelDensityPlotProps {
  data1: DataPoint[];
  data2: DataPoint[];
  width: number;
  height: number;
}

const KernelDensityPlot: React.FC<KernelDensityPlotProps> = ({
  data1,
  data2,
  width,
  height,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!data1.length && !data2.length) return;
    // console.log("Data 1:", data1);
  // console.log("Data 2:", data2);

    const margin = { top: 20, right: 100, bottom: 30, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

   const xExtent1: [number, number] = data1.length
     ? (d3.extent(data1, (d) => d.x) as [number, number])
     : [0, 1];
   const xExtent2: [number, number] = data2.length
     ? (d3.extent(data2, (d) => d.x) as [number, number])
     : [0, 1];
    const xExtent = [
      d3.min([xExtent1[0], xExtent2[0]]) ?? 0,
      d3.max([xExtent1[1], xExtent2[1]]) ?? 1,
    ];
    const yExtent = [0, d3.max([...data1, ...data2], (d) => d.y) ?? 1];
    const x = d3.scaleLinear().domain(xExtent).range([0, innerWidth]);
    const y = d3.scaleLinear().domain(yExtent).range([innerHeight, 0]);

    g.append("path")
      .datum(data1)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr(
        "d",
        d3
          .line<DataPoint>()
          .x((d) => x(d.x))
          .y((d) => y(d.y))
          .curve(d3.curveBasis)
      )
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

    function showTooltip(x: number, y: number, density: number) {
      const tooltip = d3.select("#tooltip");
      tooltip
        .style("display", "block")
        .style("left", `${x}px`)
        .style("top", `${y}px`)
        .text(`Probability Density: ${density.toFixed(2)}`);
    }

    function hideTooltip() {
      d3.select("#tooltip").style("display", "none");
    }

    g.selectAll(".point1")
      .data(data1)
      .enter()
      .append("circle")
      .attr("class", "point1")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 3)
      .attr("fill", "blue")
      .on("mouseover", function (event, d: any) {
        const [xCoord, yCoord] = d3.pointer(event);
        const density = d.y;
        showTooltip(xCoord, yCoord, density);
      })
      .on("mouseout", function () {
        hideTooltip();
      });

    g.append("path")
      .datum(data2)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr(
        "d",
        d3
          .line<DataPoint>()
          .x((d) => x(d.x))
          .y((d) => y(d.y))
          .curve(d3.curveBasis)
      )
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

    g.selectAll(".point2")
      .data(data2)
      .enter()
      .append("circle")
      .attr("class", "point2")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 3)
      .attr("fill", "green")
      .on("mouseover", function (event, d: any) {
        const [xCoord, yCoord] = d3.pointer(event);
        const density = d.y;
        showTooltip(xCoord, yCoord, density);
      })
      .on("mouseout", function () {
        hideTooltip();
      });

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("fill", "white")
      .attr("x", innerWidth / 2)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .text("Data");

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("fill", "white")
      .attr("transform", "rotate(-90)")
      .attr("x", -(innerHeight / 2))
      .attr("y", -margin.left + 20)
      .attr("text-anchor", "middle")
      .text("Probability Density");
  }, [data1, data2, width, height]);

  return (
    <div style={{ position: "relative" }}>
      <svg ref={svgRef}></svg>
      <div
        id="tooltip"
        style={{
          display: "none",
          position: "absolute",
          backgroundColor: "white",
          padding: "5px",
          border: "1px solid black",
        }}
      ></div>
    </div>
  );
};

export default KernelDensityPlot;


