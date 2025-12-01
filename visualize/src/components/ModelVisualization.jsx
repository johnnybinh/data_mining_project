import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { loadAllModels } from '../utils/modelLoader';
import './ModelVisualization.css';

const ModelVisualization = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);

  useEffect(() => {
    // Load model files from the models directory
    const modelPaths = [
      '/models/linearRegression.model',
      '/models/M5p.model'
    ];

    loadAllModels(modelPaths)
      .then(loadedModels => {
        setModels(loadedModels);
        setLoading(false);
        if (loadedModels.length > 0) {
          setSelectedModel(loadedModels[0]);
        }
      })
      .catch(error => {
        console.error('Error loading models:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="model-loading-container">
        <div className="loading-spinner"></div>
        <p>Loading models...</p>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="model-error-container">
        <p>No models found. Please ensure model files are in the /models directory.</p>
      </div>
    );
  }

  return (
    <div className="model-visualization-container">
      <div className="model-header">
        <h2 className="model-title">WEKA Model Visualization</h2>
        <p className="model-subtitle">Explore your trained machine learning models</p>
      </div>

      <div className="model-content">
        {/* Model Selection Sidebar */}
        <div className="model-sidebar">
          <h3 className="sidebar-title">Available Models</h3>
          <div className="model-list">
            {models.map((model, index) => (
              <div
                key={index}
                className={`model-card ${selectedModel?.name === model.name ? 'active' : ''}`}
                onClick={() => setSelectedModel(model)}
              >
                <div className="model-card-header">
                  <span className="model-icon">
                    {model.modelType === 'Linear Regression' ? '📈' : '🌳'}
                  </span>
                  <h4 className="model-name">{model.name}</h4>
                </div>
                <div className="model-card-info">
                  <span className="model-type">{model.modelType}</span>
                  <span className="model-size">
                    {(model.size / 1024).toFixed(2)} KB
                  </span>
                </div>
                {model.loaded ? (
                  <div className="model-status loaded">✓ Loaded</div>
                ) : (
                  <div className="model-status error">✗ Error</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Model Details Panel */}
        <div className="model-details-panel">
          {selectedModel ? (
            <ModelDetails model={selectedModel} />
          ) : (
            <div className="no-model-selected">
              <p>Select a model to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ModelDetails = ({ model }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (model && model.loaded && svgRef.current) {
      // Create visualization based on model type
      createModelVisualization(model);
    }
  }, [model]);

  const createModelVisualization = (modelData) => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };

    svg.attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (modelData.modelType === 'Linear Regression') {
      createLinearRegressionViz(g, innerWidth, innerHeight, modelData);
    } else if (modelData.modelType === 'M5P Model Tree') {
      createM5PViz(g, innerWidth, innerHeight, modelData);
    } else {
      createGenericViz(g, innerWidth, innerHeight, modelData);
    }
  };

  const createLinearRegressionViz = (g, width, height, modelData) => {
    // Create a visualization representing linear regression
    // Since we can't parse the actual coefficients, we'll show a conceptual representation
    
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', '600')
      .style('fill', '#c15f3c')
      .text('Linear Regression Model');

    // Draw a conceptual regression line
    const line = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveLinear);

    const lineData = [
      { x: 0, y: height * 0.8 },
      { x: width, y: height * 0.2 }
    ];

    g.append('path')
      .datum(lineData)
      .attr('fill', 'none')
      .attr('stroke', '#c15f3c')
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add scatter points around the line
    const points = Array.from({ length: 20 }, (_, i) => ({
      x: (width / 20) * i,
      y: height * 0.2 + (height * 0.6 / 20) * i + (Math.random() - 0.5) * 50
    }));

    g.selectAll('.point')
      .data(points)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 4)
      .attr('fill', '#c15f3c')
      .attr('opacity', 0.6);

    // Add axes
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', height)
      .attr('y2', height)
      .attr('stroke', '#b1ada1')
      .attr('stroke-width', 2);

    g.append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#b1ada1')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#b1ada1')
      .text('Features (X)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#b1ada1')
      .text('Target (Y)');
  };

  const createM5PViz = (g, width, height, modelData) => {
    // Create a tree-like visualization for M5P model
    g.append('text')
      .attr('x', width / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', '600')
      .style('fill', '#c15f3c')
      .text('M5P Model Tree');

    // Draw a simplified tree structure
    const rootX = width / 2;
    const rootY = 20;
    const nodeWidth = 100;
    const nodeHeight = 40;
    const levelHeight = 100;

    // Root node
    const rootNode = g.append('g')
      .attr('transform', `translate(${rootX}, ${rootY})`);

    rootNode.append('rect')
      .attr('x', -nodeWidth / 2)
      .attr('y', -nodeHeight / 2)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('fill', '#c15f3c')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#c15f3c')
      .attr('stroke-width', 2)
      .attr('rx', 5);

    rootNode.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '12px')
      .style('fill', '#c15f3c')
      .style('font-weight', '600')
      .text('Root');

    // Child nodes
    const childNodes = [
      { x: rootX - width / 4, y: rootY + levelHeight },
      { x: rootX + width / 4, y: rootY + levelHeight }
    ];

    childNodes.forEach((pos, i) => {
      // Draw connecting line
      g.append('line')
        .attr('x1', rootX)
        .attr('y1', rootY + nodeHeight / 2)
        .attr('x2', pos.x)
        .attr('y2', pos.y - nodeHeight / 2)
        .attr('stroke', '#b1ada1')
        .attr('stroke-width', 2);

      // Draw child node
      const childNode = g.append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`);

      childNode.append('rect')
        .attr('x', -nodeWidth / 2)
        .attr('y', -nodeHeight / 2)
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('fill', '#f4f3ee')
        .attr('stroke', '#c15f3c')
        .attr('stroke-width', 2)
        .attr('rx', 5);

      childNode.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '11px')
        .style('fill', '#b1ada1')
        .text(`Leaf ${i + 1}`);
    });

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height - 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', '#b1ada1')
      .text('Simplified Tree Structure');
  };

  const createGenericViz = (g, width, height, modelData) => {
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#b1ada1')
      .text(`Model: ${modelData.modelType}`);
  };

  return (
    <div className="model-details">
      <div className="model-info-section">
        <h3 className="section-title">Model Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Model Name:</span>
            <span className="info-value">{model.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Model Type:</span>
            <span className="info-value">{model.modelType}</span>
          </div>
          <div className="info-item">
            <span className="info-label">File Size:</span>
            <span className="info-value">{(model.size / 1024).toFixed(2)} KB</span>
          </div>
          <div className="info-item">
            <span className="info-label">Status:</span>
            <span className={`info-value ${model.loaded ? 'status-loaded' : 'status-error'}`}>
              {model.loaded ? '✓ Loaded' : '✗ Error'}
            </span>
          </div>
        </div>
      </div>

      <div className="model-visualization-section">
        <h3 className="section-title">Model Visualization</h3>
        <div className="visualization-container">
          <svg ref={svgRef} className="model-svg"></svg>
        </div>
        <div className="model-note">
          <p>
            <strong>Note:</strong> WEKA models are Java serialized files. 
            This visualization shows a conceptual representation of the model structure. 
            For detailed model parameters, consider using WEKA's GUI or command-line tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModelVisualization;
