import fs from 'fs';

async function checkConfig() {
  const response = await fetch('https://plantiva-main.vercel.app/assets/index-BJc6xLCL.js');
  const text = await response.text();
  const match = text.match(/VITE_API_BASE_URL:\"([^\"]+)\"/);
  console.log('Parsed API Base URL:', match ? match[1] : 'Not Found (undefined)');
}

checkConfig();
