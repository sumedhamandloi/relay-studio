export interface Source {
  id: string;
  title: string;
  domain: string;
  summary: string;
  url: string;
  confidenceScore?: number;
  readingTime?: string;
}

export interface CommunityOpinion {
  id: string;
  viewpoint: string;
  summary: string;
  sourceType: "reddit" | "x" | "hackernews" | "other";
}

export interface Video {
  id: string;
  title: string;
  creator: string;
  duration: string;
  thumbnail: string;
  url: string;
}

export interface Misconception {
  id: string;
  myth: string;
  reality: string;
}

export interface ContrarianAngle {
  id: string;
  angle: string;
  explanation: string;
}

export interface Statistic {
  id: string;
  metric: string;
  value: string;
  context: string;
}

export interface ResearchData {
  overview: string;
  sources: Source[];
  community_opinions: CommunityOpinion[];
  popular_videos: Video[];
  misconceptions: Misconception[];
  contrarian_angles: ContrarianAngle[];
  statistics: Statistic[];
}
