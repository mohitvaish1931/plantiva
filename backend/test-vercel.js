

async function testBackend() {
  const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

  const response = await fetch('https://plantiva-main.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: 'what plant is this', 
      imageDataUrl: dummyBase64 
    })
  });

  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
}

testBackend();
