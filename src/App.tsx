import React from "react";
import "./App.css";
import Curve from "./components/Curve";
import DensityPlotComponent from "./components/DensityPlotComponent";

export interface DataPoint {
  x: number;
  y: number;
}

const App: React.FC = () => {
  return (
    <div className="App">
      <DensityPlotComponent/>
      <Curve/>
    </div>
  );
};

export default App;
