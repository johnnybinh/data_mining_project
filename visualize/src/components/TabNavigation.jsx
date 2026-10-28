import './TabNavigation.css';

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'scatter', label: 'Scatter Plots' },
    { id: 'boxplot', label: 'Box Plots' },
    { id: 'histogram', label: 'Histograms' },
    { id: 'quantile', label: 'Quantile Plot' },
    { id: 'qqplot', label: 'Q-Q Plot' },
    { id: 'correlation', label: 'Correlation Matrix' },
    { id: 'summary', label: 'Summary' }
  ];

  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
