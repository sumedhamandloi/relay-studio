/**
 * Normalized URL Content Extraction Layer
 * 
 * Pipeline:
 *             URL
 *              ↓
 *       Platform Detector
 *              ↓
 *     ┌────────┼─────────┐
 *     ↓        ↓         ↓
 *  YouTube Instagram   X/LinkedIn/Web
 *     ↓        ↓         ↓
 *  Content/Transcript Extraction
 *              ↓
 *      Normalized Content
 */

export interface NormalizedContent {
  url: string;
  platform: "youtube" | "instagram" | "twitter" | "linkedin" | "reddit" | "github" | "generic";
  title?: string;
  creator?: string;
  rawText: string;
  transcript?: string;
  metadata?: Record<string, any>;
}

export class URLExtractor {
  /**
   * Fast rule-based platform detection
   */
  static detectPlatform(url: string): NormalizedContent["platform"] {
    const lower = url.toLowerCase().trim();
    if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      return "youtube";
    }
    if (lower.includes("instagram.com")) {
      return "instagram";
    }
    if (lower.includes("twitter.com") || lower.includes("x.com")) {
      return "twitter";
    }
    if (lower.includes("linkedin.com")) {
      return "linkedin";
    }
    if (lower.includes("reddit.com")) {
      return "reddit";
    }
    if (lower.includes("github.com")) {
      return "github";
    }
    return "generic";
  }

  /**
   * Extract content from Jina Reader as primary universal reader
   */
  private static async fetchViaJina(url: string): Promise<string> {
    try {
      const response = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          "Accept": "text/plain, text/markdown, application/json",
          "X-Retain-Images": "none",
        }
      });
      if (response.ok) {
        return await response.text();
      }
    } catch (err) {
      console.warn(`Jina reader fetch failed for ${url}:`, err);
    }
    return "";
  }

  /**
   * Extract YouTube metadata + transcript / captions
   */
  private static async extractYouTube(url: string): Promise<NormalizedContent> {
    let title = "";
    let creator = "";
    const metadata: Record<string, any> = {};

    // 1. YouTube oEmbed for accurate Title & Author
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        title = oembed.title || "";
        creator = oembed.author_name || "";
        metadata.thumbnail_url = oembed.thumbnail_url;
      }
    } catch (e) {
      console.warn("YouTube oEmbed failed:", e);
    }

    // 2. Fetch full transcript / readable content via reader
    const rawText = await this.fetchViaJina(url);

    return {
      url,
      platform: "youtube",
      title: title || undefined,
      creator: creator || undefined,
      rawText: rawText || `YouTube video at ${url}. Title: ${title}`,
      transcript: rawText || undefined,
      metadata
    };
  }

  /**
   * Extract Instagram Post/Reel captions and creator metadata
   */
  private static async extractInstagram(url: string): Promise<NormalizedContent> {
    let creator = "Instagram Creator";
    let title = "Instagram Post";

    // Attempt to parse creator handle from URL: instagram.com/username/p/... or /reel/...
    const match = url.match(/instagram\.com\/([a-zA-Z0-9._]+)\/(?:p|reel|tv)/i);
    if (match && match[1]) {
      creator = `@${match[1]}`;
    }

    const rawText = await this.fetchViaJina(url);

    return {
      url,
      platform: "instagram",
      title: title,
      creator,
      rawText: rawText || `Instagram post from ${creator} at ${url}`,
      metadata: { handle: creator }
    };
  }

  /**
   * Extract X / Twitter / LinkedIn / Web articles
   */
  private static async extractGeneric(url: string, platform: NormalizedContent["platform"]): Promise<NormalizedContent> {
    const rawText = await this.fetchViaJina(url);

    return {
      url,
      platform,
      rawText: rawText || `Content extracted from ${url}`,
      metadata: {}
    };
  }

  /**
   * Main entrypoint: Takes any URL, detects platform, and extracts normalized content
   */
  static async extract(url: string): Promise<NormalizedContent> {
    const cleanUrl = url.trim();
    const platform = this.detectPlatform(cleanUrl);

    try {
      switch (platform) {
        case "youtube":
          return await this.extractYouTube(cleanUrl);
        case "instagram":
          return await this.extractInstagram(cleanUrl);
        default:
          return await this.extractGeneric(cleanUrl, platform);
      }
    } catch (error) {
      console.error(`Error in URLExtractor for ${cleanUrl}:`, error);
      return {
        url: cleanUrl,
        platform,
        rawText: `Fallback content for ${cleanUrl}`
      };
    }
  }

  /**
   * Backward-compatibility helper for places expecting plain string content
   */
  static async extractText(url: string): Promise<string> {
    const result = await this.extract(url);
    return result.rawText;
  }
}
