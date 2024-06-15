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

const DensityPlotterUno: React.FC<{
  bandwidth: number;
  Data: number[];
  DataLabels: string[];
}> = ({ bandwidth, Data, DataLabels }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const margin = { top: 20, right: 30, bottom: 50, left: 50 };
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

useEffect(() => {
  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.style("background-color", "white");

  const g = svg
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const meanData = d3.mean(Data)!;
  const stdDevData = d3.deviation(Data)!;
  const xExtent = [(meanData - 4 * stdDevData), meanData + 4 * stdDevData];
  const x = d3.scaleLinear().domain(xExtent).range([0, width]);
    g.append("circle")
      .attr("cx", x(meanData))
      .attr("cy", height)
      .attr("r", 8)
      .attr("fill", "green")
      .attr("opacity", 0.5)
      .on("mouseover", function () {
        const xPos = parseFloat(d3.select(this).attr("cx")) + margin.left;
        const yPos = parseFloat(d3.select(this).attr("cy")) + margin.top - 10;
        g.append("text")
          .attr("class", "tooltip")
          .attr("x", xPos)
          .attr("y", yPos - 20)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", "black")
          .text(`Mean of Data: ${meanData.toFixed(2)}`);
      })
      .on("mouseout", function () {
        g.select(".tooltip").remove();
      });

    const kernel = epanechnikovKernel(bandwidth);
    const kde = kernelDensityEstimator(kernel, x.ticks(100));
    const kdeData = kde(Data);
    console.log(kdeData);
    const yKDE = d3
      .scaleLinear()
      .domain([0, d3.max(kdeData, (d) => d[1]) || 1])
      .range([height, 0]);

    
    const xAxis = d3.axisBottom(x).ticks(10).tickFormat(d3.format(".0f"));
    const yAxis = d3.axisLeft(yKDE);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .call((g) => g.selectAll(".domain, .tick line").attr("stroke", "#000"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#000"))
      .append("text")
      .attr("class", "x-axis-label")
      .attr("fill", "#000")
      .attr("x", width / 2)
      .attr("y", margin.bottom - 10)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Value");

    g.append("g")
      .call(yAxis)
      .call((g) => g.selectAll(".domain, .tick line").attr("stroke", "#000"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#000"))
      .append("text")
      .attr("class", "y-axis-label")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 10)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text("Density");

    const line = d3
      .line<[number, number]>()
      .x((d) => x(d[0]))
      .y((d) => yKDE(d[1]))
      .curve(d3.curveBasis);

    g.append("path")
      .datum(kdeData)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5);

    const kdeInterpolator = d3
      .scaleLinear()
      .domain(kdeData.map((d) => d[0]))
      .range(kdeData.map((d) => d[1]));

    const dataWithKde = Data.map((d) => {
      const kdeValue = kdeInterpolator(d);
      return { x: d, y: kdeValue };
    });

    g.selectAll(".dot")
      .data(dataWithKde)
      .enter()
      .append("circle")
      .attr("class", "dot1")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => yKDE(d.y))
      .attr("r", 3)
      .on("mouseover", function (_, d) {
        d3.select(this).attr("r", 6).attr("fill", "orange");
        let xPos = x(d.x);
        let yPos = yKDE(d.y);
        if (yPos < 0) {
          yPos = 10;
        }
        if (yPos > height) {
          yPos = height - 10;
        }
        if (xPos < 0) {
          xPos = 10;
        }
        if (xPos + 100 > width) {
          xPos = width - 100;
        }
        const label =
          DataLabels.find((_, index) => Data[index] === d.x) || "";
         g.append("text")
            .attr("class", "tooltip")
            .attr("x", xPos + 10)
            .attr("y", yPos - 10)
            .attr("fill", "black")
            .text(`${label}(${d.x.toFixed(3)})`);
        })
      .on("mouseout", function () {
        d3.select(this).attr("r", 3).attr("fill", "red");
        g.select(".tooltip").remove();
      });

    g.append("line")
      .attr("x1", x(meanData - stdDevData))
      .attr("y1", height)
      .attr("x2", x(meanData + stdDevData))
      .attr("y2", height)
      .attr("stroke", "green")
      .attr("stroke-width", 6);

    g.append("line")
      .attr("x1", x(meanData - 2 * stdDevData))
      .attr("y1", height)
      .attr("x2", x(meanData + 2 * stdDevData))
      .attr("y2", height)
      .attr("stroke", "green")
      .attr("stroke-width", 3);
  }, [bandwidth, Data, DataLabels]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default DensityPlotterUno;
