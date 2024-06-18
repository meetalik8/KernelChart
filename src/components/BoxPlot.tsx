import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "../App.css"; 

interface BoxPlotCategoryData {
  category: string;
  values: number[];
}

interface BoxPlotGroupData {
  group: string;
  categories: BoxPlotCategoryData[];
  intervals?: {
    type: string;
    percentage: string;
    values: number[];
  }[];
}

interface BoxPlotProps {
  data: BoxPlotGroupData[];
}

const BoxPlot: React.FC<BoxPlotProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [stats, setStats] = useState({
    overallMean: 0,
    stdDevBetweenSamples: 0,
    stdDevAcrossSamples: 0,
    confidenceInterval: [0, 0],
    toleranceInterval: [0, 0],
    outliersCount: 0,
    parameter: 0,
  });

  function countTotalCategories(data: BoxPlotGroupData[]): number {
    let totalCategories = 0;
    data.forEach((group) => {
      totalCategories += group.categories.length;
      if (totalCategories > 50) {
        alert(
          `Total categories exceed limit of 50. Printing first 50 categories only`
        );
      }
    });
    return totalCategories;
  }

  const calculateOverallStats = () => {
    const allValues = data.flatMap((group) =>
      group.categories.flatMap((category) => category.values)
    );
    const overallMean = d3.mean(allValues) || 0;
    const variance =
      d3.mean(allValues.map((v) => Math.pow(v - overallMean, 2))) || 0;
    const stdDevAcrossSamples = Math.sqrt(variance);

    const groupMeans = data.map(
      (group) =>
        d3.mean(group.categories.flatMap((category) => category.values)) || 0
    );
    const varianceBetweenSamples =
      d3.mean(groupMeans.map((v) => Math.pow(v - overallMean, 2))) || 0;
    const stdDevBetweenSamples = Math.sqrt(variance);

    const confidenceInterval = [
      overallMean - 1.96 * stdDevAcrossSamples,
      overallMean + 1.96 * stdDevAcrossSamples,
    ];
    const toleranceInterval = [d3.min(allValues) || 0, d3.max(allValues) || 0];
    const outliersCount = allValues.filter((value) => {
      const iqr = d3.quantile(allValues, 0.75)! - d3.quantile(allValues, 0.25)!;
      const lowerFence = d3.quantile(allValues, 0.25)! - 1.5 * iqr;
      const upperFence = d3.quantile(allValues, 0.75)! + 1.5 * iqr;
      return value < lowerFence || value > upperFence;
    }).length;

    setStats({
      overallMean,
      stdDevBetweenSamples,
      stdDevAcrossSamples,
      confidenceInterval,
      toleranceInterval,
      outliersCount,
      parameter: 0,
    });
  };

  useEffect(() => {
    calculateOverallStats();
  }, [data]);

  const modifyCategories = (data: BoxPlotGroupData[]): void => {
    const seenCategories: Record<string, string> = {};
    let totalCategories = 0;
    data.forEach((group: BoxPlotGroupData) => {
      group.categories = group.categories.slice(0, 50 - totalCategories); // Limit to remaining slots
      totalCategories += group.categories.length;
      if (totalCategories > 50) {
        throw new Error("Total categories exceed limit of 50");
      }
      group.categories.forEach((category) => {
        const groupName = group.group;
        const categoryName = category.category;
        if (seenCategories[categoryName]) {
          category.category = `${groupName}_${categoryName}`;
        } else {
          seenCategories[categoryName] = group.group;
        }
      });
    });
  };

  countTotalCategories(data);
  modifyCategories(data);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const margin = { top: 120, right: 30, bottom: 120, left: 40 }; // Reduced bottom margin
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    svg.selectAll("*").remove();

    const chart = svg
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const groups = data.map((d) => d.group);
    const categories = Array.from(
      new Set(data.flatMap((d) => d.categories.map((c) => c.category)))
    );
    data.forEach((groupData) => {
      groupData.categories.sort((a, b) => {
        const medianA = calculateBoxPlotStats(a.values).median;
        const medianB = calculateBoxPlotStats(b.values).median;
        return medianA - medianB;
      });
    });

    const x1 = d3.scaleBand().domain(categories).range([0, width]).padding(0.1);

    const maxY =
      d3.max(
        data.flatMap((groupData) =>
          groupData.categories.flatMap((categoryData) => {
            const stats = calculateBoxPlotStats(categoryData.values);
            return [stats.max + stats.stdDev, stats.min - stats.stdDev];
          })
        )
      ) || 0;

    const minY =
      d3.min(
        data.flatMap((groupData) =>
          groupData.categories.flatMap((categoryData) => {
            const stats = calculateBoxPlotStats(categoryData.values);
            return [stats.max + stats.stdDev, stats.min - stats.stdDev];
          })
        )
      ) || 0;
    const calculateMaxCategoryStdDev = (data: BoxPlotGroupData[]): number => {
      let maxStdDev = 0;

      data.forEach((group) => {
        group.categories.forEach((category) => {
          const stdDev = d3.deviation(category.values) || 0; // Calculate standard deviation
          maxStdDev = Math.max(maxStdDev, stdDev); // Update maxStdDev if current stdDev is greater
        });
      });

      return maxStdDev;
    };

    const yBuffer = calculateMaxCategoryStdDev(data) * 2;

    const y = d3
      .scaleLinear()
      .domain([minY - yBuffer, maxY + yBuffer])
      .nice()
      .range([height, 0]);

    chart.append("g").call(d3.axisLeft(y));
    chart
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x1))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-1em")
      .attr("dy", "-0.5em")
      .attr("transform", "rotate(-90)");

    const gridGroup = chart.append("g").attr("class", "grid");

    gridGroup
      .selectAll(".horizontal-grid-line")
      .data(y.ticks())
      .enter()
      .append("line")
      .attr("class", "horizontal-grid-line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", (d: any) => y(d))
      .attr("y2", (d: any) => y(d))
      .style("stroke", "#ccc")
      .style("stroke-opacity", 0.5);

    gridGroup
      .selectAll(".vertical-grid-line")
      .data(x1.domain())
      .enter()
      .append("line")
      .attr("class", "vertical-grid-line")
      .attr("x1", (d: any) => x1(d) + x1.bandwidth() / 2)
      .attr("x2", (d: any) => x1(d) + x1.bandwidth() / 2)
      .attr("y1", 0)
      .attr("y2", height)
      .style("stroke", "#ccc")
      .style("stroke-opacity", 0.5);

    const color = d3.scaleOrdinal().domain(groups).range(d3.schemeCategory10);
    if (groups.length < 2) {
      data.forEach((groupData) => {
        // Calculate confidence and tolerance intervals if not provided
        if (!groupData.intervals) {
          const allValues = groupData.categories
            .flatMap((category) => category.values)
            .sort(d3.ascending);
          const overallMean = stats.overallMean;
          const stdDevAcrossSamples = stats.stdDevAcrossSamples;

          const confidenceInterval = [
            overallMean - 1.96 * stdDevAcrossSamples,
            overallMean + 1.96 * stdDevAcrossSamples,
          ];
          const toleranceInterval = [
            d3.min(allValues) || 0,
            d3.max(allValues) || 0,
          ];

          groupData.intervals = [
            {
              type: "confidence interval",
              percentage: "95%",
              values: confidenceInterval,
            },
            {
              type: "tolerance interval",
              percentage: "95%",
              values: toleranceInterval,
            },
          ];
        }

        groupData.intervals?.forEach((interval) => {
          if (interval.type === "confidence interval") {
            const [ciMin, ciMax] = interval.values;
            chart
              .append("rect")
              .attr("x", 0)
              .attr("y", y(ciMax))
              .attr("width", width)
              .attr("height", y(ciMin) - y(ciMax))
              .attr("fill", "blue")
              .attr("opacity", 0.1);
          }
        });

        groupData.intervals?.forEach((interval) => {
          if (interval.type === "tolerance interval") {
            const [tiMin, tiMax] = interval.values;
            chart
              .append("line")
              .attr("x1", 0)
              .attr("x2", width)
              .attr("y1", y(tiMax))
              .attr("y2", y(tiMax))
              .attr("stroke", "red")
              .attr("stroke-width", 2);

            chart
              .append("line")
              .attr("x1", 0)
              .attr("x2", width)
              .attr("y1", y(tiMin))
              .attr("y2", y(tiMin))
              .attr("stroke", "red")
              .attr("stroke-width", 2);
          }
        });
      });
    }
    const groupMeans = data.map((groupData) => ({
      group: groupData.group,
      mean: d3.mean(groupData.categories.flatMap((c) => c.values)) || 0,
    }));
    if (groups.length < 2) {
      data.forEach((groupData) => {
        groupData.intervals?.forEach((interval) => {
          if (interval.type === "confidence interval") {
            const [ciMin, ciMax] = interval.values;
            chart
              .append("rect")
              .attr("x", 0)
              .attr("y", y(ciMax))
              .attr("width", width)
              .attr("height", y(ciMin) - y(ciMax))
              .attr("fill", "blue")
              .attr("opacity", 0.1);
          }
        });
      });

      data.forEach((groupData) => {
        groupData.intervals?.forEach((interval) => {
          if (interval.type === "tolerance interval") {
            const [tiMin, tiMax] = interval.values;
            chart
              .append("line")
              .attr("x1", 0)
              .attr("x2", width)
              .attr("y1", y(tiMax))
              .attr("y2", y(tiMax))
              .attr("stroke", "red")
              .attr("stroke-width", 2);

            chart
              .append("line")
              .attr("x1", 0)
              .attr("x2", width)
              .attr("y1", y(tiMin))
              .attr("y2", y(tiMin))
              .attr("stroke", "red")
              .attr("stroke-width", 2);
          }
        });
      });
    }
    // Draw mean lines for each group
    groupMeans.forEach((groupMean) => {
      const groupColor = color(groupMean.group) as string;
      const lightenedColor = DarkColor(groupColor); // Function to lighten color
      const groupMeanY = y(groupMean.mean);
      chart
        .append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", groupMeanY)
        .attr("y2", groupMeanY)
        .attr("stroke", lightenedColor)
        .attr("stroke-width", 2)
        .style("stroke-dasharray", "4"); // Optionally, add dash style to distinguish mean lines
    });

    const groupG = chart.append("g");

    groupG
      .selectAll("rect")
      .data(
        data.flatMap((groupData) =>
          groupData.categories.map((categoryData) => ({
            group: groupData.group,
            category: categoryData.category,
            values: categoryData.values,
          }))
        )
      )
      .enter()
      .append("rect")
      .attr("x", (d: any) => x1(d.category)!)
      .attr("y", (d: any) =>
        y(
          calculateBoxPlotStats(d.values).min +
            calculateBoxPlotStats(d.values).stdDev
        )
      )
      .attr(
        "height",
        (d: any) =>
          y(
            calculateBoxPlotStats(d.values).max -
              calculateBoxPlotStats(d.values).stdDev
          ) -
          y(
            calculateBoxPlotStats(d.values).min +
              calculateBoxPlotStats(d.values).stdDev
          )
      )
      .attr("width", x1.bandwidth())
      .attr("stroke", (d: any) => DarkColor(color(d.group) as string))
      .style("fill", (d: any) => lightenColor(color(d.group) as string));

    groupG
      .selectAll("line")
      .data(
        data.flatMap((groupData) =>
          groupData.categories.map((categoryData) => ({
            group: groupData.group,
            category: categoryData.category,
            values: categoryData.values,
          }))
        )
      )
      .enter()
      .append("line")
      .attr("x1", (d: any) => x1(d.category)!)
      .attr("x2", (d: any) => x1(d.category)! + x1.bandwidth())
      .attr("y1", (d: any) => y(calculateBoxPlotStats(d.values).median))
      .attr("y2", (d: any) => y(calculateBoxPlotStats(d.values).median))
      .attr("stroke", (d: any) => DarkestColor(color(d.group) as string))
      .style("width", 80);

    data.forEach((groupData) => {
      groupData.categories.forEach((categoryData) => {
        const categoryG = groupG
          .append("g")
          .attr("class", "category")
          .attr("transform", `translate(${x1(categoryData.category)!},${0})`);

        categoryData.values.forEach((value, index) => {
          const outlier = isOutlier([value], categoryData.values);
          const outlierIndex = categoryData.values.indexOf(value);
          const totalOutliers = categoryData.values.filter((v) =>
            isOutlier([v], categoryData.values)
          ).length;
          const yPos = y(value);
          const offset = 15 * (outlierIndex - Math.floor(totalOutliers / 2));
          const offset1 = 17 * (outlierIndex - Math.floor(totalOutliers / 2));

          if (outlier) {
            if (yPos < 0) {
              // Plot outlier arrow at the top extreme
              categoryG
                .append("path")
                .attr("d", d3.symbol().type(d3.symbolTriangle).size(100)())
                .attr(
                  "transform",
                  `translate(${x1.bandwidth() / 2}, 0) rotate(0)`
                )
                .attr("fill", "red");
              categoryG
                .append("text")
                .attr("x", x1.bandwidth() / 2)
                .attr("y", 110 - offset1)
                .attr("text-anchor", "middle")
                .attr("fill", "red")
                .text(value.toFixed(2));
            } else if (yPos > height) {
              // Plot outlier arrow at the bottom extreme
              categoryG
                .append("path")
                .attr("d", d3.symbol().type(d3.symbolTriangle).size(100)())
                .attr(
                  "transform",
                  `translate(${x1.bandwidth() / 2}, ${height}) rotate(180)`
                )
                .attr("fill", "red");
              categoryG
                .append("text")
                .attr("x", x1.bandwidth() / 2)
                .attr("y", height - offset - 25)
                .attr("text-anchor", "middle")
                .attr("fill", "red")
                .text(value.toFixed(2));
            } else {
              categoryG
                .append("path")
                .attr("d", d3.symbol().type(d3.symbolDiamond).size(50)())
                .attr(
                  "transform",
                  `translate(${x1.bandwidth() / 2},${y(value)})`
                )
                .attr("fill", DarkColor(color(groupData.group) as string))
                .attr("stroke", "red");
            }
          } else {
            categoryG
              .append("path")
              .attr("d", d3.symbol().type(d3.symbolDiamond).size(50)())
              .attr("transform", `translate(${x1.bandwidth() / 2},${y(value)})`)
              .attr("fill", DarkColor(color(groupData.group) as string))
              .attr("stroke", "black");
          }
        });
      });
    });
  }, [data, dimensions]);

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const boundingRect =
          svgRef.current.parentElement?.getBoundingClientRect();
        if (boundingRect) {
          setDimensions({
            width: boundingRect.width,
            height: boundingRect.height,
          });
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const calculateBoxPlotStats = (
    values: number[]
  ): {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean: number;
    stdDev: number;
    outliers: number[];
  } => {
    const sortedValues = values.sort(d3.ascending);
    const q1 = d3.quantile(sortedValues, 0.25)!;
    const median = d3.quantile(sortedValues, 0.5)!;
    const q3 = d3.quantile(sortedValues, 0.75)!;
    const iqr = q3 - q1;
    const min = Math.max(
      ...sortedValues.filter((v) => v <= q1 + 1.5 * iqr),
      Math.min(...sortedValues)
    );
    const max = Math.min(
      ...sortedValues.filter((v) => v >= q3 - 1.5 * iqr),
      Math.max(...sortedValues)
    );
    const mean = d3.mean(values)!;
    const variance = d3.mean(values.map((v) => Math.pow(v - mean, 2)))!;
    const stdDev = Math.sqrt(variance);

    const outliers = sortedValues.filter(
      (v) => v < max - stdDev || v > min + stdDev
    );

    return { min, q1, median, q3, max, mean, stdDev, outliers };
  };

  const isOutlier = (values: number[], allValues: number[]): boolean => {
    const { outliers } = calculateBoxPlotStats(allValues);

    return values.some((value) => outliers.includes(value));
  };

  function lightenColor(hex: string): string {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lightenedR = Math.min(255, r + 90);
    const lightenedG = Math.min(255, g + 100);
    const lightenedB = Math.min(255, b + 70);
    const lightenedHex =
      "#" +
      lightenedR.toString(16).padStart(2, "0") +
      lightenedG.toString(16).padStart(2, "0") +
      lightenedB.toString(16).padStart(2, "0");
    return lightenedHex;
  }

  function DarkColor(hex: string): string {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lightenedR = Math.min(255, r + 23);
    const lightenedG = Math.min(255, g + 23);
    const lightenedB = Math.min(255, b + 23);
    const lightenedHex =
      "#" +
      lightenedR.toString(16).padStart(2, "0") +
      lightenedG.toString(16).padStart(2, "0") +
      lightenedB.toString(16).padStart(2, "0");
    return lightenedHex;
  }

  function DarkestColor(hex: string): string {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const lightenedR = Math.min(255, r);
    const lightenedG = Math.min(255, g);
    const lightenedB = Math.min(255, b);
    const lightenedHex =
      "#" +
      lightenedR.toString(16).padStart(2, "0") +
      lightenedG.toString(16).padStart(2, "0") +
      lightenedB.toString(16).padStart(2, "0");
    return lightenedHex;
  }

  return (
    <div>
      <div className="table-responsive">
        <table>
          <tbody>
            <tr>
              <td>Overall mean</td>
              <td>{stats.overallMean.toFixed(2)}</td>
              <td>95% Confidence interval</td>
              <td>
                [{stats.confidenceInterval[0].toFixed(2)},{" "}
                {stats.confidenceInterval[1].toFixed(2)}]
              </td>
            </tr>
            <tr>
              <td>Standard deviation between samples</td>
              <td>{stats.stdDevBetweenSamples.toFixed(2)}</td>
              <td>95% Tolerance interval</td>
              <td>
                [{stats.toleranceInterval[0].toFixed(2)},{" "}
                {stats.toleranceInterval[1].toFixed(2)}]
              </td>
            </tr>
            <tr>
              <td>Standard deviation across samples</td>
              <td>{stats.stdDevAcrossSamples.toFixed(2)}</td>
              <td>No. of outliers</td>
              <td>{stats.outliersCount}</td>
            </tr>
            <tr>
              <td>Parameter</td>
              <td>{stats.parameter}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <svg ref={svgRef}></svg>
    </div>
  );
};

export default BoxPlot;
