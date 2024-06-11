import React from "react";
import { DemoScatt } from "./DemoScatt";

const data = [
  {
    x: 2,
    y: 4,
  },
  {
    x: 8,
    y: 5,
  },
];
const DemoPlot = () => {
  return (
    <div>
      <h2>Scatter Plot</h2>
      <DemoScatt width={400} height={400} data={data} />
      {/* <Scatterplot width={400} height={400} data={data} /> */}
    </div>
  );
};

export default DemoPlot;
