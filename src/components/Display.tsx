import React, { useState, ChangeEvent } from "react";
import GlutenDetectionGraph from "./GlutenDetectionGraph";
import BoxPlot from "./BoxPlot";
import Scatterplot from "./ScatterPlot";
import DensityPlotter from "./DensityPlotter";
import * as XLSX from "xlsx";

interface Point {
  x: number;
  y: number;
}

interface GroupData {
  name: string;
  labDetectionRates: Point[];
  lpodCurve: Point[];
  upperLimit: Point[];
  lowerLimit: Point[];
}

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

interface ScatterPlotData {
  x: number;
  y: number;
}

const processExcelData = (data: any[]): GroupData[] => {
  const groups: { [key: string]: GroupData } = {};

  data.forEach((row) => {
    const group = row["Group"];
    const dataType = row["DataType"];
    const x = row["Xvalue"];
    const y = row["Yvalue"];

    if (!groups[group]) {
      groups[group] = {
        name: group,
        labDetectionRates: [],
        lpodCurve: [],
        upperLimit: [],
        lowerLimit: [],
      };
    }

    const point: Point = { x, y };

    switch (dataType) {
      case "labDetectionRates":
        groups[group].labDetectionRates.push(point);
        break;
      case "lpodCurve":
        groups[group].lpodCurve.push(point);
        break;
      case "upperLimit":
        groups[group].upperLimit.push(point);
        break;
      case "lowerLimit":
        groups[group].lowerLimit.push(point);
        break;
      default:
        break;
    }
  });

  return Object.values(groups);
};

const processIntervalData = (data: any[]): BoxPlotGroupData[] => {
  const groups: { [key: string]: BoxPlotGroupData } = {};

  data.forEach((row) => {
    const group = row["Group"];
    const category = row["Category"];
    const value1 = row["Value 1"];
    const value2 = row["Value 2"];
    const intervalType = row["Interval Type"];
    const intervalPercentage = row["Interval Percentage"];
    const intervalValue1 = row["Interval Value 1"];
    const intervalValue2 = row["Interval Value 2"];

    if (!groups[group]) {
      groups[group] = {
        group,
        categories: [],
        intervals: [],
      };
    }

    if (!groups[group].categories) {
      groups[group].categories = [];
    }

    let categoryObj = groups[group].categories.find(
      (cat) => cat.category === category
    );
    if (!categoryObj) {
      categoryObj = { category, values: [] };
      groups[group].categories.push(categoryObj);
    }

    categoryObj.values.push(value1, value2);

    if (!groups[group].intervals) {
      groups[group].intervals = [];
    }
  });

  return Object.values(groups);
};

const processScatterPlotData = (data: any[]): ScatterPlotData[][] => {
  const groups: { [key: string]: ScatterPlotData[] } = {};

  data.forEach((row) => {
    const group = row["Group"];
    const x = row["Xvalue"];
    const y = row["Yvalue"];

    if (!groups[group]) {
      groups[group] = [];
    }

    const point: ScatterPlotData = { x, y };
    groups[group].push(point);
  });

  return Object.values(groups);
};

const processDensityPlotData = (
  data: any[]
): { datasets: number[][]; labels: string[][] } => {
  const groups: { [key: string]: number[] } = {};
  const labels: { [key: string]: string[] } = {};

  data.forEach((row) => {
    const group = row["Group"];
    const value = row["Value"];
    const label = row["Label"];

    if (!groups[group]) {
      groups[group] = [];
      labels[group] = [];
    }

    groups[group].push(value);
    labels[group].push(label);
  });

  return { datasets: Object.values(groups), labels: Object.values(labels) };
};

const App2: React.FC = () => {
  const [graphData, setGraphData] = useState<GroupData[]>([]);
  const [boxPlotData, setBoxPlotData] = useState<BoxPlotGroupData[]>([]);
  const [scatterPlotData, setScatterPlotData] = useState<ScatterPlotData[][]>(
    []
  );
  const [densityPlotData, setDensityPlotData] = useState<number[][]>([]);
  const [densityPlotLabels, setDensityPlotLabels] = useState<string[][]>([]);
  const [scatterPlotType, setScatterPlotType] = useState<string>("ellipse");
  const [bandwidth, setBandwidth] = useState<number>(4); 

  const handleBandwidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (value > 0 && value <= 20) {
      setBandwidth(value);
    }
  };

  const handleFileUpload = (
    event: ChangeEvent<HTMLInputElement>,
    plotType: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer) {
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

          switch (plotType) {
            case "gluten":
              const processedGraphData = processExcelData(jsonData);
              setGraphData(processedGraphData);
              console.log("Processed Graph Data:", processedGraphData);
              break;
            case "boxPlot":
              const processedBoxPlotData = processIntervalData(jsonData);
              setBoxPlotData(processedBoxPlotData);
              console.log("Processed BoxPlot Data:", processedBoxPlotData);
              break;
            case "scatterPlot":
              const processedScatterPlotData = processScatterPlotData(jsonData);
              setScatterPlotData(processedScatterPlotData);
              console.log(
                "Processed Scatter Plot Data:",
                processedScatterPlotData
              );
              break;
            case "densityPlot":
              const { datasets, labels } = processDensityPlotData(jsonData);
              setDensityPlotData(datasets);
              setDensityPlotLabels(labels);
              console.log("Processed Density Plot Data:", datasets);
              break;
            default:
              console.error("Unknown plot type");
          }
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading the Excel file", error);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const handlePlotTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setScatterPlotType(event.target.value);
  };

  return (
    <div>
      <div>
        <h3>Upload Data for Gluten Detection Graph:</h3>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(event) => handleFileUpload(event, "gluten")}
        />
        <GlutenDetectionGraph
          data={graphData}
          xAxisLabel="Gluten concentration (mg/kg)"
          yAxisLabel="LPOD"
          log={4}
        />
      </div>
      <div>
        <h3>Upload Data for Box Plot:</h3>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(event) => handleFileUpload(event, "boxPlot")}
        />
        <BoxPlot data={boxPlotData} />
      </div>
      <div>
        <h3>Upload Data for Scatter Plot:</h3>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(event) => handleFileUpload(event, "scatterPlot")}
        />
        <select value={scatterPlotType} onChange={handlePlotTypeChange}>
          <option value="ellipse">Ellipse</option>
          <option value="rectangle">Rectangle</option>
        </select>
        <Scatterplot
          width={600}
          height={400}
          datasets={scatterPlotData}
          labels={scatterPlotData.map((_, index) => `Group ${index + 1}`)}
          plotType={scatterPlotType}
        />
      </div>
      <div>
        <h3>Upload Data for Density Plot:</h3>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(event) => handleFileUpload(event, "densityPlot")}
        />
        <label>Bandwidth:</label>
        <input
          type="number"
          value={bandwidth}
          onChange={handleBandwidthChange}
          min="0.1"
          max="20"
          step="any"
        />
        <DensityPlotter
          bandwidth={bandwidth}
          datasets={densityPlotData}
          labels={densityPlotLabels}
        />
      </div>
    </div>
  );
};

export default App2;
