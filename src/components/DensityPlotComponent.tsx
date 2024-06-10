import React from "react";
import DensityPlotter from "./DensityPlotter";
import DensityPlotterUno from "./DensityPlotterUno";

const DensityPlotComponent = () => {
  const Data1 = [-1.6, 1000];

  const Data2 = [
    -5.32, -2.34, -2.11, -1.78, -1.54, -0.32, 0.67, 0.78, 1.63, 1.73, 2.48,
    2.88, 6.72, 1000,
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
    "A14",
    "A15",
  ];
  const LargeDataset1 = Array.from(
    { length: 200 },
    () => Math.random() * 100 - 50
  );
  const LargeData1Labels = Array.from(
    { length: LargeDataset1.length },
    (_, index) => `L${index + 1}`
  );
  const LargeDataset2 = Array.from(
    { length: 300 },
    () => Math.random() * 100 - 50
  );
  const LargeData2Labels = Array.from(
    { length: LargeDataset2.length },
    (_, index) => `L${index + 1}`
  );
  const LargeDataset3 = Array.from(
    { length: 500 },
    () => Math.random() * 100 - 50
  );
  const LargeData3Labels = Array.from(
    { length: LargeDataset3.length },
    (_, index) => `L${index + 1}`
  );
  const LargeRangeDataset = Array.from(
    { length: 500 },
    () => Math.random() * 10000 - 5000
  );

  const ExtremeValuesDataset = Array.from({ length: 50 }, () => {
    if (Math.random() < 0.5) {
      return Math.random() * 1000000 - 500000; // Extreme positive values
    } else {
      return Math.random() * -1000000 + 500000; // Extreme negative values
    }
  });

  const RandomDifferenceDataset = Array.from(
    { length: 500 },
    () => Math.random() * 20000 - 10000 // Values ranging from -10000 to 10000
  );
  const ExtremeLabels = Array.from(
    { length: RandomDifferenceDataset.length },
    (_, index) => `L${index + 1}`
  );

  return (
    <div>
      <h2>Data Density Plot</h2>
      <DensityPlotter
        bandwidth={2}
        datasets={[RandomDifferenceDataset]}
        labels={[ExtremeLabels]}
      />
    </div>
  );
};

export default DensityPlotComponent;
