export async function loadCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = parseFloat(values[index]);
    });
    return obj;
  });
  
  return data;
}
