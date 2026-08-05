import { ResearchData } from "./types";

export const mockResearchData: ResearchData = {
  overview: "Linear is a modern issue tracking tool designed for software teams. It emphasizes speed, an opinionated workflow, and a clean, keyboard-first interface. Unlike legacy tools like Jira, Linear forces teams into specific agile patterns (like cycles instead of sprints) and avoids heavy customization, resulting in a faster, more streamlined experience.",
  sources: [
    {
      id: "s1",
      title: "The Linear Method",
      domain: "linear.app",
      summary: "Linear's official guide to product development, emphasizing focus, momentum, and simplicity over complex workflows.",
      url: "https://linear.app/method",
      confidenceScore: 98,
      readingTime: "5 min read"
    },
    {
      id: "s2",
      title: "Why developers love Linear",
      domain: "techcrunch.com",
      summary: "An analysis of Linear's rise in popularity among startups, focusing on its UI/UX and performance.",
      url: "https://techcrunch.com",
      confidenceScore: 85,
      readingTime: "8 min read"
    },
    {
      id: "s3",
      title: "Sync Architecture at Linear",
      domain: "linear.app",
      summary: "Deep dive into how Linear engineered its real-time sync engine to make the app feel instantaneous.",
      url: "https://linear.app/blog/sync-architecture",
      confidenceScore: 95,
      readingTime: "12 min read"
    }
  ],
  community_opinions: [
    {
      id: "c1",
      viewpoint: "Speed is the ultimate feature",
      summary: "Across Hacker News and Reddit, users repeatedly cite the sub-100ms response times as the primary reason they refuse to go back to Jira.",
      sourceType: "hackernews"
    },
    {
      id: "c2",
      viewpoint: "Frustration with lack of custom fields",
      summary: "Enterprise teams often complain on Twitter that the lack of extensive custom fields makes cross-department reporting difficult.",
      sourceType: "x"
    },
    {
      id: "c3",
      viewpoint: "Keyboard shortcuts create flow state",
      summary: "Developers appreciate the command-K interface, noting it allows them to triage issues without ever touching the mouse.",
      sourceType: "reddit"
    }
  ],
  popular_videos: [
    {
      id: "v1",
      title: "Linear app review - Better than Jira?",
      creator: "Dev Workflow",
      duration: "12:45",
      thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
      url: "https://youtube.com"
    },
    {
      id: "v2",
      title: "How Linear built their sync engine",
      creator: "Tech Talks",
      duration: "45:20",
      thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
      url: "https://youtube.com"
    }
  ],
  misconceptions: [
    {
      id: "m1",
      myth: "Linear is just Jira with dark mode.",
      reality: "Linear is fundamentally opinionated. It deliberately restricts customization to enforce a specific, fast workflow."
    },
    {
      id: "m2",
      myth: "It's only for engineers.",
      reality: "While developer-focused, many companies use Linear company-wide, including design, marketing, and leadership."
    }
  ],
  contrarian_angles: [
    {
      id: "ca1",
      angle: "Opinionated software is a double-edged sword.",
      explanation: "While Linear's strict workflow creates speed, it breaks down in highly complex enterprises that legitimately need bespoke reporting structures that Linear refuses to build."
    },
    {
      id: "ca2",
      angle: "The 'Speed' moat will disappear.",
      explanation: "As web frameworks improve, legacy competitors will eventually fix their performance issues, forcing Linear to compete purely on features."
    }
  ],
  statistics: [
    {
      id: "st1",
      metric: "< 50ms",
      value: "Average sync time",
      context: "Time taken to sync state across the local client and server."
    },
    {
      id: "st2",
      metric: "70%",
      value: "Keyboard usage",
      context: "Percentage of actions performed via shortcuts rather than mouse clicks by power users."
    },
    {
      id: "st3",
      metric: "0",
      value: "Loading spinners",
      context: "Linear employs optimistic UI updates to eliminate loading states entirely."
    }
  ]
};
