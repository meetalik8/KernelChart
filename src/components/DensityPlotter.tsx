import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

// These 2 functions are used for finding the points for the kernel density line (it generates x&y coordinates for input values).
function kernelDensityEstimator(kernel: (v: number) => number, x: number[]) {
  return function (sample: number[]) {
    return x.map(function (x) {
      return [x, d3.mean(sample, (v) => kernel(x - v))!] as [number, number];
    });
  };
}

function epanechnikovKernel(scale: number) {
  return function (u: number) {
    return Math.abs((u /= scale)) <= 1 ? (0.75 * (1 - u * u)) / scale : 0;
  };
}
function calculateMultiplier(stdDevData: number): number {
  if (stdDevData < 10) {
    return 5; 
  } else {
    return 3; 
  }
}
const DensityPlotter: React.FC<{
  bandwidth: number;
  datasets: number[][];
  labels: string[][];
}> = ({ bandwidth, datasets, labels }) => {
   if (bandwidth > 20) {
     alert("Bandwidth should be less than or equal to 20!");
   }
  const svgRef = useRef<SVGSVGElement | null>(null);
  const margin = { top: 20, right: 30, bottom: 50, left: 50 };
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  const colors = d3.schemeCategory10;

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

    const allData = datasets.flat();
    const meanData = d3.mean(allData)!;
    console.log(`Mean of all ${meanData}`);
    const stdDevData = d3.deviation(allData)!;
    const multiplier = calculateMultiplier(stdDevData);
    const xExtent = [
      meanData - multiplier * stdDevData,
      meanData + multiplier * stdDevData,
    ];
    console.log(`Extent: ${xExtent}`);
    console.log(`Std of all ${stdDevData}`);
    console.log(`Multiplier ${multiplier}`);

    const maxStdDev = d3.max(datasets.map((data) => d3.deviation(data)|| 0))!;

    const xExtentAdjusted = [
      meanData - multiplier * maxStdDev,
      meanData + multiplier * maxStdDev,
    ];

    const x = d3.scaleLinear().domain(xExtentAdjusted).range([0, width]);

    const kernel = epanechnikovKernel(bandwidth);
    const kde = kernelDensityEstimator(kernel, x.ticks(100));
    const kdeDataAll = datasets.map((data) => kde(data));
    const yMax = d3.max(kdeDataAll.flat(), (d) => d[1]) || 1;
    const yScaleFactor = 1.2;
    const yKDE = d3.scaleLinear().domain([0, yMax * yScaleFactor]).range([height, 0]);
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
      .curve(d3.curveCardinal);

    datasets.forEach((data, i) => {
      console.log(data);
      const mean = d3.mean(data)!;
      const stdDev = d3.deviation(data)!;
      const color = colors[i % colors.length];
      console.log(`Mean of single data: ${mean}`);
      console.log(`STDdev of single data ${stdDev} `);


      // mean circle
      g.append("circle")
        .attr("cx", x(mean))
        .attr("cy", height - i * 20 - 0.2 * margin.bottom)
        .attr("r", 8)
        .attr("fill", color)
        .attr("opacity", 0.5)
        .on("mouseover", function () {
          const xPos = parseFloat(d3.select(this).attr("cx")) + margin.left;
          const yPos = parseFloat(d3.select(this).attr("cy")) + margin.top - 10;
          g.select(".tooltip").remove();
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", xPos)
            .attr("y", yPos - 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text(`Mean of Data${i + 1}: ${mean.toFixed(2)}`);
        })
        .on("mouseout", function () {
          g.select(".tooltip").remove();
        });

        
      const kdeValues = kde(data);
      g.append("path")
        .datum(kdeValues)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      const kdeX = kdeValues.map((d) => d[0]);
      const kdeY = kdeValues.map((d) => d[1]);
      const kdeInterpolator = d3.scaleLinear().domain(kdeX).range(kdeY);

      const dataWithKde = data.map((d) => {
        const kdeValue = kdeInterpolator(d);
        return { x: d, y: kdeValue };
      });

      g.selectAll(`.dot${i}`)
        .data(dataWithKde)
        .enter()
        .append("circle")
        .attr("class", `dot${i}`)
        .attr("cx", (d) => x(d.x))
        .attr("cy", (d) => yKDE(d.y))
        .attr("stroke", "black")
        .attr("r", 3)
        .attr("fill", color)
        .on("mouseover", function (event, d) {
          d3.select(this).attr("r", 6).attr("fill", color);
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
            labels[i].find((item, index) => datasets[i][index] === d.x) || "";
          g.select(".tooltip").remove();
          g.append("text")
            .attr("class", "tooltip")
            .attr("x", xPos + 10)
            .attr("y", yPos - 10)
            .attr("fill", "black")
            .text(`${label} (${d.x.toFixed(3)})`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 3).attr("fill", color);
          g.select(".tooltip").remove();
        });

      g.append("line")
        .attr("x1", x(mean - stdDev))
        .attr("y1", height - i * 20 - 0.2 * margin.bottom)
        .attr("x2", x(mean + stdDev))
        .attr("y2", height - i * 20 - 0.2 * margin.bottom)
        .attr("stroke", color)
        .attr("stroke-width", 6);

      g.append("line")
        .attr("x1", x(mean - 2 * stdDev))
        .attr("y1", height - i * 20 - 0.2 * margin.bottom)
        .attr("x2", x(mean + 2 * stdDev))
        .attr("y2", height - i * 20 - 0.2 * margin.bottom)
        .attr("stroke", color)
        .attr("stroke-width", 3);

      const legend = g
        .append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - margin.right},${i * 20})`);

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
    });
  }, [bandwidth, datasets, labels]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default DensityPlotter;
