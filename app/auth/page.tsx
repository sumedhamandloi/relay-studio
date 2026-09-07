"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Chrome, Compass, Sparkles, Mail, CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

import { supabase } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleMockLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    // Set mock authentication cookie
    document.cookie = "relay-studio-mock-auth=true; path=/; max-age=86400;";
    
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 800);
  }

  async function handleMagicLinkLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setIsMagicLinkSent(true);
    } catch (err: any) {
      console.error("Magic link error:", err);
      setErrorMessage(err.message || "Failed to send magic link. Check your Supabase email settings.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "github") {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error(`${provider} sign in error:`, err);
      setErrorMessage(err.message || `Failed to sign in with ${provider}`);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setErrorMessage("Authentication failed or was cancelled. Please try again.");
    }
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[380px] bg-card border border-border rounded-[var(--radius)] p-7 relative z-10 shadow-sm"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-sm mb-3">
            R
          </div>
          <h1 className="text-base font-bold text-foreground">Sign in to Relay Studio</h1>
          <p className="text-[11px] text-muted-foreground mt-1">
            Research once. Create everywhere.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center">
            {errorMessage}
          </div>
        )}

        {/* Auth Forms */}
        {isMagicLinkSent ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-foreground">Check your inbox</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                We sent a secure login link to <span className="font-semibold text-foreground">{email}</span>. Click the link to complete your sign-in.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1.5 mx-auto"
              onClick={() => {
                setIsMagicLinkSent(false);
                setEmail("");
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Use a different email
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleMagicLinkLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-9 text-xs bg-muted border-border focus:border-primary text-foreground"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5"
                disabled={isLoading}
              >
                <Mail className="w-3.5 h-3.5" />
                {isLoading ? "Sending Magic Link..." : "Continue with Magic Link"}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/80"></div>
              <span className="flex-shrink mx-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">or continue with</span>
              <div className="flex-grow border-t border-border/80"></div>
            </div>

            {/* Social Auth Providers */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                className="h-9 text-xs font-semibold border border-border hover:bg-accent/15 flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                <Chrome className="w-3.5 h-3.5 text-foreground" />
                <span>Google</span>
              </Button>
              <Button
                variant="ghost"
                className="h-9 text-xs font-semibold border border-border hover:bg-accent/15 flex items-center justify-center gap-2"
                onClick={() => handleSocialLogin("github")}
                disabled={isLoading}
              >
                <Github className="w-3.5 h-3.5 text-foreground" />
                <span>GitHub</span>
              </Button>
            </div>

            {/* Dev bypass option */}
            <div className="mt-4 pt-3 border-t border-border/50 text-center">
              <button
                type="button"
                onClick={handleMockLogin}
                className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Skip sign-in for local development
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
