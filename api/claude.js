export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });

    const { prompt, qty = 5, fileBase64, fileMime } = req.body;
    if (!prompt && !fileBase64) return res.status(400).json({ error: 'prompt or file required' });

    const systemPrompt = `You are a math teacher creating ${qty} multiple choice questions. Output ONLY in this exact format with no extra text or markdown:

1) [question text]
A) [option]
B) [option]
C) [option]
D) [option]

2) [question text]
A) [option]
B) [option]
C) [option]
D) [option]

[continue for all ${qty} questions]

ANSWERS
[letter for Q1], [letter for Q2], ...

Rules:
- Write fractions as 3/8 or 1/2 (not special characters)
- Use × for multiply, ÷ for divide, ² for squared, √ for square root
- Make wrong answers plausible (common mistakes, off-by-one errors)
- Each question must have exactly one correct answer
- Do not include any explanation, preamble, or markdown — only the questions and ANSWERS section`;

    const userText = prompt || `Extract and create ${qty} math questions from the provided file.`;

    const parts = [];

    if (fileBase64) {
        if (fileMime === 'application/pdf' || (fileMime && fileMime.startsWith('image/'))) {
            parts.push({ inlineData: { mimeType: fileMime, data: fileBase64 } });
        }
    }

    parts.push({ text: systemPrompt + '\n\n' + userText });

    try {
        const model = 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const payload = {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts }],
                generationConfig: { maxOutputTokens: 4096 }
            })
        };

        let response, data;
        for (let attempt = 0; attempt < 3; attempt++) {
            response = await fetch(url, payload);
            data = await response.json();
            if (response.ok || response.status !== 503) break;
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }

        if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' });

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        res.status(200).json({ text });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
