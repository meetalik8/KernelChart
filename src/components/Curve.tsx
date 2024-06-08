import React, { useEffect, useRef, useState } from "react";
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
  const margin = { top: 20, right: 30, bottom: 50, left: 50 }; // Adjusted margins for labels
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  const [bandwidth, setBandwidth] = useState(7);

  const faithfulData = [-1.6, -1.1, -0.2, 1.5, 4.4, 5.8];
  const newData = [
    -5.32, -2.34, -2.11, -1.78, -1.54, -0.32, 0.67, 0.78, 1.63, 1.73, 2.48,
    2.88, 6.72,
  ];
  const labels1 = ["L1", "L2", "L3", "L4", "L5", "L6"];
  const faithfulDataWithLabels = faithfulData.map((value, index) => {
    return { value, label: labels1[index] };
  });
  const labels2 = [
    "L1",
    "L2",
    "L3",
    "L4",
    "L5",
    "L6",
    "L7",
    "L8",
    "L9",
    "L10",
    "L11",
    "L12",
    "L13",
  ];
  const newDataWithLabels = newData.map((value, index) => {
    return { value, label: labels2[index] };
  });

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

    const xExtent = d3.extent([...faithfulData, ...newData]) as [
      number,
      number
    ];
    const x = d3.scaleLinear().domain(xExtent).range([0, width]);

    const kernel = epanechnikovKernel(bandwidth);
    const kde = kernelDensityEstimator(kernel, x.ticks(100));
    const kdeData1 = kde(faithfulData);
    const kdeData2 = kde(newData);

    const yKDE = d3
      .scaleLinear()
      .domain([0, d3.max([...kdeData1, ...kdeData2], (d) => d[1]) || 1])
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
      .datum(kdeData1)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "green")
      .attr("stroke-width", 1.5);

    g.append("path")
      .datum(kdeData2)
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "blue")
      .attr("stroke-width", 1.5);

    const kdeInterpolator1 = d3
      .scaleLinear()
      .domain(kdeData1.map((d) => d[0]))
      .range(kdeData1.map((d) => d[1]));

    const dataWithKde1 = faithfulData.map((d) => {
      const kdeValue = kdeInterpolator1(d);
      return { x: d, y: kdeValue };
    });

    g.selectAll(".dot1")
      .data(dataWithKde1)
      .enter()
      .append("circle")
      .attr("class", "dot1")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => yKDE(d.y))
      .attr("r", 3)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 6).attr("fill", "orange");
        const xPos = x(d.x);
        let yPos = yKDE(d.y);
        if (yPos < 0) {
          yPos = 10;
        }
        if (yPos > height) {
          yPos = height - 10;
        }

        const label =
          faithfulDataWithLabels.find((item) => item.value === d.x)?.label ||
          "";
        g.append("text")
          .attr("class", "tooltip")
          .attr("x", xPos + 10)
          .attr("y", yPos - 10)
          .attr("fill", "black")
          .text(`${label}(${d.x.toFixed(3)})`);
      })
      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", 3).attr("fill", "red");
        g.select(".tooltip").remove();
      });

    const kdeInterpolator2 = d3
      .scaleLinear()
      .domain(kdeData2.map((d) => d[0]))
      .range(kdeData2.map((d) => d[1]));

    const dataWithKde2 = newData.map((d) => {
      const kdeValue = kdeInterpolator2(d);
      return { x: d, y: kdeValue };
    });

    g.selectAll(".dot2")
      .data(dataWithKde2)
      .enter()
      .append("circle")
      .attr("class", "dot2")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => yKDE(d.y))
      .attr("r", 3)
      .on("mouseover", function (event, d) {
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
          newDataWithLabels.find((item) => item.value === d.x)?.label || "";
        g.append("text")
          .attr("class", "tooltip")
          .attr("x", xPos + 10)
          .attr("y", yPos - 10)
          .attr("fill", "black")
          .text(`${label}(${d.x.toFixed(3)})`);
      })

      .on("mouseout", function (event, d) {
        d3.select(this).attr("r", 3).attr("fill", "orange");
        g.select(".tooltip").remove();
      });
  }, [bandwidth]);

  return (
    <div>
      <svg ref={svgRef}></svg>
      <input
        type="range"
        min="1"
        max="20"
        value={bandwidth}
        onChange={(e) => setBandwidth(Number(e.target.value))}
      />
      <div style={{ color: "white" }}>Bandwidth: {bandwidth}</div>
    </div>
  );
};

export default Curve;
