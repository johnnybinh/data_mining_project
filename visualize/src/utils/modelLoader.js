// Utility to load WEKA model information
// Note: WEKA models are Java serialized files, so we'll extract metadata
// and display model information. For full parsing, a backend service would be needed.

export async function loadModelInfo(modelPath) {
  try {
    const response = await fetch(modelPath);
    const blob = await response.blob();
    
    return {
      name: modelPath.split('/').pop().replace('.model', ''),
      size: blob.size,
      type: blob.type || 'application/octet-stream',
      lastModified: response.headers.get('last-modified') || new Date().toISOString(),
      // Model type inferred from filename
      modelType: inferModelType(modelPath),
      loaded: true
    };
  } catch (error) {
    console.error(`Error loading model ${modelPath}:`, error);
    return {
      name: modelPath.split('/').pop().replace('.model', ''),
      loaded: false,
      error: error.message
    };
  }
}

function inferModelType(filename) {
  const name = filename.toLowerCase();
  if (name.includes('linear') || name.includes('regression')) {
    return 'Linear Regression';
  } else if (name.includes('m5p') || name.includes('m5')) {
    return 'M5P Model Tree';
  } else if (name.includes('tree')) {
    return 'Decision Tree';
  } else if (name.includes('neural') || name.includes('mlp')) {
    return 'Neural Network';
  } else if (name.includes('svm')) {
    return 'Support Vector Machine';
  } else if (name.includes('random') || name.includes('forest')) {
    return 'Random Forest';
  } else if (name.includes('naive') || name.includes('bayes')) {
    return 'Naive Bayes';
  }
  return 'Unknown Model Type';
}

export async function loadAllModels(modelPaths) {
  const modelPromises = modelPaths.map(path => loadModelInfo(path));
  return Promise.all(modelPromises);
}
