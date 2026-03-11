// Groq API integration — reads API key from CONFIG (config.js).

const GroqAPI = (() => {
    const GROQ_MODEL = "llama-3.3-70b-versatile";
    const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

    function _getApiKey() {
        if (typeof CONFIG !== "undefined" && CONFIG.GROQ_API_KEY) {
            return CONFIG.GROQ_API_KEY;
        }
        throw new Error("Groq API key not found. Add your key to config.js");
    }

    async function generateTestcases(problemInfo) {
        const apiKey = _getApiKey();

        const prompt = `Analyze this LeetCode problem and generate 5 valid testcases.

Problem Title: ${problemInfo.title}

Problem Description:
${problemInfo.description}

Examples:
${problemInfo.examples}

Constraints:
${problemInfo.constraints}

Include:
- edge cases
- boundary cases
- small inputs
- tricky inputs

Return ONLY JSON in this format:

[
  {"input": "example input 1", "expected_output": "expected output 1"},
  {"input": "example input 2", "expected_output": "expected output 2"}
]

Do not include explanations.`;

        const response = await fetch(GROQ_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that generates LeetCode testcases. Always respond with valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 4096,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API error (${response.status}): ${err}`);
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content || "";

        // Extract JSON array from response (handles markdown code fences)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error("Failed to parse testcases from Groq response.");
        }

        const testcases = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(testcases)) {
            throw new Error("Groq response was not a JSON array.");
        }

        return testcases.map((tc) => ({
            input: typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input),
            expected_output: tc.expected_output != null ? String(tc.expected_output) : "",
        }));
    }

    return { generateTestcases };
})();
