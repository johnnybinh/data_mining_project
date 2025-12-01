import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./ScatterPlot.css";

const ScatterPlot = ({
  data,
  xAttribute,
  yAttribute = "val",
  width = 400,
  height = 300,
  margin = { top: 20, right: 20, bottom: 50, left: 60 },
}) => {
  const svgRef = useRef();
  const [xScaleFactor, setXScaleFactor] = useState(1.0);
  const [yScaleFactor, setYScaleFactor] = useState(1.0);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Calculate base domain
    const xExtent = d3.extent(data, (d) => d[xAttribute]);
    const yExtent = d3.extent(data, (d) => d[yAttribute]);
    const xRange = xExtent[1] - xExtent[0];
    const yRange = yExtent[1] - yExtent[0];
    const xCenter = (xExtent[0] + xExtent[1]) / 2;
    const yCenter = (yExtent[0] + yExtent[1]) / 2;

    // Apply scale factors to adjust the visible range
    // Scale factor < 1 zooms in, > 1 zooms out
    const xDomain = [
      xCenter - xRange / 2 / xScaleFactor,
      xCenter + xRange / 2 / xScaleFactor,
    ];
    const yDomain = [
      yCenter - yRange / 2 / yScaleFactor,
      yCenter + yRange / 2 / yScaleFactor,
    ];

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(xDomain)
      .nice()
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(yDomain)
      .nice()
      .range([innerHeight, 0]);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
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

    // Calculate number of ticks based on scale factor (more zoom = more ticks)
    const xTickCount = Math.max(3, Math.min(15, Math.round(5 * xScaleFactor)));
    const yTickCount = Math.max(3, Math.min(15, Math.round(5 * yScaleFactor)));

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(xTickCount);
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#b1ada1");

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(yTickCount);
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
      .text(xAttribute.replace(/_/g, " "));

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -innerHeight / 2)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#c15f3c")
      .style("font-weight", "500")
      .text(yAttribute.replace(/_/g, " "));

    // Grid lines (use same tick count as axes)
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(xTickCount).tickSize(-innerHeight))
      .selectAll("line")
      .style("stroke", "#b1ada1")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "3,3");

    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(yScale).ticks(yTickCount).tickSize(-innerWidth))
      .selectAll("line")
      .style("stroke", "#b1ada1")
      .style("stroke-width", 1)
      .style("stroke-dasharray", "3,3");

    // Remove grid tick labels
    g.selectAll(".grid .tick text").remove();
    g.selectAll(".grid .tick line").style("opacity", 0.3);

    // Data points
    const circles = g
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[xAttribute]))
      .attr("cy", (d) => yScale(d[yAttribute]))
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
            <div style="font-weight: 600; margin-bottom: 4px; color: #1a1a1a;">
              ${xAttribute.replace(/_/g, " ")}
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              ${xAttribute}: <strong>${d[xAttribute].toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280;">
              ${yAttribute}: <strong>${d[yAttribute].toFixed(4)}</strong>
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

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [
    data,
    xAttribute,
    yAttribute,
    width,
    height,
    margin,
    xScaleFactor,
    yScaleFactor,
  ]);

  return (
    <div className="scatter-plot-container">
      <div className="scatter-controls">
        <div className="scale-control">
          <label className="scale-label">
            X-Axis Scale:{" "}
            <span className="scale-value">{xScaleFactor.toFixed(2)}x</span>
          </label>
          <input
            type="range"
            min="0.01"
            max="5"
            step="0.1"
            value={xScaleFactor}
            onChange={(e) => setXScaleFactor(parseFloat(e.target.value))}
            className="scale-slider"
          />
          <div className="scale-buttons">
            <button
              onClick={() => setXScaleFactor(Math.max(0.1, xScaleFactor - 0.1))}
              className="scale-btn"
            >
              −
            </button>
            <button
              onClick={() => setXScaleFactor(1.0)}
              className="scale-btn reset-btn"
            >
              Reset
            </button>
            <button
              onClick={() => setXScaleFactor(Math.min(5, xScaleFactor + 0.1))}
              className="scale-btn"
            >
              +
            </button>
          </div>
        </div>
        <div className="scale-control">
          <label className="scale-label">
            Y-Axis Scale:{" "}
            <span className="scale-value">{yScaleFactor.toFixed(2)}x</span>
          </label>
          <input
            type="range"
            min="0.01"
            max="5"
            step="0.1"
            value={yScaleFactor}
            onChange={(e) => setYScaleFactor(parseFloat(e.target.value))}
            className="scale-slider"
          />
          <div className="scale-buttons">
            <button
              onClick={() => setYScaleFactor(Math.max(0.1, yScaleFactor - 0.1))}
              className="scale-btn"
            >
              −
            </button>
            <button
              onClick={() => setYScaleFactor(1.0)}
              className="scale-btn reset-btn"
            >
              Reset
            </button>
            <button
              onClick={() => setYScaleFactor(Math.min(5, yScaleFactor + 0.1))}
              className="scale-btn"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <svg ref={svgRef} width={width} height={height} className="scatter-svg" />
    </div>
  );
};

export default ScatterPlot;
