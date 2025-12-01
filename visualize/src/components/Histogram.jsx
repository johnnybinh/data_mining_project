import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./Histogram.css";

const Histogram = ({ data, attribute, width = 500, height = 400 }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract values for the attribute
    const values = data.map((d) => d[attribute]).filter((d) => !isNaN(d));

    // Create bins using d3.histogram
    const histogram = d3
      .histogram()
      .domain(d3.extent(values))
      .thresholds(20)(values);

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(values))
      .nice()
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(histogram, (d) => d.length)])
      .nice()
      .range([innerHeight, 0]);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "histogram-tooltip")
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
      .text(attribute.replace(/_/g, " "));

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 15)
      .attr("x", -innerHeight / 2)
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#c15f3c")
      .style("font-weight", "500")
      .text("Frequency");

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

    // Create bars
    const bars = g
      .selectAll(".bar")
      .data(histogram)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.x0))
      .attr("y", (d) => yScale(d.length))
      .attr("width", (d) => xScale(d.x1) - xScale(d.x0) - 1)
      .attr("height", (d) => innerHeight - yScale(d.length))
      .attr("fill", "#c15f3c")
      .attr("fill-opacity", 0.7)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill-opacity", 1)
          .attr("stroke-width", 2);

        tooltip.transition().duration(200).style("opacity", 1);

        tooltip
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px; color: #c15f3c;">
              ${attribute.replace(/_/g, " ")}
            </div>
            <div style="color: #6b7280; margin-bottom: 2px;">
              Range: <strong>${d.x0.toFixed(4)}</strong> - <strong>${d.x1.toFixed(4)}</strong>
            </div>
            <div style="color: #6b7280;">
              Count: <strong>${d.length}</strong>
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
          .attr("fill-opacity", 0.7)
          .attr("stroke-width", 1);

        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, attribute, width, height]);

  return (
    <div className="histogram-container">
      <svg ref={svgRef} width={width} height={height} className="histogram-svg" />
    </div>
  );
};

export default Histogram;
