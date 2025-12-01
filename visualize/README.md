# Data Visualization Dashboard

A React + D3.js dashboard for visualizing CSV data with interactive scatter plots.

## Features

- 📊 **7 Scatter Plots**: One for each attribute vs `val`
- 🎨 **Claude-inspired Color Scheme**: Beautiful purple/blue gradient design
- 🖱️ **Interactive Tooltips**: Hover over data points to see detailed information
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Performance**: Built with Vite for optimal development experience

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
visualize/
├── public/
│   └── Merged_Final_Clean_Remove.csv  # Data file
├── src/
│   ├── components/
│   │   └── ScatterPlot.jsx           # Reusable scatter plot component
│   ├── utils/
│   │   └── csvLoader.js              # CSV loading utility
│   ├── App.jsx                        # Main application component
│   ├── App.css                        # Application styles
│   ├── main.jsx                       # Entry point
│   └── index.css                      # Global styles
├── index.html
├── package.json
└── vite.config.js
```

## Visualization Details

Each scatter plot shows the relationship between one of the following attributes and `val`:

- `ladder_score`
- `log_gdp_per_capita`
- `social_support`
- `healthy_life_expectancy`
- `freedom_to_make_life_choices`
- `generosity`
- `perceptions_of_corruption`

## Technologies Used

- **React 18** - UI framework
- **D3.js 7** - Data visualization library
- **Vite** - Build tool and dev server
