import React from "react";
import DensityPlotter from "./DensityPlotter";
import DensityPlotterUno from "./DensityPlotterUno";

const DensityPlotComponent = () => {
  const Data1 = [-1.6, -1.1, -0.2, 1.5, 4.4, 5.8];
  const Data2 = [
    -5.32, -2.34, -2.11, -1.78, -1.54, -0.32, 0.67, 0.78, 1.63, 1.73, 2.48,
    2.88, 6.72,
  ];
  const Data3 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const Data4 = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

  const Data1Labels = ["L1", "L2", "L3", "L4", "L5", "L6"];
  const Data2Labels = [
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
  const Data3Labels = [
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
  ];
  const Data4Labels = [
    "B1",
    "B2",
    "B3",
    "B4",
    "B5",
    "B6",
    "B7",
    "B8",
    "B9",
    "B10",
  ];

  return (
    <div>
      <h2>Data Density Plot</h2>
      <DensityPlotter bandwidth={7} datasets={[Data1,Data2]} labels={[Data1Labels,Data2Labels]} />
    </div>
  );
};

export default DensityPlotComponent;
