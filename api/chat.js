export default async function handler(req, res) {
  // 1. Only allow POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { message, conversationHistory = [] } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    // 2. Validate Key
    if (!apiKey) {
      console.error('SERVER_ERROR: OPENROUTER_API_KEY is missing in Vercel Settings.');
      return res.status(200).json({ message: "🌿 **Configuration Error:** My API key is missing. Please add `OPENROUTER_API_KEY` to your Vercel Environment Variables!" });
    }

    // 3. Perform Fetch
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://plantiva-main.vercel.app',
        'X-Title': 'Plantiva AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: 'You are Plantiva, a world-class AI botanical expert.' },
          ...conversationHistory,
          { role: 'user', content: message }
        ],
      }),
    });

    // 4. Handle non-200 responses
    if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter Error:', errorText);
        return res.status(200).json({ message: `🌿 **AI Provider Error:** The AI service said: "${errorText.substring(0, 100)}..."` });
    }

    const data = await response.json();

    // 5. Final Safety Check
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({ message: data.choices[0].message.content });
    } else {
      console.error('Invalid Data Structure:', data);
      return res.status(200).json({ message: "🌿 **Data Error:** I received an empty response from the AI provider. Please check your credits." });
    }

  } catch (err) {
    console.error('CRITICAL_BACKEND_ERROR:', err.message);
    res.status(200).json({ message: `🌿 **System Error:** Something went wrong in my brain: ${err.message}` });
  }
}
