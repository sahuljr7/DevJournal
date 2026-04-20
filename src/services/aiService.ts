/// <reference types="vite/client" />
/**
 * Service to interact with the Ollama API for text processing.
 */

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_BASE_URL || 'https://api.ollama.com';
const OLLAMA_API_KEY = import.meta.env.VITE_OLLAMA_API_KEY;

export async function summarizeLogs(logs: string[]): Promise<string> {
  if (!logs.length) return "No logs found to summarize.";

  const combinedLogs = logs.join('\n---\n');
  const prompt = `Summarize the following work logs into a concise executive summary. Highlight the key achievements and outcomes. Keep it professional and brief (max 3-5 bullet points).\n\nWORK LOGS:\n${combinedLogs}`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3', // Defaulting to llama3, though this should be configurable
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "No summary was generated.";
  } catch (error) {
    console.error('Ollama Summarization Error:', error);
    throw error;
  }
}
