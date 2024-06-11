import * as d3 from "d3";
import { AxisLeft } from "./AxisLeft";
import { AxisBottom } from "./AxisBottom";

const MARGIN = { top: 60, right: 60, bottom: 60, left: 60 };
const colors = d3.schemeCategory10;

type ScatterplotProps = {
  width: number;
  height: number;
  data: Array<{ x: number; y: number }[]>; // Array of arrays
  labels?: string[]; // Optional array of labels
};

export const Scatterplot = ({
  width,
  height,
  data,
  labels,
}: ScatterplotProps) => {
  // Flatten the datasets to find the max x and y values
  const allData = data.reduce((acc, curr) => acc.concat(curr), []);
  const maxX = d3.max(allData, (d) => d.x) || 10;
  const maxY = d3.max(allData, (d) => d.y) || 10;

  const buffer = 3;
  const bufferedMaxX = maxX + buffer;
  const bufferedMaxY = maxY + buffer;

  const boundsWidth = width - MARGIN.right - MARGIN.left;
  const boundsHeight = height - MARGIN.top - MARGIN.bottom;

  // Scales
  const yScale = d3
    .scaleLinear()
    .domain([0, bufferedMaxY])
    .range([boundsHeight, 0]);
  const xScale = d3
    .scaleLinear()
    .domain([0, bufferedMaxX])
    .range([0, boundsWidth]);

  // Build the shapes for each dataset
  const allShapes = data.map((dataset, datasetIndex) =>
    dataset.map((d, i) => (
      <circle
        key={`${datasetIndex}-${i}`}
        r={5}
        cx={xScale(d.y)}
        cy={yScale(d.x)}
        opacity={1}
        stroke={colors[datasetIndex % colors.length]} // Use color based on dataset index
        fill={colors[datasetIndex % colors.length]} // Use color based on dataset index
        fillOpacity={0.2}
        strokeWidth={1}
      />
    ))
  );

  // Labels mapping
  const mappedLabels =
    labels && labels.length === data.length
      ? labels
      : Array(data.length).fill("");

  return (
    <div>
      <svg width={width} height={height}>
        <g
          width={boundsWidth}
          height={boundsHeight}
          transform={`translate(${[MARGIN.left, MARGIN.top].join(",")})`}
        >
          <ellipse
            transform={`translate(${MARGIN.left},${MARGIN.top})`}
            cx={xScale(0)}
            cy={yScale(0)}
            rx={xScale(-6)}
            ry={yScale(6)}
            stroke="black"
            strokeWidth={3}
            fill="none"
          />
          {/* Y axis */}
          <AxisLeft yScale={yScale} pixelsPerTick={40} width={boundsWidth} />

          {/* X axis, use an additional translation to appear at the bottom */}
          <g transform={`translate(0, ${boundsHeight})`}>
            <AxisBottom
              xScale={xScale}
              pixelsPerTick={40}
              height={boundsHeight}
            />
          </g>

          {/* Circles */}
          {allShapes}

          {/* Labels */}
          {mappedLabels.map((label, i) => (
            <text
              key={`label-${i}`}
              x={width - MARGIN.right}
              y={MARGIN.top + i * 20}
              fontSize="12px"
              fill={colors[i % colors.length]}
              textAnchor="end"
            >
              {label}
            </text>
          ))}

          {/* Ellipse */}
        </g>
      </svg>
    </div>
  );
};
