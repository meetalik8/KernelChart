import * as React from "react";
import * as d3 from "d3";
import {
  generateRandomGaussianData,
  DataPoint,
  kde,
  epanechnikov,
} from "./data";

interface HistogramProps {
  data: DataPoint[];
  thresholds: number[];
  width?: number;
  height?: number;
}

const Histogram: React.FC<HistogramProps> = ({
  data,
  thresholds,
  width = 928,
  height = 500,
}) => {
  const marginTop = 20;
  const marginRight = 30;
  const marginBottom = 30;
  const marginLeft = 40;

  const x = d3
    .scaleLinear()
    .domain(d3.extent(data, (d) => d.x)) // Use an accessor function
    .nice()
    .range([marginLeft, width - marginRight]);

  const bins = d3.bin().domain(x.domain()).thresholds(thresholds)(data);

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(bins.flatMap((bin) => bin.length)) / data.length, // Flatten the bins array
    ])
    .range([height - marginBottom, marginTop]);

  const density = kde(epanechnikov(20), thresholds, data);

  const line = d3
    .line()
    .curve(d3.curveBasis)
    .x((d) => x(d.x))
    .y((d) => y(d.y));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <g fill="#bbb">
        {bins.map((bin, i) => (
          <rect
            key={i}
            x={x(bin.x0) + 1}
            y={y(bin.length / data.length)}
            width={x(bin.x1) - x(bin.x0) - 1}
            height={y(0) - y(bin.length / data.length)}
          />
        ))}
      </g>
      <path
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinejoin="round"
        d={line(density) || ""}
      />
      <g transform={`translate(0,${height - marginBottom})`}>
        <XAxis
          scale={x}
          label="Time between eruptions (min.)"
          width={width - marginRight}
        />
      </g>
      <g transform={`translate(${marginLeft},0)`}>
        <YAxis scale={y} format={(d) => `${(d * 100).toFixed(0)}%`} />
      </g>
    </svg>
  );
};
const XAxis: React.FC<AxisProps> = ({ scale, label, width }) => (
  <g>
    {d3
      .axisBottom(scale)
      .ticks(10)
      .map((tick, i) => (
        <g key={i} transform={`translate(${tick.offset},0)`}>
          <line y2="6" stroke="currentColor" />
          <text dy="1em" y="9" fontSize="10" textAnchor="middle">
            {tick.value}
          </text>
        </g>
      ))}
    {label && (
      <text
        x={width}
        y="-6"
        fontSize="10"
        fill="currentColor"
        textAnchor="end"
        fontWeight="bold"
      >
        {label}
      </text>
    )}
  </g>
);

const YAxis: React.FC<AxisProps> = ({
  scale,
  format = (d) => d.toString(),
}) => (
  <g>
    {d3
      .axisLeft(scale)
      .ticks(10)
      .map((tick, i) => (
        <g key={i} transform={`translate(0,${tick.offset})`}>
          <line x2="-6" stroke="currentColor" />
          <text x="-9" dy=".35em" fontSize="10" textAnchor="end">
            {format(tick.value)}
          </text>
        </g>
      ))}
  </g>
);

export default Histogram;
