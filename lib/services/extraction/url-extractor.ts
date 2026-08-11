export class URLExtractor {
  /**
   * Extracts clean Markdown content from a given URL using Jina Reader API.
   * Jina works well for general websites and also extracts transcripts from YouTube links.
   */
  static async extract(url: string): Promise<string> {
    try {
      const response = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          "Accept": "text/event-stream, application/json, text/plain",
          "X-Retain-Images": "none",
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to extract content: ${response.statusText}`);
      }
      
      const text = await response.text();
      return text;
    } catch (error) {
      console.error("Error extracting URL:", error);
      throw error;
    }
  }
}
