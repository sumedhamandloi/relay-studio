/**
 * Relay Studio AI Router
 * 
 * Architecture:
 *           Relay Studio
 *                │
 *          AI Router
 *                │
 *     ┌──────────┴──────────┐
 *     ▼                     ▼
 * Flash-Lite              Flash
 * (Fast/light tasks)   (Complex reasoning, synthesis, deep breakdowns)
 */

interface RequestOptions {
  systemInstruction?: string;
  temperature?: number;
  json?: boolean;
  apiKey?: string;
}

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Verified working Flash models in order of priority:
// 1. gemini-3.6-flash: Google's flagship fast model (Active & 200 OK)
// 2. gemini-3.5-flash: Resilient fallback Flash
// 3. gemini-flash-latest: Alias endpoint (subject to capacity spikes)
// 4. gemini-flash-lite-latest: Emergency lightweight fallback
const FLASH_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-flash-lite-latest"
];

// Verified working Flash-Lite models in order of priority:
const FLASH_LITE_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.6-flash"
];

export class AIRouter {
  private static resolveApiKey(providedKey?: string): string {
    const key = providedKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not set. Please ensure it is present in .env.local");
    }
    return key;
  }

  /**
   * Helper to invoke a Gemini model via Generative Language API
   */
  private static async invokeSingleModel(
    modelName: string,
    prompt: string,
    options: RequestOptions = {}
  ): Promise<string> {
    const apiKey = this.resolveApiKey(options.apiKey);
    const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;

    const body: Record<string, any> = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: options.temperature ?? 0.3
      }
    };

    if (options.json) {
      body.generationConfig.responseMimeType = "application/json";
    }

    if (options.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: options.systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`Gemini API Error [${modelName}] (${response.status}): ${errText}`);
      (err as any).status = response.status;
      (err as any).model = modelName;
      throw err;
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error(`No content generated from model ${modelName}`);
    }

    return candidateText;
  }

  /**
   * Execute model request with automatic fallback chain and retry for 503/429 errors
   */
  private static async invokeWithFallback(
    modelChain: string[],
    prompt: string,
    options: RequestOptions = {}
  ): Promise<string> {
    let lastError: any = null;

    for (const model of modelChain) {
      try {
        return await this.invokeSingleModel(model, prompt, options);
      } catch (err: any) {
        lastError = err;
        const status = err.status;
        console.warn(`[AIRouter] Model ${model} failed (status: ${status || "unknown"}). Falling back...`, err.message?.slice(0, 150));
        
        // If 503 (high demand) or 429 (rate limit), continue immediately to next model in the fallback chain
        if (status === 503 || status === 429 || status === 500) {
          continue;
        }
        
        // For fatal client errors (e.g. 400 bad prompt syntax), trying another model may not help unless it's model-specific
        continue;
      }
    }

    // If all models in the chain failed, wait 1.5s and retry the primary model once
    console.warn("[AIRouter] All models in chain encountered errors. Retrying primary model after backoff...");
    await new Promise(r => setTimeout(r, 1500));
    try {
      return await this.invokeSingleModel(modelChain[0], prompt, options);
    } catch (retryErr: any) {
      throw lastError || retryErr;
    }
  }

  /**
   * Primary Model: Gemini Flash
   * Reserved for:
   * - Research Synthesis across 20+ sources
   * - YouTube deep breakdown (hook, key points, timeline, engagement)
   * - Instagram post / reel analysis (format, caption analysis, signals)
   * - High-value content generation (hooks, scripts)
   */
  static async callFlash<T = any>(
    prompt: string,
    options: RequestOptions = { json: true }
  ): Promise<T> {
    const text = await this.invokeWithFallback(FLASH_MODELS, prompt, options);
    if (options.json !== false) {
      try {
        const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
        return JSON.parse(cleaned) as T;
      } catch (err) {
        console.warn("Failed to parse JSON from Flash output, returning raw text:", err);
        return text as unknown as T;
      }
    }
    return text as unknown as T;
  }

  /**
   * Fast & Cost-Efficient Model: Gemini Flash-Lite
   * Reserved for:
   * - URL categorization and ambiguity resolution
   * - Quick entity/tag extraction
   * - Metadata normalization
   * - Fast classification & sentiment checks
   */
  static async callFlashLite<T = any>(
    prompt: string,
    options: RequestOptions = { json: true }
  ): Promise<T> {
    const text = await this.invokeWithFallback(FLASH_LITE_MODELS, prompt, options);
    if (options.json !== false) {
      try {
        const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();
        return JSON.parse(cleaned) as T;
      } catch (err) {
        console.warn("Failed to parse JSON from Flash-Lite output, returning raw text:", err);
        return text as unknown as T;
      }
    }
    return text as unknown as T;
  }

  /**
   * Flash-Lite boring task: Classify an ambiguous URL or content snippet
   */
  static async classifyContent(contentSnippet: string): Promise<{
    platform: string;
    topic: string;
    contentType: string;
  }> {
    const prompt = `
Classify the following web or social content into a structured JSON:
{
  "platform": "youtube" | "instagram" | "twitter" | "linkedin" | "reddit" | "github" | "generic",
  "topic": "Brief 1-3 word category",
  "contentType": "video" | "reel" | "post" | "article" | "discussion" | "repository"
}

Content Snippet:
${contentSnippet.slice(0, 1500)}
`;
    return this.callFlashLite(prompt, { json: true, temperature: 0.1 });
  }
}
