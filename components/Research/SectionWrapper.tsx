import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  id: string;
  title: string;
  icon: LucideIcon;
  description?: string;
  children: React.ReactNode;
}

export function SectionWrapper({ id, title, icon: Icon, description, children }: SectionWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div id={id} className="scroll-mt-32 mb-16 last:mb-0">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full group flex flex-col items-start text-left focus:outline-none"
      >
        <div className="flex items-center gap-2 mb-1.5 w-full">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h2>
          <div className="ml-auto text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
        )}
      </button>

      <div className="w-full h-px bg-border/50 mb-6" />

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
