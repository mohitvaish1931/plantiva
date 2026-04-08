
async function testKey() {
  const apiKey = "edb4ba2f1f6ed107427ac3e158f136c0";
  const lat = 26.9124; // Jaipur (near your typical coordinates)
  const lon = 75.7873;
  
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const data = await res.json();
    console.log("UV API Response:", data);
  } catch (e) {
    console.log("Error:", e);
  }
}
testKey();
