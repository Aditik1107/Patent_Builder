const MOCK = process.env.MOCK === '1';

async function generateDraft(input) {
  if (MOCK) {
    return {
      title: input.title || 'Mock Title of the Invention',
      technicalField: 'The present invention relates generally to a data science application. More specifically, it relates to ' + input.problem,
      priorArt: 'Existing approaches include X and Y. However, they are limited. This section describes categories of existing approaches and their limits only without inventing patent numbers, paper titles, authors, companies or statistics.',
      objectives: ['To provide a mock objective 1.', 'To improve mock metric 2.', 'To resolve the issues in the prior art.'],
      advantages: 'The proposed solution provides advantages over existing technology by being mock-generated.',
      synopsis: 'The synopsis summarizes the solution: ' + input.solution + ' in 4-5 paragraphs.',
      figures: ['FIG. 1 is a block diagram of the system architecture.', 'FIG. 2 is a flowchart of the method.'],
      detailedDescription: 'The detailed description goes here. 10 refers to the system, 1xx refers to sensing modules. Example: test results are as follows.',
      example: 'Example section content here.',
      bestMethod: 'The best method involves using the described IoT sensors connected to a central microcontroller.',
      claims: ['A system for monitoring, comprising a sensor and a microcontroller.', 'The system of claim 1, further comprising a cloud database.'],
      inventiveStep: 'The inventive step resides in dynamically calculating the threshold based on environmental factors.',
      industrialApplication: 'This can be applied in agriculture, smart homes, and industrial farming.',
      abstract: 'An IoT based system for smart irrigation that monitors environmental factors to prevent overwatering.',
      diagramSVGs: ['<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="white" stroke="black"/><text x="10" y="50" font-family="Arial" font-size="14" fill="black">Mock Block Diagram</text></svg>']
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  // We use gemini-3.5-flash by default for fast, free generation
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  const systemPrompt = `You are an expert engineer writing a highly technical, straightforward, and grounded patent draft.
CRITICAL TONE DIRECTIVE: Write in natural, grounded, practical English. Your writing MUST sound like a real human engineer explaining a system to another engineer.
ABSOLUTELY NO AI CLICHES. You are STRICTLY FORBIDDEN from using the following words or phrases: "delve", "dive deep", "a myriad of", "seamless", "robust", "cutting-edge", "revolutionary", "leverage", "game-changing", "paradigm shift", "pivotal", "elevates", "fosters", "tapestry", "orchestrates", "unlocks", "realm".
Write in varied sentence lengths. Use third person present tense ("in one embodiment"). Focus entirely on technical facts, components, steps, and methodology without marketing fluff.

Rules:
- Prior art: describe categories of existing approaches and their limits only. NEVER invent patent numbers, paper titles, authors, companies, or statistics.
- Stay faithful to the provided solution; do not contradict it. Extra alternative embodiments go in a separate paragraph.
- Example section: if real results were supplied, use only those. Otherwise write a prophetic test set-up with NO invented numbers.
- Output strict JSON only.

JSON Keys:
- "title": Title of the invention (string)
- "technicalField": Technical field (string)
- "priorArt": Prior art (string, 4-5 paragraphs)
- "objectives": List of objectives (array of strings, each starting with "To ...")
- "advantages": Reason and Advantages Over Existing Technology (string)
- "synopsis": Synopsis (string, 4-5 paragraphs)
- "figures": List of figure descriptions (array of strings, e.g. "FIG. 1 is a block diagram of...")
- "detailedDescription": Detailed description walking through figures using reference numerals grouped by hundreds (10 = system, 1xx, 2xx modules, 7xx data, 8xx steps), bulleted list of parameters/checks, other embodiments. (string)
- "example": Example subsection content (string)
- "bestMethod": Best method of performance of the invention (string)
- "claims": List of claims. Ensure Claim 1 is an independent claim, and subsequent claims are dependent (array of strings, e.g. "A system comprising...", "The system of claim 1, wherein...")
- "inventiveStep": Inventive step of your invention (string)
- "industrialApplication": Industrial application (string)
- "abstract": Abstract (string, max 150 words)
- "diagramSVGs": Array of valid, self-contained SVG code strings. Generate at least 5 technical block diagrams or flowcharts illustrating different aspects of the system or method. Use a clean, black-and-white patent style. Ensure text is visible. (array of strings)
`;

  const userMessage = `Title: ${input.title || '(none)'}
Problem: ${input.problem}
Solution: ${input.solution}
Components/Tech: ${input.components || '(none)'}
Real Results: ${input.results || '(none)'}`;

  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite'
  ];

  let attempts = 0;
  while (attempts < modelsToTry.length) {
    const currentModel = modelsToTry[attempts];
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: { 
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error with model ${currentModel}:`, errorText);
        throw new Error('LLM API failure');
      }

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      
      // basic cleanup in case the LLM wrapped it in markdown code blocks despite responseMimeType
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      return JSON.parse(text);
    } catch (err) {
      console.error(`Error on attempt ${attempts + 1} using ${currentModel}:`, err.message);
      attempts++;
      if (attempts >= modelsToTry.length) {
        throw new Error('Failed to generate valid draft text after multiple attempts across different models. Please try again.');
      }
      // Wait for 3 seconds before retrying to allow the server to recover
      console.log('Waiting 3 seconds before retrying with a different model...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

async function extractFromText(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const defaultModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  const systemMessage = `You are a technical analyst. The user will provide the text extracted from a presentation (.pptx) about a technical project.
Extract the following information and return it strictly in JSON format. Do not invent details; use ONLY what is available in the text.
Return JSON with these keys:
- "title": Working title of the invention/project.
- "problem": Problem statement or motivation (at least 40 chars).
- "solution": The core solution or methodology (at least 100 chars).
- "components": The components, tech stack, or modules used.
- "results": Any results, test data, or conclusions.

If any field cannot be reasonably found, provide a generic placeholder or your best summary based on the available text.`;

  const payload = {
    contents: [
      { role: 'user', parts: [{ text: text.substring(0, 30000) }] }
    ],
    systemInstruction: {
      parts: [{ text: systemMessage }]
    },
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash-lite'
  ];

  let res;
  let lastError = '';

  for (const currentModel of modelsToTry) {
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) break;

      const errText = await res.text();
      lastError = errText;
      console.warn(`Extraction failed with model ${currentModel}: ${res.status} - ${errText}`);

      // If it's a 4xx error that isn't 404 (Not Found) or 429 (Too Many Requests), don't retry
      if (res.status >= 400 && res.status < 500 && res.status !== 404 && res.status !== 429) {
        throw new Error(`Extraction failed: ${errText}`);
      }
    } catch (e) {
      lastError = e.message;
      console.warn(`Fetch error with model ${currentModel}: ${e.message}`);
    }
    // wait 3s before retrying next model
    await new Promise(r => setTimeout(r, 3000));
  }

  if (!res || !res.ok) {
    throw new Error(`All models failed. Last error: ${lastError}`);
  }

  const data = await res.json();
  try {
    const raw = data.candidates[0].content.parts[0].text;
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    throw new Error('Failed to parse extraction response from LLM.');
  }
}

module.exports = { generateDraft, extractFromText };
