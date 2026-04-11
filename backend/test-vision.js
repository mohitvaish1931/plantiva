import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("Missing KEY");
  process.exit(1);
}

// 1x1 pixel black JPEG base64
const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

const testImage = async () => {
    const finalContent = [
        { type: "text", text: "What color is this one pixel image?" },
        { type: "image_url", image_url: { url: dummyBase64 } }
      ];
      
    const messages = [
        { role: 'system', content: 'You are Plantiva, a world-class AI botanical expert.' },
        { role: 'user', content: 'What plant is this?' },
        { role: 'assistant', content: 'Please provide me with a description or, even better, a picture of the plant!' },
        { role: 'user', content: finalContent }
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://plantiva-main.vercel.app',
          'X-Title': 'Plantiva Server'
        },
        body: JSON.stringify({ model: 'google/gemini-2.0-flash-001', messages }),
      });
      
    console.log(response.status);
    console.log(await response.text());
}

testImage();
