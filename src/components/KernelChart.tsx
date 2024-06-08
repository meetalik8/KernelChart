import * as React from "react";
import Histogram from "./Histogram";
import * as d3 from "d3";
import { generateRandomGaussianData } from "./data";

const App: React.FC = () => {
  const data = generateRandomGaussianData(0, 1, 1000);
  const thresholds = d3.range(-4, 4.1, 0.1);

  return (
    <div>
      <Histogram data={data} thresholds={thresholds} width={800} height={400} />
    </div>
  );
};

export default App;
