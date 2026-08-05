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

export function OverviewSection({ data }: { data: string }) {
  return (
    <SectionWrapper 
      id="overview" 
      title="Overview" 
      icon={BookOpen} 
      description="A concise explanation of the topic."
    >
      <div className="text-base leading-relaxed text-foreground/90 font-medium space-y-4">
        {data.split("\n").map((paragraph, idx) => (
          <p key={idx}>
            {paragraph}
          </p>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function SourcesSection({ data }: { data: Source[] }) {
  return (
    <SectionWrapper 
      id="sources" 
      title="Sources" 
      icon={Link2} 
      description="Trusted sources and reference material."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((source) => (
          <a 
            key={source.id} 
            href={source.url} 
            target="_blank" 
            rel="noreferrer"
            className="group block p-5 rounded-2xl border border-border bg-card/40 hover:bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=128`} 
                    alt="" 
                    className="w-5 h-5 rounded-sm bg-muted"
                  />
                  <div className="text-xs font-bold text-foreground/80 uppercase tracking-wider">{source.domain}</div>
                </div>
                {source.confidenceScore && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {source.confidenceScore}% Match
                  </div>
                )}
              </div>
              <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-tight">{source.title}</h3>
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

export function CommunityOpinionsSection({ data }: { data: CommunityOpinion[] }) {
  return (
    <SectionWrapper 
      id="community" 
      title="Community Opinions" 
      icon={MessageSquare} 
      description="Synthesized insights from Reddit, Hacker News, X, and other platforms."
    >
      <div className="space-y-4">
        {data.map((opinion) => (
          <div key={opinion.id} className="p-5 rounded-2xl border border-border bg-card/20 flex gap-4">
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {opinion.viewpoint}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed pl-3.5 border-l-2 border-border/50">{opinion.summary}</p>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
              {opinion.sourceType}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function PopularVideosSection({ data }: { data: Video[] }) {
  return (
    <SectionWrapper 
      id="videos" 
      title="Popular Videos" 
      icon={Youtube} 
      description="Relevant YouTube videos explaining the topic."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((video) => (
          <a 
            key={video.id} 
            href={video.url} 
            target="_blank" 
            rel="noreferrer"
            className="group block rounded-xl overflow-hidden border border-border bg-card/40 hover:border-primary/50 transition-all"
          >
            <div className="relative aspect-video bg-muted">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                {video.duration}
              </div>
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

export function MisconceptionsSection({ data }: { data: Misconception[] }) {
  return (
    <SectionWrapper 
      id="misconceptions" 
      title="Common Misconceptions" 
      icon={AlertTriangle} 
      description="Common misunderstandings and the actual reality."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 relative overflow-hidden">
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

export function ContrarianAnglesSection({ data }: { data: ContrarianAngle[] }) {
  return (
    <SectionWrapper 
      id="contrarian" 
      title="Contrarian Angles" 
      icon={Lightbulb} 
      description="Alternative viewpoints or unpopular perspectives."
    >
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border border-border bg-card/20">
            <h3 className="text-sm font-bold text-foreground mb-1.5">{item.angle}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.explanation}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}

export function StatisticsSection({ data }: { data: Statistic[] }) {
  return (
    <SectionWrapper 
      id="statistics" 
      title="Statistics" 
      icon={BarChart} 
      description="Important metrics and figures."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((stat) => (
          <div key={stat.id} className="p-4 rounded-xl border border-border bg-card/40 flex flex-col justify-center">
            <div className="text-2xl font-black text-primary mb-1">{stat.metric}</div>
            <div className="text-xs font-bold text-foreground mb-2">{stat.value}</div>
            <div className="text-[10px] text-muted-foreground leading-relaxed">{stat.context}</div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
