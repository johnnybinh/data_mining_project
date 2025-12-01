import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./QuantilePlot.css";

const QuantilePlot = ({ data, attributes }) => {
  const [selectedAttribute, setSelectedAttribute] = useState(
    attributes[0] || ""
  );
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !selectedAttribute) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = 600;
    const height = 500;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract values for the selected attribute
    const values = data
      .map((d) => d[selectedAttribute])
      .filter((d) => !isNaN(d) && d != null)
      .sort(d3.ascending);

    if (values.length === 0) return;

    // Calculate quantiles
    // Create quantile values from 0 to 1
    const n = values.length;
    const quantiles = d3.range(0, n).map((i) => (i + 0.5) / n);
    const quantileValues = quantiles.map((q) => d3.quantile(values, q));

    // Create plot data: quantile (x) vs value (y)
    const plotData = quantiles.map((q, i) => ({
      quantile: q,
      value: quantileValues[i],
    }));

    // Scales
    const xScale = d3.scaleLinear().domain([0, 1]).nice().range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(quantileValues))
      .nice()
      .range([innerHeight, 0]);

    // Line generator
    const line = d3
      .line()
      .x((d) => xScale(d.quantile))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "quantile-tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "rgba(255, 255, 255, 0.95)")
      .style("border", "1px solid #b1ada1")
      .style("border-radius", "8px")
      .style("padding", "10px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)")
      .style("z-index", "1000");

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(d3.format(".2f"));
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#b1ada1");

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(8);
    g.append("g")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#b1ada1");

    // Axis labels
    g.append("text")
      .attr(
        "transform",
        `translate(${innerWidth / 2}, ${innerHeight + margin.bottom - 10})`
      )
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#c15f3c")
      .style("font-weight", "500")
      .text("Quantile (Probability)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -innerHeight / 2)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#c15f3c")
      .style("font-weight", "500")
      .text(`${selectedAttribute.replace(/_/g, " ")} Value`);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(10).tickSize(-innerHeight))
      .selectAll("line")
      .style("stroke", "#b1ada1")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "3,3");

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).ticks(8).tickSize(-innerWidth))
      .selectAll("line")
      .style("stroke", "#b1ada1")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "3,3");

    // Remove grid tick labels
    g.selectAll(".grid .tick text").remove();
    g.selectAll(".grid .tick line").style("opacity", 0.3);

    // Draw the quantile line
    g.append("path")
      .datum(plotData)
      .attr("fill", "none")
      .attr("stroke", "#c15f3c")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Add points
    const points = g
      .selectAll(".quantile-point")
      .data(plotData)
      .enter()
      .append("circle")
      .attr("class", "quantile-point")
      .attr("cx", (d) => xScale(d.quantile))
      .attr("cy", (d) => yScale(d.value))
      .attr("r", 3)
      .attr("fill", "#c15f3c")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .style("opacity", 0.7)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .style("opacity", 1)
          .style("stroke-width", 2);

        tooltip.transition().duration(200).style("opacity", 1);

        tooltip
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px; color: #c15f3c;">
              ${selectedAttribute.replace(/_/g, " ")}
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              Quantile: <strong>${(d.quantile * 100).toFixed(2)}%</strong>
            </div>
            <div style="color: #6b7280;">
              Value: <strong>${d.value.toFixed(4)}</strong>
            </div>
          `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 3)
          .style("opacity", 0.7)
          .style("stroke-width", 1.5);

        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Set SVG dimensions
    svg.attr("width", width).attr("height", height);

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, selectedAttribute]);

  // Include 'val' in the options if it exists in data
  const allAttributes = attributes.includes("val")
    ? attributes
    : [...attributes, "val"];

  return (
    <div className="quantile-plot-container">
      <div className="quantile-controls">
        <div className="quantile-control-group">
          <label className="quantile-label">Attribute:</label>
          <select
            value={selectedAttribute}
            onChange={(e) => setSelectedAttribute(e.target.value)}
            className="quantile-select"
          >
            {allAttributes.map((attr) => (
              <option key={attr} value={attr}>
                {attr.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="quantile-plot-wrapper">
        <svg ref={svgRef} className="quantile-svg"></svg>
      </div>
      <div className="quantile-info">
        <p>
          <strong>Quantile Plot:</strong> Shows the distribution of values by
          plotting quantiles (0% to 100%) on the x-axis and corresponding
          attribute values on the y-axis. Steeper slopes indicate areas of higher
          density.
        </p>
      </div>
    </div>
  );
};

export default QuantilePlot;
