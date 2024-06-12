import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const MARGIN = { top: 20, right: 30, bottom: 50, left: 50 };

function calculateMean(dataset: { x: number; y: number }[]): [number, number] {
  const n = dataset.length;
  const sumX = dataset.reduce((acc: number, point: any) => acc + point.x, 0);
  const sumY = dataset.reduce((acc: number, point: any) => acc + point.y, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;
  return [meanX, meanY];
}

function calculateCovarianceMatrix(
  dataset: { x: number; y: number }[],
  mean: [number, number]
): [[number, number], [number, number]] {
  const n = dataset.length;
  let covXX = 0;
  let covXY = 0;
  let covYY = 0;
  for (const point of dataset) {
    covXX += Math.pow(point.x - mean[0], 2);
    covXY += (point.x - mean[0]) * (point.y - mean[1]);
    covYY += Math.pow(point.y - mean[1], 2);
  }
  covXX /= n;
  covXY /= n;
  covYY /= n;
  return [
    [covXX, covXY],
    [covXY, covYY],
  ];
}

function calculateConfidenceRectangle(
  mu: [number, number],
  sigma: [[number, number], [number, number]],
  sdMultiplier: number
): { x: number; y: number; width: number; height: number } {
  const standardDeviationX = Math.sqrt(sigma[0][0]);
  const standardDeviationY = Math.sqrt(sigma[1][1]);
  const width = standardDeviationX * 2 * sdMultiplier;
  const height = standardDeviationY * 2 * sdMultiplier;
  const x = mu[0] - width / 2;
  const y = mu[1] - height / 2;
  return { x, y, width, height };
}

function plotErrorEllipse(
  mu: [number, number],
  Sigma: [[number, number], [number, number]],
  p: number = 0.95
): { cx: number; cy: number; rx: number; ry: number; angle: number } {
  const s = -2 * Math.log(1 - p);
  const a = Sigma[0][0];
  const b = Sigma[0][1];
  const c = Sigma[1][0];
  const d = Sigma[1][1];

  const tmp = Math.sqrt((a - d) * (a - d) + 4 * b * c);
  const V = [
    [-(tmp - a + d) / (2 * c), (tmp + a - d) / (2 * c)],
    [1, 1],
  ];
  const sqrtD = [
    Math.sqrt((s * (a + d - tmp)) / 2),
    Math.sqrt((s * (a + d + tmp)) / 2),
  ];

  const norm1 = Math.hypot(V[0][0], 1);
  const norm2 = Math.hypot(V[0][1], 1);
  V[0][0] /= norm1;
  V[1][0] /= norm1;
  V[0][1] /= norm2;
  V[1][1] /= norm2;

  const ndx = sqrtD[0] < sqrtD[1] ? 1 : 0;

  const x1 = mu[0] + V[0][ndx] * sqrtD[ndx];
  const y1 = mu[1] + V[1][ndx] * sqrtD[ndx];

  const x2 = mu[0] + V[0][1 - ndx] * sqrtD[1 - ndx];
  const y2 = mu[1] + V[1][1 - ndx] * sqrtD[1 - ndx];

  const ellipseData = {
    cx: mu[0],
    cy: mu[1],
    rx: Math.hypot(x1 - mu[0], y1 - mu[1]),
    ry: Math.hypot(x2 - mu[0], y2 - mu[1]),
    angle: (Math.atan2(y1 - mu[1], x1 - mu[0]) * 180) / Math.PI,
  };

  return ellipseData;
}

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

const Scatterplot: React.FC<{
  width: number;
  height: number;
  datasets: { x: number; y: number }[][];
  labels: string[];
  plotType: "ellipse" | "rectangle";
  p?: number;
  bandwidth?: number;
}> = ({
  width,
  height,
  datasets,
  labels,
  plotType,
  p = 0.95,
  bandwidth = 4,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    svg.style("background-color", "white");
    const boundsWidth = width - MARGIN.right - MARGIN.left;
    const boundsHeight = height - MARGIN.top - MARGIN.bottom;
    const g = svg
      .attr("width", width + MARGIN.left + MARGIN.right)
      .attr("height", height + MARGIN.top + MARGIN.bottom)
      .append("g")
      .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

    const colors = d3.schemeCategory10;

    const mu: [number, number][] = datasets.map((dataset) =>
      calculateMean(dataset)
    );

    const Sigma = datasets.map((dataset, index) =>
      calculateCovarianceMatrix(dataset, mu[index])
    );

    const maxX = d3.max(datasets.flat(), (d) => d.x) || 10;
    const maxY = d3.max(datasets.flat(), (d) => d.y) || 10;
    const minX = d3.min(datasets.flat(), (d) => d.x) || 0;
    const minY = d3.min(datasets.flat(), (d) => d.y) || 0;

    const bufferX = 3;
    const bufferY = 3;
    const xScale = d3
      .scaleLinear()
      .domain([minX - bufferX, maxX + bufferX])
      .range([0, boundsWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([minY - bufferY, maxY + bufferY])
      .range([boundsHeight, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("transform", `translate(0,${boundsHeight})`)
      .call(xAxis)
      .call((g) => g.selectAll(".domain, .tick line").attr("stroke", "#000"))
      .call((g) => g.selectAll(".tick text").attr("fill", "#000"))
      .append("text")
      .attr("class", "x-axis-label")
      .attr("fill", "#000")
      .attr("x", boundsWidth / 2)
      .attr("y", MARGIN.bottom - 1)
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
      .attr("x", -boundsHeight / 2)
      .attr("y", -MARGIN.left + 10)
      .attr("dy", "1em")
      .style("text-anchor", "middle");

    datasets.forEach((data, i) => {
      const color = colors[i % colors.length];

      g.selectAll(`.dot${i}`)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", `dot${i}`)
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("stroke", color)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 1)
        .attr("r", 2.5)
        .attr("fill", color)
        .attr("fill-opacity", 0.5);

      const legend = g
        .append("g")
        .attr("class", "legend")
        .attr(
          "transform",
          `translate(${boundsWidth - MARGIN.right},${i * 20})`
        );

      legend
        .append("rect")
        .attr("x", MARGIN.right)
        .attr("y", MARGIN.top - 10)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

      legend
        .append("text")
        .attr("x", MARGIN.right - 10)
        .attr("y", MARGIN.top)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(labels[i]);

      if (plotType === "rectangle") {
        [2, 3].forEach((sdMultiplier) => {
          const rectData = calculateConfidenceRectangle(
            mu[i],
            Sigma[i],
            sdMultiplier
          );
          const rectX = xScale(rectData.x);
          const rectY = yScale(rectData.y + rectData.height);
          const rectWidth =
            xScale(rectData.x + rectData.width) - xScale(rectData.x);
          const rectHeight =
            yScale(rectData.y) - yScale(rectData.y + rectData.height);

          g.append("rect")
            .attr("x", rectX)
            .attr("y", rectY)
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .style("fill", "none")
            .style("stroke", color)
            .style("stroke-width", 1.5)
            .style("stroke-dasharray", sdMultiplier === 3 ? "4 2" : "none");
        });
      } else if (plotType === "ellipse") {
        [0.95, 0.99].forEach((confidence, j) => {
          const ellipseData = plotErrorEllipse(mu[i], Sigma[i], confidence);

          const cx = xScale(ellipseData.cx);
          const cy = yScale(ellipseData.cy);
          const rx = xScale(mu[i][0] + ellipseData.rx) - xScale(mu[i][0]);
          const ry = yScale(mu[i][1]) - yScale(mu[i][1] + ellipseData.ry);

          g.append("ellipse")
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("rx", Math.abs(rx))
            .attr("ry", Math.abs(ry))
            .attr("transform", `rotate(${ellipseData.angle}, ${cx}, ${cy})`)
            .style("fill", "none")
            .style("stroke", color)
            .style("stroke-width", 1.5)
            .style("stroke-dasharray", j === 1 ? "4 2" : "none");
        });
      }

      const kdeX = kernelDensityEstimator(
        epanechnikovKernel(bandwidth),
        xScale.ticks(100)
      );
      const kdeY = kernelDensityEstimator(
        epanechnikovKernel(bandwidth),
        yScale.ticks(100)
      );

      const kdeDataX = kdeX(data.map((d) => d.x));
      const kdeDataY = kdeY(data.map((d) => d.y));

      const kdeXGroup = svg
        .append("g")
        .attr(
          "transform",
          `translate(${MARGIN.left},${MARGIN.top + boundsHeight + 40})`
        );

      const lineX = d3
        .line()
        .x((d) => xScale(d[0]))
        .y((d) => -d[1] * 40)
        .curve(d3.curveBasis);

      kdeXGroup
        .append("path")
        .datum(kdeDataX)
        .attr("class", "kde-x")
        .attr("d", lineX)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2);

      const kdeYGroup = svg
        .append("g")
        .attr(
          "transform",
          `translate(${MARGIN.left + boundsWidth + 30},${MARGIN.top})`
        );

      const lineY = d3
        .line()
        .x((d) => d[1] * 40)
        .y((d) => yScale(d[0]))
        .curve(d3.curveBasis);
      console.log(
        d3
          .line()
          .x((d) => d[1] * 20)
          .y((d) => yScale(d[0]))
      );

      kdeYGroup
        .append("path")
        .datum(kdeDataY)
        .attr("class", "kde-y")
        .attr("d", lineY)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2);
    });
  }, [width, height, datasets, labels, plotType, p, bandwidth]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Scatterplot;
