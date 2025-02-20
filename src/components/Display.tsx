import React, { useState, ChangeEvent } from "react";
import GlutenDetectionGraph from "./GlutenDetectionGraph";

  return (
    <div>
      <div>
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
