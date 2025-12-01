import { useMemo } from 'react';
import * as d3 from 'd3';
import './Summary.css';

const Summary = ({ data, attributes }) => {
  const statistics = useMemo(() => {
    if (!data || data.length === 0) return [];

    return attributes.map(attr => {
      const values = data.map(d => d[attr]);
      const sorted = [...values].sort(d3.ascending);
      
      return {
        attribute: attr,
        mean: d3.mean(values),
        median: d3.quantile(sorted, 0.5),
        q1: d3.quantile(sorted, 0.25),
        q3: d3.quantile(sorted, 0.75),
        min: d3.min(values),
        max: d3.max(values),
        std: d3.deviation(values),
        count: values.length
      };
    });
  }, [data, attributes]);

  if (!data || data.length === 0) {
    return <div className="summary-container">No data available</div>;
  }

  return (
    <div className="summary-container">
      <h2 className="summary-title">Data Summary Statistics</h2>
      <div className="summary-grid">
        {statistics.map(stat => (
          <div key={stat.attribute} className="summary-card">
            <h3 className="summary-card-title">
              {stat.attribute.replace(/_/g, ' ')}
            </h3>
            <div className="summary-stats">
              <div className="stat-row">
                <span className="stat-label">Count:</span>
                <span className="stat-value">{stat.count}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Mean:</span>
                <span className="stat-value">{stat.mean.toFixed(4)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Median:</span>
                <span className="stat-value">{stat.median.toFixed(4)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Std Dev:</span>
                <span className="stat-value">{stat.std.toFixed(4)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Min:</span>
                <span className="stat-value">{stat.min.toFixed(4)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Q1:</span>
                <span className="stat-value">{stat.q1.toFixed(4)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Q3:</span>
                <span className="stat-value">{stat.q3.toFixed(4)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Max:</span>
                <span className="stat-value">{stat.max.toFixed(4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
