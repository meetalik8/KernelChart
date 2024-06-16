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
const linearDataset = 
  [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
  ];

const clusteredDataset = [
    { x: 1, y: 1 },
    { x: 1.1, y: 1.1 },
    { x: 0.9, y: 0.9 },
    { x: 1.2, y: 1.2 },
];
const uniformDataset = [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 4 },
    { x: 5, y: 5 },
    { x: 6, y: 6 },
    { x: 7, y: 7 },
    { x: 8, y: 8 },
    { x: 9, y: 9 },
    { x: 10, y: 10 },
];
const multimodalDataset = [
    { x: 1, y: 1 },
    { x: 1.1, y: 1.1 },
    { x: 0.9, y: 0.9 },
    { x: 1.2, y: 1.2 },
  
];

const negativeValuesDataset = [
    { x: -1, y: -1 },
    { x: -2, y: -2 },
    { x: -3, y: -3 },
    { x: 1, y: 1 },
];
const highVarianceDataset = [
    { x: 1, y: 1 },
    { x: 10, y: 10 },
    { x: 20, y: 20 },
    { x: 30, y: 30 },
    { x: 40, y: 40 },
];
const mixedTypesDataset = [
  [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
  ],
  [
    { x: 5, y: 5 },
    { x: 6, y: 6 },
    { x: 7, y: 7 },
  ],
  [
    { x: 10, y: 10 },
    { x: 11, y: 11 },
    { x: 12, y: 12 },
  ],
];
const datasetWithOutliers = [
  [
    { x: 1, y: 1 },
    { x: 2, y: 2 },
    { x: 3, y: 3 },
    { x: 50, y: 50 },
  ],
];

const datasets = [negativeValuesDataset];

const labels = ["Linear","Clustered","Uniform"];

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
        plotType="rectangle"
        p={p}
        bandwidth={0.1}
      />
    </div>
  );
};

export default MyComponent;
