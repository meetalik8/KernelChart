import React from "react";
import Scatterplot from "./ScatterPlot";
import * as d3 from "d3";

// Function to generate random dataset
const generateRandomDataset = (
  numPoints: number,
  mean: [number, number],
  cov: [[number, number], [number, number]]
): { x: number; y: number }[] => {
  const randomNormal = d3.randomNormal();
  const data = [];
  for (let i = 0; i < numPoints; i++) {
    const x = mean[0] + randomNormal() * Math.sqrt(cov[0][0]);
    const y = mean[1] + randomNormal() * Math.sqrt(cov[1][1]);
    data.push({ x, y });
  }
  return data;
};

const datasets = [
  generateRandomDataset(
    100,
    [-3, -3],
    [
      [1, -0.5],
      [-0.5, 1],
    ]
  ),
  generateRandomDataset(
    100,
    [3, 3],
    [
      [1, 0.8],
      [0.8, 1],
    ]
  ),
];

const labels = ["Dataset 1","Dataset 2",];

const p = 0.95;

const MyComponent: React.FC = () => {
  return (
    <div>
      <h1>Scatter Plot</h1>
      <Scatterplot
        width={500}
        height={600}
        datasets={datasets}
        labels={labels}
        plotType="ellipse"
        p={p}
        bandwidth={0.1}
      />
      <h1>Same dataset different plot</h1>
      <Scatterplot
        width={500}
        height={600}
        datasets={datasets}
        labels={labels}
        plotType="rectangle"
        p={p}
        bandwidth={0.1}
      />
    </div>
  );
};

export default MyComponent;
