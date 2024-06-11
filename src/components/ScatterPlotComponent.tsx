import React from "react";
import { Scatterplot } from "./ScatterPlotter";
// import { data } from "./data";

const ScatterPlotComponent = () => {
  const dataset1 = [
    { x: 1, y: 2 },
    { x: 3, y: 4 },
    { x: 5, y: 6 },
    { x: 7, y: 8 },
  ];

  const dataset2 = [
    { x: 2, y: 1 },
    { x: 4, y: 3 },
    { x: 6, y: 5 },
    { x: 8, y: 7 },
  ];

  // Generate random data for testing
  const generateRandomData = (numPoints: number) => {
    const data = [];
    for (let i = 0; i < numPoints; i++) {
      data.push({
        x: Math.random() * 10,
        y: Math.random() * 10,
      });
    }
    return data;
  };

  // Define the number of points for each dataset
  const numPointsDataset1 = 20;
  const numPointsDataset2 = 15;

  // Generate random data for each dataset
  const randomData1 = generateRandomData(numPointsDataset1);
  const randomData2 = generateRandomData(numPointsDataset2);

  const Labels = ["dataset1", "dataset2"];
  return (
    <div>
      <h2>Scatter Plot</h2>
      <Scatterplot
        width={500}
        height={600}
        data={[dataset1, dataset2]}
        labels={Labels}
      />
    </div>
  );
};

export default ScatterPlotComponent;
