import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface DataPoint {
  x: number;
  y: number;
}

interface GroupData {
  name: string;
  labDetectionRates: DataPoint[];
  lpodCurve: DataPoint[];
  upperLimit: DataPoint[];
  lowerLimit: DataPoint[];
}

interface Props {
  data: GroupData[];
  xAxisLabel: string;
  yAxisLabel: string;
  drop?: boolean;
  log?: number;
}

const GlutenDetectionGraph: React.FC<Props> = ({
  data,
  xAxisLabel,
  yAxisLabel,
  drop = false,
  log,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 300 });

  const handleResize = () => {
    if (svgRef.current) {
      const width = svgRef.current.clientWidth;
      const height = svgRef.current.clientHeight;
      setDimensions({ width, height });
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial dimensions

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    data.forEach((group) => {
      let upperLimit = group.upperLimit;
      let lowerLimit = group.lowerLimit;

      let maxUpperLimitX = Math.max(...upperLimit.map((point) => point.x));

      lowerLimit.forEach((point) => {
        if (point.x > maxUpperLimitX) {
          upperLimit.push({ x: point.x, y: 1 });
        }
      });
    });

    const sortDataByX = (data: DataPoint[]) => {
      return data.slice().sort((a, b) => a.x - b.x);
    };

    const interpolateLimits = (
      curve: DataPoint[],
      upperLimit: DataPoint[],
      lowerLimit: DataPoint[]
    ) => {
      // Combine all x values from curve, upperLimit, and lowerLimit
      let allXValues = new Set([
        ...curve.map((d) => d.x),
        ...upperLimit.map((d) => d.x),
        ...lowerLimit.map((d) => d.x),
      ]);

      // Sort upperLimit and lowerLimit by x values
      upperLimit.sort((a, b) => a.x - b.x);
      lowerLimit.sort((a, b) => a.x - b.x);

      let interpolatedUpper = [...upperLimit];
      let interpolatedLower = [...lowerLimit];

      allXValues.forEach((xValue) => {
        // Interpolate upperLimit if xValue is missing
        if (!upperLimit.some((point) => point.x === xValue)) {
          let lowerPoint = upperLimit
            .filter((point) => point.x < xValue)
            .slice(-1)[0];
          let upperPoint = upperLimit.find((point) => point.x > xValue);

          if (lowerPoint && upperPoint) {
            const slope =
              (upperPoint.y - lowerPoint.y) / (upperPoint.x - lowerPoint.x);
            const yValue = lowerPoint.y + slope * (xValue - lowerPoint.x);
            interpolatedUpper.push({ x: xValue, y: yValue });
          }
        }

        // Interpolate lowerLimit if xValue is missing
        if (!lowerLimit.some((point) => point.x === xValue)) {
          let lowerPoint = lowerLimit
            .filter((point) => point.x < xValue)
            .slice(-1)[0];
          let upperPoint = lowerLimit.find((point) => point.x > xValue);

          if (lowerPoint && upperPoint) {
            const slope =
              (upperPoint.y - lowerPoint.y) / (upperPoint.x - lowerPoint.x);
            const yValue = lowerPoint.y + slope * (xValue - lowerPoint.x);
            interpolatedLower.push({ x: xValue, y: yValue });
          }
        }
      });

      interpolatedUpper.sort((a, b) => a.x - b.x);
      interpolatedLower.sort((a, b) => a.x - b.x);

      return { interpolatedUpper, interpolatedLower };
    };

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;
    const margin = { top: 20, right: 0, bottom: 40, left: 40 };

    svg.attr("width", width).attr("height", height);

    const xMax = Math.max(
      ...data.reduce((acc: number[], group) => {
        const allXValues = [
          ...group.labDetectionRates.map((d) => d.x),
          ...group.lpodCurve.map((d) => d.x),
          ...group.upperLimit.map((d) => d.x),
          ...group.lowerLimit.map((d) => d.x),
        ];
        return [...acc, ...allXValues];
      }, [])
    );

    const x = log
      ? d3
          .scaleLog()
          .base(log)
          .domain([1, xMax])
          .range([margin.left, width - margin.right - 10])
      : d3
          .scaleLinear()
          .domain([0, xMax])
          .range([margin.left, width - margin.right - 10]);

    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height - margin.bottom, margin.top]);

    const xAxis = d3.axisBottom(x).ticks(log ? 10 : undefined);
    const yAxis = d3.axisLeft(y);

    svg.selectAll("*").remove();

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(xAxis)
      .append("text")
      .attr("x", width - margin.right)
      .attr("y", -6)
      .attr("fill", "black")
      .attr("text-anchor", "end")
      .text(xAxisLabel);

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxis)
      .append("text")
      .attr("x", 6)
      .attr("y", margin.top)
      .attr("dy", "0.71em")
      .attr("fill", "black")
      .attr("text-anchor", "start")
      .text(yAxisLabel);

    const line = d3
      .line()
      .curve(d3.curveMonotoneX)
      .x((d: any) => x(d.x))
      .y((d: any) => y(d.y));

    const drawLine = (data: DataPoint[], color: string, opacity: number) => {
      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("d", line)
        .attr("opacity", opacity);
    };

    const drawSteppingSequence = (
      data: DataPoint[],
      curve: any,
      color: string
    ) => {
      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1)
        .attr("d", curve);
    };

    const drawArea = (lowerLimit: DataPoint[], upperLimit: DataPoint[]) => {
      // Check if either lowerLimit or upperLimit is empty or undefined
      if (
        !lowerLimit ||
        !upperLimit ||
        lowerLimit.length === 0 ||
        upperLimit.length === 0
      ) {
        console.error(
          "Lower limit or upper limit arrays are empty or undefined."
        );
        return;
      }

      // Ensure lowerLimit and upperLimit are sorted by x values
      lowerLimit.sort((a, b) => a.x - b.x);
      upperLimit.sort((a, b) => a.x - b.x);

      // Create the area generator
      const areaGenerator = d3
        .area()
        .curve(d3.curveMonotoneX)
        .x((d: any) => x(d.x))
        .y0((d: any) => y(d.y))
        .y1((d: any, i: any) => y(upperLimit[i].y)); // Use upperLimit array index to access corresponding y value

      // Select the SVG element and append the area path
      svg.select(".area").remove(); // Ensure previous paths are removed to avoid duplication
      svg
        .append("path")
        .datum(lowerLimit)
        .attr("class", "area")
        .attr("fill", "lightgrey")
        .attr("opacity", 0.5)
        .attr("d", areaGenerator);
    };

    const drawLabDetectionRates = (group: GroupData, color: string) => {
      const diamondSymbol = d3.symbol().type(d3.symbolDiamond).size(64);
      svg
        .selectAll(`.lab-detection-${group.name}`)
        .data(group.labDetectionRates)
        .enter()
        .append("path")
        .attr("class", `lab-detection-${group.name}`)
        .attr("transform", (d: any) => `translate(${x(d.x)},${y(d.y)})`)
        .attr("d", diamondSymbol)
        .attr("fill", color);
    };

    const drawIntersectionLines = (group: GroupData) => {
      group.labDetectionRates.forEach((d: any) => {
        const xValue = findIntersectionX(group.lpodCurve, d.y);
        if (xValue !== null) {
          svg
            .append("line")
            .attr("x1", x(xValue))
            .attr("x2", x(xValue))
            .attr("y1", height - margin.bottom)
            .attr("y2", y(d.y))
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4,4")
            .attr("stroke-width", 1);

          svg
            .append("line")
            .attr("x1", margin.left)
            .attr("x2", x(xValue))
            .attr("y1", y(d.y))
            .attr("y2", y(d.y))
            .attr("stroke", "black")
            .attr("stroke-dasharray", "4,4")
            .attr("stroke-width", 1);
        }
      });
    };

    const drawGridLines = () => {
      svg
        .append("g")
        .attr("class", "grid")
        .attr("opacity", 0.5)
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(10)
            .tickSize(-height + margin.top + margin.bottom)
            .tickFormat("" as any)
        );

      svg
        .append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("opacity", 0.5)
        .call(
          d3
            .axisLeft(y)
            .ticks(10)
            .tickSize(-width + margin.left + margin.right)
            .tickFormat("" as any)
        );
    };

    drawGridLines();

    const stepFunctionAfter = d3
      .line()
      .curve(d3.curveStepAfter)
      .x((d: any) => x(d.x))
      .y((d: any) => y(d.y));

    const stepFunctionBefore = d3
      .line()
      .curve(d3.curveStepBefore)
      .x((d: any) => x(d.x))
      .y((d: any) => y(d.y));

    data.forEach((group) => {
      group.lpodCurve = sortDataByX(group.lpodCurve);
      group.labDetectionRates = sortDataByX(group.labDetectionRates);
      group.upperLimit = sortDataByX(group.upperLimit);
      group.lowerLimit = sortDataByX(group.lowerLimit);

      const { interpolatedUpper, interpolatedLower } = interpolateLimits(
        group.lpodCurve,
        group.upperLimit,
        group.lowerLimit
      );

      if (drop) {
        drawIntersectionLines(group);
      }
      drawSteppingSequence(interpolatedLower, stepFunctionAfter, "black");
      drawSteppingSequence(interpolatedUpper, stepFunctionBefore, "black");

      drawArea(interpolatedLower, interpolatedUpper);
      drawLine(group.lpodCurve, "blue", 1);
      drawLine(interpolatedUpper, "green", 0.4);
      drawLine(interpolatedLower, "red", 0.4);

      drawLabDetectionRates(group, "#358bc6");
    });

    const legendData = [
      { color: "blue", label: "LPOD curve" },
      { color: "green", label: "Upper limit of 95% prediction range" },
      { color: "red", label: "Lower limit of 95% prediction range" },
      { color: "lightgrey", label: "95% prediction range" },
      { color: "#358bc6", label: "Lab-specific rate of detection" },
    ];

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${width - margin.right - 300},${height - 185})`
      );

    legend
      .append("rect")
      .attr("x", -10)
      .attr("y", -10)
      .attr("width", 300)
      .attr("height", legendData.length * 20 + 10)
      .attr("fill", "white")
      .attr("stroke", "black");

    const legendItem = legend
      .selectAll(".legend-item")
      .data(legendData)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d: any, i: any) => `translate(0,${i * 20})`);

    legendItem
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", (d: any) => d.color);

    legendItem
      .append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("fill", "black")
      .text((d: any) => d.label);
  }, [data, dimensions]);

  const findIntersectionX = (curveData: DataPoint[], yValue: number) => {
    for (let i = 1; i < curveData.length; i++) {
      if (curveData[i - 1].y <= yValue && curveData[i].y >= yValue) {
        const slope =
          (curveData[i].y - curveData[i - 1].y) /
          (curveData[i].x - curveData[i - 1].x);
        const xValue =
          curveData[i - 1].x + (yValue - curveData[i - 1].y) / slope;
        return xValue;
      }
    }
    return null;
  };

  return <svg ref={svgRef} style={{ width: "100%", height: "100%" }}></svg>;
};

export default GlutenDetectionGraph;
