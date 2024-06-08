import React from "react";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Dot,
} from "recharts";
import { DataPoint, generateRandomGaussianData } from "./data";

const ProbabilityDensityChart: React.FC = () => {
  const data1: DataPoint[] = generateRandomGaussianData(9.25, 5.437, 16);
  const data2: DataPoint[] = generateRandomGaussianData(
    10.1875,
    4.693,
    16
  );

  console.log("Data 1:", data1);
  console.log("Data 2:", data2);

  return (
    <RechartsLineChart
      width={500}
      height={300}
      margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
    >
      <CartesianGrid strokeDasharray="4 4" />
      <XAxis />
      <YAxis
        label={{ value: "Probability", angle: -90, position: "insideLeft" }}
      />
      <Tooltip
        formatter={(value, name, props) => [`${value}`, "Probability"]}
      />
      <Line
        type="monotone"
        dataKey="y"
        stroke="#8884d8"
        dot={{ stroke: "black", strokeWidth: 2, fill: "yellow", r: 5 }}
        data={data1}
      />

      <Line
        type="monotone"
        dataKey="y"
        stroke="#82ca9d"
        dot={({ cx, cy }) => <Dot cx={cx} cy={cy} r={5} fill="green" />}
        data={data2}
      />
    </RechartsLineChart>
  );
};

export default ProbabilityDensityChart;
