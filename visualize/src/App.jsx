import { useState, useEffect } from "react";
import ScatterPlotView from "./components/ScatterPlotView";
import BoxPlot from "./components/BoxPlot";
import Histogram from "./components/Histogram";
import QuantilePlot from "./components/QuantilePlot";
import QQPlot from "./components/QQPlot";
import CorrelationMatrix from "./components/CorrelationMatrix";
import Summary from "./components/Summary";
import TabNavigation from "./components/TabNavigation";
import { loadCSV } from "./utils/csvLoader";
import "./App.css";

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("scatter");

  // All attributes except 'val'
  const attributes = [
    // "ladder_score",
    "log_gdp_per_capita",
    "social_support",
    "healthy_life_expectancy",
    "freedom_to_make_life_choices",
    "generosity",
    "perceptions_of_corruption",
  ];

  useEffect(() => {
    loadCSV("/Final_Clean.csv")
      .then((loadedData) => {
        setData(loadedData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error loading data: {error}</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "scatter":
        return <ScatterPlotView data={data} attributes={attributes} />;
      case "boxplot":
        return (
          <div className="dashboard">
            {attributes.map((attribute, index) => (
              <div key={attribute} className="chart-container">
                <BoxPlot
                  data={data}
                  attribute={attribute}
                  width={500}
                  height={400}
                />
              </div>
            ))}
          </div>
        );
      case "histogram":
        return (
          <div className="dashboard">
            {attributes.map((attribute, index) => (
              <div key={attribute} className="chart-container">
                <Histogram
                  data={data}
                  attribute={attribute}
                  width={500}
                  height={400}
                />
              </div>
            ))}
          </div>
        );
      case "quantile":
        return <QuantilePlot data={data} attributes={attributes} />;
      case "qqplot":
        return <QQPlot data={data} attributes={attributes} />;
      case "correlation":
        return <CorrelationMatrix data={data} attributes={attributes} />;
      case "summary":
        return <Summary data={data} attributes={attributes} />;
      default:
        return null;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Data Visualization Dashboard</h1>
        <p className="subtitle">
          Explore your data through interactive visualizations
        </p>
      </header>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="main-content">{renderTabContent()}</main>
    </div>
  );
}

export default App;
