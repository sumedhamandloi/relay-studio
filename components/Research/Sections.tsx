import React from "react";
import { 
  BookOpen, 
  Link2, 
  MessageSquare, 
  Youtube, 
  AlertTriangle, 
  Lightbulb, 
  BarChart 
} from "lucide-react";
import { SectionWrapper } from "./SectionWrapper";
import { 
  ResearchData, 
  Source, 
  CommunityOpinion, 
  Video, 
  Misconception, 
  ContrarianAngle, 
  Statistic 
} from "./types";

export function OverviewSection({ data }: { data?: any }) {
  const text = typeof data === "string" ? data : (data?.summary || data?.overview || "");
  if (!text) return null;

  return (
    <SectionWrapper 
      id="overview" 
      title="Overview" 
      icon={BookOpen} 
      description="A concise explanation of the topic."
    >
      <div className="text-base leading-relaxed text-foreground/90 font-medium space-y-4">
        {text.split("\n").filter(Boolean).map((paragraph: string, idx: number) => (
          <p key={idx}>
            {paragraph}
          </p>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function SourcesSection({ data }: { data?: Source[] }) {
  const sources = Array.isArray(data) ? data : [];
  if (sources.length === 0) return null;

  return (
    <SectionWrapper 
      id="sources" 
      title="Sources" 
      icon={Link2} 
      description="Trusted sources and reference material."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((source, idx) => (
          <a 
            key={source.id || idx} 
            href={source.url || "#"} 
            target="_blank" 
            rel="noreferrer"
            className="group block p-5 rounded-2xl border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {source.domain && (
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=128`} 
                      alt="" 
                      className="w-5 h-5 rounded-sm bg-muted"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                  <div className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                    {source.domain || "Reference"}
                  </div>
                </div>
                {source.confidenceScore && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {source.confidenceScore}% Match
                  </div>
                )}
              </div>
              <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">
                {source.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">{source.summary}</p>
              
              {source.readingTime && (
                <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-auto border-t border-border/50 pt-3">
                  {source.readingTime}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function CommunityOpinionsSection({ data }: { data?: CommunityOpinion[] }) {
  const opinions = Array.isArray(data) ? data : [];
  if (opinions.length === 0) return null;

  return (
    <SectionWrapper 
      id="community" 
      title="Community Opinions" 
      icon={MessageSquare} 
      description="Synthesized insights from Reddit, Hacker News, X, and other platforms."
    >
      <div className="space-y-4">
        {opinions.map((opinion, idx) => (
          <div key={opinion.id || idx} className="p-5 rounded-2xl border border-border bg-card/20 flex gap-4">
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {opinion.viewpoint}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-3.5 border-l-2 border-border/50">{opinion.summary}</p>
            </div>
            {opinion.sourceType && (
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
                {opinion.sourceType}
              </div>
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function PopularVideosSection({ data }: { data?: Video[] }) {
  const videos = Array.isArray(data) ? data : [];
  if (videos.length === 0) return null;

  return (
    <SectionWrapper 
      id="videos" 
      title="Popular Videos" 
      icon={Youtube} 
      description="Relevant YouTube videos explaining the topic."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video, idx) => (
          <a 
            key={video.id || idx} 
            href={video.url || "#"} 
            target="_blank" 
            rel="noreferrer"
            className="group block rounded-xl overflow-hidden border border-border bg-card/40 hover:border-primary/50 transition-all"
          >
            <div className="relative aspect-video bg-muted">
              {video.thumbnail && (
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                  {video.duration}
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="text-xs font-bold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">{video.title}</h3>
              <p className="text-[10px] text-muted-foreground">{video.creator}</p>
            </div>
          </a>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function MisconceptionsSection({ data }: { data?: Misconception[] }) {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return null;

  return (
    <SectionWrapper 
      id="misconceptions" 
      title="Common Misconceptions" 
      icon={AlertTriangle} 
      description="Common misunderstandings and the actual reality."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-destructive/50" />
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-start gap-2">
              <span className="text-destructive font-black">Myth:</span> 
              {item.myth}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-primary font-bold mr-1">Reality:</span> 
              {item.reality}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function ContrarianAnglesSection({ data }: { data?: ContrarianAngle[] }) {
  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) return null;

  return (
    <SectionWrapper 
      id="contrarian" 
      title="Contrarian Angles" 
      icon={Lightbulb} 
      description="Alternative viewpoints or unpopular perspectives."
    >
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="p-4 rounded-xl border border-border bg-card/20">
            <h3 className="text-sm font-bold text-foreground mb-1.5">{item.angle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.explanation}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function StatisticsSection({ data }: { data?: Statistic[] }) {
  const stats = Array.isArray(data) ? data : [];
  if (stats.length === 0) return null;

  return (
    <SectionWrapper 
      id="statistics" 
      title="Statistics" 
      icon={BarChart} 
      description="Important metrics and figures."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={stat.id || idx} className="p-4 rounded-xl border border-border bg-card/40 flex flex-col justify-center">
            <div className="text-2xl font-black text-primary mb-1">{stat.metric}</div>
            <div className="text-xs font-bold text-foreground mb-2">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">{stat.context}</div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function KeyFindingsSection({ data }: { data?: string[] }) {
  const findings = Array.isArray(data) ? data : [];
  if (findings.length === 0) return null;

  return (
    <SectionWrapper 
      id="key_findings" 
      title="Key Findings" 
      icon={Lightbulb} 
      description="Crucial takeaways and verified empirical trends."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {findings.map((finding, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <span className="text-sm text-foreground/90 font-medium leading-relaxed">{finding}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function ContradictionsSection({ data }: { data?: string[] }) {
  const contradictions = Array.isArray(data) ? data : [];
  if (contradictions.length === 0) return null;

  return (
    <SectionWrapper 
      id="contradictions" 
      title="Contradictions & Debates" 
      icon={AlertTriangle} 
      description="Conflicting perspectives and contested claims in the research."
    >
      <div className="space-y-3">
        {contradictions.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-sm text-foreground/90 font-medium leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

