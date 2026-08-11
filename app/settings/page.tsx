"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { 
  Sparkles, 
  Settings as SettingsIcon, 
  User, 
  Sliders, 
  Youtube, 
  BookOpen, 
  Save, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Moon,
  Laptop
} from "lucide-react";
import { dbService } from "@/lib/services/database/db-service";
import { BrandProfile, Integration } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  
  // Form states
  const [brandName, setBrandName] = useState("");
  const [voiceDesc, setVoiceDesc] = useState("");
  const [guidelines, setGuidelines] = useState("");
  
  // Status states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const bp = await dbService.getBrandProfile();
    setBrandProfile(bp);
    setBrandName(bp.name);
    setVoiceDesc(bp.voice_description || "");
    setGuidelines(bp.guidelines || "");

    await fetch("/api/workspaces"); // triggers backend verification / analytics if needed
    if (typeof window !== "undefined") {
      const storedInts = localStorage.getItem("relay_studio_integrations");
      if (storedInts) {
        setIntegrations(JSON.parse(storedInts));
      }
    }
  }

  async function handleSaveBrand(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    
    await dbService.saveBrandProfile({
      name: brandName,
      voice_description: voiceDesc,
      guidelines: guidelines
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    loadSettings();
  }

  function handleToggleIntegration(platform: string) {
    const updated = integrations.map(int => {
      if (int.platform === platform) {
        return { ...int, active: !int.active };
      }
      return int;
    });
    setIntegrations(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("relay_studio_integrations", JSON.stringify(updated));
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main settings content view */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto select-none p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header Title */}
        <div className="border-b border-border/60 pb-6">
          <h1 className="text-xl font-bold tracking-tight">Studio Settings</h1>
          <p className="text-xs text-muted-foreground mt-1">Configure your brand guidelines, AI settings, and integrations.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings Nav Sidebar */}
          <div className="space-y-1.5 text-xs font-medium text-muted-foreground shrink-0 md:col-span-1">
            <button className="w-full text-left px-3 py-2 bg-card border border-border rounded-[calc(var(--radius)-4px)] text-foreground flex items-center gap-2 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Brand Profile & Voice</span>
            </button>
            <button className="w-full text-left px-3 py-2 border border-transparent hover:bg-card/40 hover:text-foreground rounded-[calc(var(--radius)-4px)] flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>AI Provider Configurations</span>
            </button>
            <button className="w-full text-left px-3 py-2 border border-transparent hover:bg-card/40 hover:text-foreground rounded-[calc(var(--radius)-4px)] flex items-center gap-2">
              <Moon className="w-3.5 h-3.5" />
              <span>Appearance Styles</span>
            </button>
          </div>

          {/* Settings Details Panels */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Panel 1: Brand Profile */}
            <Card className="bg-card border-border p-5 rounded-[var(--radius)] space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b border-border/40 pb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Tone of Voice Guidelines</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Relay Studio uses these profiles to format script output drafts to match your visual script structure.
              </p>

              <form onSubmit={handleSaveBrand} className="space-y-3.5 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Profile Name</label>
                  <input 
                    type="text"
                    required
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    placeholder="e.g. Technical Architect"
                    className="w-full bg-muted/40 border border-border rounded-[calc(var(--radius)-4px)] px-3 py-2 focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Voice Description</label>
                  <textarea 
                    value={voiceDesc}
                    onChange={e => setVoiceDesc(e.target.value)}
                    placeholder="Explain the persona (e.g. professional, concise, direct...)"
                    className="w-full h-16 bg-muted/40 border border-border rounded-[calc(var(--radius)-4px)] px-3 py-2 focus:outline-none focus:border-primary text-foreground resize-none placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Formatting Rules</label>
                  <textarea 
                    value={guidelines}
                    onChange={e => setGuidelines(e.target.value)}
                    placeholder="e.g. - Keep paragraphs short. - Never use exclamation marks..."
                    className="w-full h-24 bg-muted/40 border border-border rounded-[calc(var(--radius)-4px)] px-3 py-2 focus:outline-none focus:border-primary text-foreground resize-none placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="flex justify-end gap-2 items-center pt-2">
                  {saveSuccess && (
                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Saved Successfully
                    </span>
                  )}
                  <Button 
                    type="submit" 
                    className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-1.5"
                    disabled={isSaving}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save Guidelines"}</span>
                  </Button>
                </div>
              </form>
            </Card>

            {/* Panel 2: Integrations */}
            <Card className="bg-card border-border p-5 rounded-[var(--radius)] space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b border-border/40 pb-2">
                <Laptop className="w-4 h-4 text-secondary" />
                <span>Connected Integrations</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connect external platforms to import sources or publish finished scripts directly.
              </p>

              <div className="space-y-3.5">
                {integrations.map(int => (
                  <div key={int.platform} className="flex items-center justify-between border border-border bg-muted/40 p-3.5 rounded-[calc(var(--radius)-4px)]">
                    <div className="flex items-center gap-2.5">
                      {int.platform === "youtube" ? (
                        <Youtube className="w-4 h-4 text-red-500" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-secondary" />
                      )}
                      <div className="text-xs">
                        <span className="font-bold text-foreground block capitalize">{int.platform} Connection</span>
                        <span className="text-[10px] text-muted-foreground">
                          {int.active ? "Connected and sync active" : "Integration disabled"}
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleToggleIntegration(int.platform)}
                      className={int.active ? "border-primary/20 text-primary bg-primary/5 hover:bg-primary/10" : ""}
                    >
                      {int.active ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Panel 3: AI Provider Future Placeholder */}
            <Card className="bg-card border-border p-5 rounded-[var(--radius)] space-y-4 opacity-75">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground border-b border-border/40 pb-2">
                <Sliders className="w-4 h-4" />
                <span>AI Providers (Future module)</span>
              </div>
              <div className="flex items-start gap-2.5 bg-muted/40 border border-border p-3.5 rounded-[calc(var(--radius)-4px)] text-xs text-muted-foreground">
                <ShieldAlert className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 leading-normal">
                  <span className="font-bold text-foreground block">BYO Keys Feature coming soon</span>
                  <span>Bring your own OpenAI, Anthropic, or Google Gemini keys to configure custom models for script generation. This panel is reserved for future settings schema updates.</span>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
