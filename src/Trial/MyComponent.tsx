import React from "react";
import Scatterplot from "./ScatterPlot";

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

const labels = ["Dataset 1", "Dataset 2"];

const MyComponent: React.FC = () => {
  return (
    <div>
      <h1>Scatter Plot</h1>
      <Scatterplot
        width={500}
        height={600}
        datasets={[dataset1, dataset2]}
        labels={labels}
      />
    </div>
  );
};

export default MyComponent;
