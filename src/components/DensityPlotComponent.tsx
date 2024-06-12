import React from "react";
import DensityPlotter from "./DensityPlotter";
import DensityPlotterUno from "./DensityPlotterUno";

const DensityPlotComponent = () => {
  const Data1 = [-1.6 ,- 1.54, -0.32, 0.67, 0.78, 1.63, 1.73];

  const Data2 = [
    -5.32, -2.34, -2.11, -1.78, -1.54, -0.32, 0.67, 0.78, 1.63, 1.73, 2.48,
    2.88, 6.72
  ];

  const Data1Labels = ["L1", "L2", "L3", "L4", "L5", "L6"];
  const Data2Labels = [
    "A1",
    "A2",
    "A3",
    "A4",
    "A5",
    "A6",
    "A7",
    "A8",
    "A9",
    "A10",
    "A11",
    "A12",
    "A13",
  ];
  
  return (
    <div>
      <h2>Data Density Plot</h2>
      <DensityPlotter
        bandwidth={4}
        datasets={[Data2]}
        labels={[Data2Labels]}
      />
    </div>
  );
};

export default DensityPlotComponent;
