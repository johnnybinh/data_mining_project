import { useState } from "react";
import ScatterPlot from "./ScatterPlot";
import "./ScatterPlotView.css";

const ScatterPlotView = ({ data, attributes }) => {
  // Include 'val' in the options if it exists in data
  const allAttributes = attributes.includes("val")
    ? attributes
    : [...attributes, "val"];

  const [xAttribute, setXAttribute] = useState(attributes[0] || "");
  const [yAttribute, setYAttribute] = useState("val");

  return (
    <div className="scatter-plot-view-container">
      <div className="scatter-controls-panel">
        <div className="scatter-control-group">
          <label className="scatter-label">X-Axis Attribute:</label>
          <select
            value={xAttribute}
            onChange={(e) => setXAttribute(e.target.value)}
            className="scatter-select"
          >
            {allAttributes.map((attr) => (
              <option key={attr} value={attr}>
                {attr.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="scatter-control-group">
          <label className="scatter-label">Y-Axis Attribute:</label>
          <select
            value={yAttribute}
            onChange={(e) => setYAttribute(e.target.value)}
            className="scatter-select"
          >
            {allAttributes.map((attr) => (
              <option key={attr} value={attr}>
                {attr.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="scatter-plot-wrapper">
        <ScatterPlot
          data={data}
          xAttribute={xAttribute}
          yAttribute={yAttribute}
          width={600}
          height={500}
        />
      </div>
    </div>
  );
};

export default ScatterPlotView;
