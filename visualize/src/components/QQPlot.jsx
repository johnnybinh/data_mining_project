import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./QQPlot.css";

const QQPlot = ({ data, attributes }) => {
  const [xAttribute, setXAttribute] = useState(attributes[0] || "");
  const [yAttribute, setYAttribute] = useState(attributes[1] || "val");
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !xAttribute || !yAttribute) return;

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

    // Extract values for both attributes
    const xValues = data
      .map((d) => d[xAttribute])
      .filter((d) => !isNaN(d) && d != null)
      .sort(d3.ascending);
    const yValues = data
      .map((d) => d[yAttribute])
      .filter((d) => !isNaN(d) && d != null)
      .sort(d3.ascending);

    if (xValues.length === 0 || yValues.length === 0) return;

    // Calculate quantiles for Q-Q plot
    // We'll use the same number of quantiles for both distributions
    const n = Math.min(xValues.length, yValues.length);
    const quantiles = d3.range(0, n).map((i) => (i + 0.5) / n);

    // Get quantile values
    const xQuantiles = quantiles.map((q) => d3.quantile(xValues, q));
    const yQuantiles = quantiles.map((q) => d3.quantile(yValues, q));

    // Create Q-Q plot data points
    const qqData = xQuantiles.map((x, i) => ({
      x: x,
      y: yQuantiles[i],
    }));

    // Scales
    const xExtent = d3.extent(xQuantiles);
    const yExtent = d3.extent(yQuantiles);
    const allExtent = [
      Math.min(xExtent[0], yExtent[0]),
      Math.max(xExtent[1], yExtent[1]),
    ];

    const xScale = d3.scaleLinear().domain(xExtent).nice().range([0, innerWidth]);

    const yScale = d3.scaleLinear().domain(yExtent).nice().range([innerHeight, 0]);

    // Reference line (y = x) for perfect quantile match
    const referenceLine = [
      { x: allExtent[0], y: allExtent[0] },
      { x: allExtent[1], y: allExtent[1] },
    ];

    const line = d3
      .line()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y));

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "qq-tooltip")
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
    const xAxis = d3.axisBottom(xScale).ticks(8);
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
      .text(`${xAttribute.replace(/_/g, " ")} Quantiles`);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -innerHeight / 2)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#c15f3c")
      .style("font-weight", "500")
      .text(`${yAttribute.replace(/_/g, " ")} Quantiles`);

    // Grid lines
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(8).tickSize(-innerHeight))
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

    // Reference line (y = x)
    g.append("path")
      .datum(referenceLine)
      .attr("fill", "none")
      .attr("stroke", "#b1ada1")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("opacity", 0.6)
      .attr("d", line);

    // Q-Q plot points
    const points = g
      .selectAll(".qq-point")
      .data(qqData)
      .enter()
      .append("circle")
      .attr("class", "qq-point")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 4)
      .attr("fill", "#c15f3c")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .style("opacity", 0.7)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 7)
          .style("opacity", 1)
          .style("stroke-width", 2);

        tooltip.transition().duration(200).style("opacity", 1);

        tooltip
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px; color: #c15f3c;">
              Q-Q Plot Point
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              ${xAttribute.replace(/_/g, " ")} Quantile: <strong>${d.x.toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280;">
              ${yAttribute.replace(/_/g, " ")} Quantile: <strong>${d.y.toFixed(4)}</strong>
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
          .attr("r", 4)
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
  }, [data, xAttribute, yAttribute, attributes]);

  // Include 'val' in the options if it exists in data
  const allAttributes = attributes.includes("val")
    ? attributes
    : [...attributes, "val"];

  return (
    <div className="qq-plot-container">
      <div className="qq-controls">
        <div className="qq-control-group">
          <label className="qq-label">X-Axis Attribute:</label>
          <select
            value={xAttribute}
            onChange={(e) => setXAttribute(e.target.value)}
            className="qq-select"
          >
            {allAttributes.map((attr) => (
              <option key={attr} value={attr}>
                {attr.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div className="qq-control-group">
          <label className="qq-label">Y-Axis Attribute:</label>
          <select
            value={yAttribute}
            onChange={(e) => setYAttribute(e.target.value)}
            className="qq-select"
          >
            {allAttributes.map((attr) => (
              <option key={attr} value={attr}>
                {attr.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="qq-plot-wrapper">
        <svg ref={svgRef} className="qq-svg"></svg>
      </div>
      <div className="qq-info">
        <p>
          <strong>Q-Q Plot:</strong> Compares quantiles of two attributes. Points
          close to the diagonal line indicate similar distributions.
        </p>
      </div>
    </div>
  );
};

export default QQPlot;
