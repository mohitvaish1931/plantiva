

async function testStatus() {
  const response = await fetch('https://plantiva-main.vercel.app/api/status');
  console.log(await response.text());
}

testStatus();
