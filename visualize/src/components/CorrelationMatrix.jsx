import { useEffect, useRef } from "react";
import * as d3 from "d3";
import "./CorrelationMatrix.css";

const CorrelationMatrix = ({ data, attributes }) => {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !attributes) return;

    // Include 'val' in the list of attributes for correlation
    const allAttributes = [...attributes, "val"];
    const n = allAttributes.length;

    // Calculate correlation matrix
    const correlationMatrix = allAttributes.map((attr1) =>
      allAttributes.map((attr2) => {
        if (attr1 === attr2) return 1.0;

        const values1 = data.map((d) => d[attr1]);
        const values2 = data.map((d) => d[attr2]);

        const mean1 = d3.mean(values1);
        const mean2 = d3.mean(values2);

        let numerator = 0;
        let sumSq1 = 0;
        let sumSq2 = 0;

        for (let i = 0; i < values1.length; i++) {
          const diff1 = values1[i] - mean1;
          const diff2 = values2[i] - mean2;
          numerator += diff1 * diff2;
          sumSq1 += diff1 * diff1;
          sumSq2 += diff2 * diff2;
        }

        const denominator = Math.sqrt(sumSq1 * sumSq2);
        return denominator === 0 ? 0 : numerator / denominator;
      })
    );

    const container = d3.select(containerRef.current);
    container.selectAll("*").remove();

    const containerWidth =
      container.node().getBoundingClientRect().width || 800;
    const margin = { top: 100, right: 100, bottom: 100, left: 100 };
    const width = Math.min(containerWidth - margin.left - margin.right, 800);
    const height = width; // Square matrix
    const cellSize = width / n;

    const svg = container
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Color scale - Claude colors (terracotta for positive, beige for negative)
    const colorScale = d3
      .scaleSequential((t) => {
        // Map correlation from -1 to 1 to colors
        // Positive correlations: terracotta (#c15f3c)
        // Negative correlations: lighter beige
        if (t >= 0) {
          // Positive: use terracotta with intensity based on correlation
          const intensity = t; // 0 to 1
          const r = 193;
          const g = 95 + (255 - 95) * (1 - intensity * 0.5);
          const b = 60 + (255 - 60) * (1 - intensity * 0.5);
          return `rgb(${r}, ${Math.floor(g)}, ${Math.floor(b)})`;
        } else {
          // Negative: use beige with intensity
          const intensity = Math.abs(t);
          const r = 177 + (255 - 177) * (1 - intensity * 0.3);
          const g = 173 + (255 - 173) * (1 - intensity * 0.3);
          const b = 161 + (255 - 161) * (1 - intensity * 0.3);
          return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        }
      })
      .domain([-1, 1]);

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "correlation-tooltip")
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

    // Create cells
    const cells = g
      .selectAll(".cell")
      .data(
        correlationMatrix.flatMap((row, i) =>
          row.map((value, j) => ({
            value,
            row: allAttributes[i],
            col: allAttributes[j],
            i,
            j,
          }))
        )
      )
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", (d) => d.j * cellSize)
      .attr("y", (d) => d.i * cellSize)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", (d) => colorScale(d.value))
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke-width", 2).attr("stroke", "#c15f3c");

        tooltip.transition().duration(200).style("opacity", 1);

        tooltip
          .html(
            `
            <div style="font-weight: 600; margin-bottom: 4px; color: #c15f3c;">
              ${d.row.replace(/_/g, " ")} ↔ ${d.col.replace(/_/g, " ")}
            </div>
            <div style="color: #6b7280; font-size: 14px;">
              Correlation: <strong style="color: #c15f3c;">${d.value.toFixed(
                4
              )}</strong>
            </div>
          `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke-width", 1).attr("stroke", "#ffffff");

        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Add text labels for correlation values
    g.selectAll(".cell-label")
      .data(
        correlationMatrix.flatMap((row, i) =>
          row.map((value, j) => ({
            value,
            row: allAttributes[i],
            col: allAttributes[j],
            i,
            j,
          }))
        )
      )
      .enter()
      .append("text")
      .attr("class", "cell-label")
      .attr("x", (d) => d.j * cellSize + cellSize / 2)
      .attr("y", (d) => d.i * cellSize + cellSize / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .style("font-size", `${Math.max(10, cellSize / 6)}px`)
      .style("fill", (d) => (Math.abs(d.value) > 0.5 ? "#ffffff" : "#1a1a1a"))
      .style("font-weight", "500")
      .text((d) => d.value.toFixed(2));

    // X-axis labels (top)
    g.selectAll(".x-label")
      .data(allAttributes)
      .enter()
      .append("text")
      .attr("class", "x-label")
      .attr("x", (d, i) => i * cellSize + cellSize / 2)
      .attr("width", "50%")
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#c15f3c")
      .style("font-weight", "500")
      .text((d) => d.replace(/_/g, " "));
    // .attr(
    //   "transform",
    //   (d, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -10)`
    // );

    // Y-axis labels (left)
    g.selectAll(".y-label")
      .data(allAttributes)
      .enter()
      .append("text")
      .attr("class", "y-label")
      .attr("x", -10)
      .attr("y", (d, i) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "11px")
      .style("fill", "#c15f3c")
      .style("font-weight", "500")
      .text((d) => d.replace(/_/g, " "));

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, attributes]);

  return (
    <div className="correlation-matrix-container">
      <div className="correlation-matrix-wrapper">
        <h2 className="correlation-title">Correlation Matrix</h2>
        <p className="correlation-subtitle">
          Pearson correlation coefficients between all attributes
        </p>
        <div ref={containerRef} className="correlation-svg-container"></div>
      </div>
    </div>
  );
};

export default CorrelationMatrix;
