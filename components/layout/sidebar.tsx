"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  FolderClosed, 
  Settings, 
  Search, 
  Plus, 
  Pin, 
  LogOut, 
  Compass, 
  ChevronRight, 
  Sparkles,
  BookOpen,
  X,
  PanelLeft,
  Brain,
  Code2,
  Atom,
  Palette,
  Megaphone,
  Rocket,
  Book,
  Network,
  Server,
  FlaskConical,
  Play,
  Pen,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Check
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { dbService } from "@/lib/services/database/db-service";
import { Workspace } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [newWsTitle, setNewWsTitle] = useState("");
  const [isAddingWs, setIsAddingWs] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{ text: string; top: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Modals state
  const [renamingWs, setRenamingWs] = useState<{ id: string, title: string } | null>(null);
  const [renameInput, setRenameInput] = useState("");
  
  const [deletingWs, setDeletingWs] = useState<{ id: string, title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-state");
    if (saved === null) {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(saved === "collapsed");
    }
    setIsMounted(true);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar-state", next ? "collapsed" : "expanded");
    if (next) { setIsHoverExpanded(false); }
    hideTooltip();
  };

  const handleSidebarMouseEnter = () => {
    if (isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => setIsHoverExpanded(true), 300);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsHoverExpanded(false);
    hideTooltip();
  };

  const showTooltip = (e: React.MouseEvent, text: string) => {
    if (isCollapsed && !isHoverExpanded) {
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveTooltip({ text, top: rect.top + rect.height / 2 });
    }
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const isVisuallyExpanded = !isCollapsed || isHoverExpanded;

  useEffect(() => {
    loadWorkspaces();
    
    const handleUpdate = () => loadWorkspaces();
    window.addEventListener("workspaces-updated", handleUpdate);
    return () => window.removeEventListener("workspaces-updated", handleUpdate);
  }, []);

  async function loadWorkspaces() {
    const data = await dbService.getWorkspaces();
    setWorkspaces(data);
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newWsTitle.trim()) return;
    const newWs = await dbService.createWorkspace(newWsTitle.trim(), "");
    setNewWsTitle("");
    setIsAddingWs(false);
    loadWorkspaces();
    router.push(`/workspace/${newWs.id}`);
  }

  async function handleTogglePin(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    await dbService.togglePinWorkspace(id);
    loadWorkspaces();
  }

  async function handleRenameWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!renamingWs || !renameInput.trim()) return;
    await dbService.renameWorkspace(renamingWs.id, renameInput.trim());
    setRenamingWs(null);
    setRenameInput("");
    loadWorkspaces();
  }

  async function handleDeleteWorkspace() {
    if (!deletingWs) return;
    setIsDeleting(true);
    await dbService.deleteWorkspace(deletingWs.id);
    
    setToastMessage("Workspace deleted successfully.");
    setTimeout(() => setToastMessage(null), 3000);
    
    // Check if we are currently on this workspace
    if (pathname === `/workspace/${deletingWs.id}` || pathname?.startsWith(`/workspace/${deletingWs.id}/`)) {
      router.push("/dashboard");
    }

    setDeletingWs(null);
    setIsDeleting(false);
    loadWorkspaces();
  }

  function handleLogout() {
    // Clear cookies & mock auth
    if (typeof window !== "undefined") {
      document.cookie = "relay-studio-mock-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/auth");
    }
  }

  const filteredWorkspaces = workspaces.filter(ws => {
    if (!searchQuery.trim()) return true;
    const terms = searchQuery.toLowerCase().trim().split(/\s+/);
    const title = ws.title.toLowerCase();
    return terms.every(term => title.includes(term));
  });

  const pinnedWorkspaces = filteredWorkspaces.filter(w => w.is_pinned);
  const otherWorkspaces = filteredWorkspaces.filter(w => !w.is_pinned);

  if (!isMounted) {
    return (
      <aside className="relative shrink-0 h-screen w-64 border-r border-border bg-muted select-none z-50" />
    );
  }

  return (
    <aside 
      className={cn(
        "relative shrink-0 h-screen border-r border-border bg-muted flex flex-col overflow-hidden transition-[width] duration-250 ease-in-out select-none z-50",
        isVisuallyExpanded ? "w-64" : "w-[72px]"
      )}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      <div className="flex flex-col h-full w-full">
        {/* Brand Header */}
        <div className={cn("relative h-14 flex items-center border-b border-border shrink-0 transition-all duration-200 overflow-hidden", isVisuallyExpanded ? "px-4" : "px-0 justify-center")}>
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground hover:opacity-90 transition-opacity">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-xs shrink-0">
              R
            </div>
            {isVisuallyExpanded && (
              <span className="tracking-tight text-sm whitespace-nowrap overflow-hidden">
                RELAY STUDIO
              </span>
            )}
          </Link>
          
          {isVisuallyExpanded && (
            <span className="ml-2 text-[9px] uppercase font-bold tracking-wider text-muted-text bg-[#1A1A1A] px-1.5 py-0.5 rounded border border-border shrink-0">
              Core
            </span>
          )}

          {isVisuallyExpanded && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-6 h-6 p-0 hover:bg-accent/10 shrink-0 text-muted-foreground hover:text-foreground ml-auto"
              onClick={toggleCollapse}
            >
              <PanelLeft className={cn("w-4 h-4 transition-transform", isCollapsed && "rotate-180")} />
            </Button>
          )}
        </div>

      {/* Main Navigation Links */}
      <div className={cn("space-y-1 transition-all duration-200", isVisuallyExpanded ? "p-3" : "p-2")}>
        <Link 
          href="/dashboard"
          onMouseEnter={(e) => showTooltip(e, "Discover Dashboard")}
          onMouseLeave={hideTooltip}
          className={cn(
            "w-full flex items-center rounded-[calc(var(--radius)-4px)] text-xs font-medium border transition-colors duration-150",
            pathname === "/dashboard" 
              ? "bg-card border-border text-foreground font-semibold" 
              : "text-muted-foreground border-transparent hover:bg-card/40 hover:text-foreground",
            isVisuallyExpanded ? "px-3 py-2 justify-between" : "p-2 justify-center"
          )}
        >
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-secondary shrink-0" />
            {isVisuallyExpanded && <span className="whitespace-nowrap">Discover Dashboard</span>}
          </div>
        </Link>

        <Link 
          href="/settings"
          onMouseEnter={(e) => showTooltip(e, "Workspace Settings")}
          onMouseLeave={hideTooltip}
          className={cn(
            "w-full flex items-center rounded-[calc(var(--radius)-4px)] text-xs font-medium border transition-colors duration-150",
            pathname === "/settings" 
              ? "bg-card border-border text-foreground font-semibold" 
              : "text-muted-foreground border-transparent hover:bg-card/40 hover:text-foreground",
            isVisuallyExpanded ? "px-3 py-2 justify-between" : "p-2 justify-center"
          )}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 shrink-0" />
            {isVisuallyExpanded && <span className="whitespace-nowrap">Workspace Settings</span>}
          </div>
        </Link>
      </div>

      <div className="h-[1px] bg-border mx-3" />

      {/* Workspaces Section */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className={cn("pb-1 flex items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-all duration-200", isVisuallyExpanded ? "p-3 justify-between" : "p-2 justify-center h-8 opacity-0 hidden")}>
          <span className="whitespace-nowrap">Workspaces</span>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-4 h-4 p-0 hover:bg-accent/10 hover:text-foreground"
              onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if (!isSearchOpen) {
                  setTimeout(() => inputRef.current?.focus(), 0);
                } else {
                  setSearchQuery("");
                }
              }}
            >
              {isSearchOpen ? <X className="w-3 h-3" /> : <Search className="w-3 h-3" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-4 h-4 p-0 hover:bg-accent/10 hover:text-foreground"
              onClick={() => setIsAddingWs(!isAddingWs)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Expandable Search Input */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="px-3 overflow-hidden"
            >
              <div className="py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search workspaces..."
                  className="w-full text-xs bg-muted/50 border border-border rounded px-2.5 py-1.5 focus:outline-none focus:border-primary focus:bg-card text-foreground placeholder:text-muted-foreground/60 transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create workspace inline form */}
        <AnimatePresence>
          {isAddingWs && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateWorkspace}
              className="px-3 py-2 space-y-2 overflow-hidden"
            >
              <input 
                type="text"
                value={newWsTitle}
                onChange={e => setNewWsTitle(e.target.value)}
                placeholder="Workspace title..."
                className="w-full text-xs bg-card border border-border rounded px-2.5 py-1.5 focus:outline-none focus:border-primary text-foreground"
                autoFocus
              />
              <div className="flex justify-end gap-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-[10px] px-2"
                  onClick={() => setIsAddingWs(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-6 text-[10px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  Create
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Scrollable Workspaces List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {/* Pinned Section */}
          {pinnedWorkspaces.length > 0 && (
            <div className="space-y-0.5">
              {isVisuallyExpanded && (
                <div className="px-2 text-[9px] font-bold text-muted-foreground flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5 text-primary rotate-45" />
                  <span>PINNED</span>
                </div>
              )}
              {pinnedWorkspaces.map(ws => (
                <WorkspaceLink 
                  key={ws.id} 
                  ws={ws} 
                  isActive={pathname?.startsWith(`/workspace/${ws.id}`) || false} 
                  onTogglePin={handleTogglePin}
                  onRename={(id, title) => { setRenamingWs({ id, title }); setRenameInput(title); }}
                  onDelete={(id, title) => setDeletingWs({ id, title })}
                  isVisuallyExpanded={isVisuallyExpanded}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
              ))}
            </div>
          )}

          {/* All Workspaces Section */}
          <div className="space-y-0.5">
            {pinnedWorkspaces.length > 0 && isVisuallyExpanded && (
              <div className="px-2 text-[9px] font-bold text-muted-foreground">
                <span>ALL WORKSPACES</span>
              </div>
            )}
            {otherWorkspaces.length > 0 ? (
              otherWorkspaces.map(ws => (
                <WorkspaceLink 
                  key={ws.id} 
                  ws={ws} 
                  isActive={pathname?.startsWith(`/workspace/${ws.id}`) || false} 
                  onTogglePin={handleTogglePin}
                  onRename={(id, title) => { setRenamingWs({ id, title }); setRenameInput(title); }}
                  onDelete={(id, title) => setDeletingWs({ id, title })}
                  isVisuallyExpanded={isVisuallyExpanded}
                  showTooltip={showTooltip}
                  hideTooltip={hideTooltip}
                />
              ))
            ) : (
              pinnedWorkspaces.length === 0 && (
                <div className="px-3 py-6 flex flex-col items-center justify-center text-center text-muted-foreground/60 border border-dashed border-border/40 rounded-md">
                  {searchQuery.trim() ? (
                    <>
                      <span className="text-[11px] mb-3">No matching workspaces found.</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-[10px] h-7 w-full flex items-center justify-center gap-1.5 font-semibold"
                        onClick={async () => {
                          const newWs = await dbService.createWorkspace(searchQuery.trim(), "");
                          setSearchQuery("");
                          setIsSearchOpen(false);
                          loadWorkspaces();
                          router.push(`/workspace/${newWs.id}`);
                        }}
                      >
                        <span>Research &quot;{searchQuery}&quot; instead</span>
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
                      <FolderClosed className="w-8 h-8 mb-3 opacity-20" />
                      <span className="text-xs font-semibold mb-1">No workspaces yet.</span>
                      <span className="text-[10px] opacity-70 mb-4 max-w-[150px]">Research your first topic to create one.</span>
                      <Link href="/dashboard">
                        <Button size="sm" className="h-6 text-[10px] px-3 font-semibold w-full">
                          Start Research &rarr;
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* User Section at bottom */}
      <div className={cn("mt-auto border-t border-border bg-card/40 flex items-center transition-all duration-200", isVisuallyExpanded ? "p-3 justify-between gap-3" : "p-2 flex-col justify-center gap-2")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-border flex items-center justify-center font-bold text-sm text-foreground shrink-0">
            K
          </div>
          {isVisuallyExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-semibold text-foreground truncate">Knowledge Creator</span>
              <span className="text-[10px] text-muted-foreground truncate">creator@relay.studio</span>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-7 h-7 p-0 rounded-md text-muted-foreground hover:bg-accent/10 hover:text-foreground shrink-0"
          onClick={handleLogout}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
      </div>

      {activeTooltip && !isVisuallyExpanded && (
        <div 
          className="fixed left-[80px] px-2 py-1 bg-card text-card-foreground text-[11px] font-medium rounded border border-border shadow-sm z-[100] whitespace-nowrap pointer-events-none fade-in animate-in duration-150"
          style={{ top: activeTooltip.top, transform: 'translateY(-50%)' }}
        >
          {activeTooltip.text}
        </div>
      )}

      {/* Rename Modal */}
      <AnimatePresence>
        {renamingWs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setRenamingWs(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-xl overflow-hidden p-5"
            >
              <h3 className="text-sm font-bold text-foreground mb-4">Rename Workspace</h3>
              <form onSubmit={handleRenameWorkspace}>
                <input 
                  type="text" 
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="w-full text-xs bg-muted/50 border border-border rounded px-3 py-2 mb-4 focus:outline-none focus:border-primary text-foreground"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRenamingWs(null)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-primary">Save Changes</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deletingWs && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setDeletingWs(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-card border border-destructive/20 rounded-xl shadow-xl overflow-hidden p-5"
            >
              <h3 className="text-lg font-bold text-foreground mb-1">Delete Workspace?</h3>
              <p className="text-xs text-foreground font-semibold mb-4 bg-muted/40 p-2 rounded-md">&quot;{deletingWs.title}&quot;</p>
              <p className="text-xs text-muted-foreground mb-3">This will permanently remove:</p>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1 mb-5">
                <li>Research Topics</li>
                <li>References</li>
                <li>Notes</li>
                <li>Generated Content</li>
              </ul>
              <p className="text-xs font-bold text-destructive mb-6">This action cannot be undone.</p>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDeletingWs(null)} disabled={isDeleting}>Cancel</Button>
                <Button type="button" variant="destructive" size="sm" onClick={handleDeleteWorkspace} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete Workspace"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 bg-card border border-border text-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-[110]"
          >
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-500" />
            </div>
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </aside>
  );
}

interface WorkspaceLinkProps {
  ws: Workspace;
  isActive: boolean;
  onTogglePin: (e: React.MouseEvent, id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string, title: string) => void;
  isVisuallyExpanded: boolean;
  showTooltip: (e: React.MouseEvent, text: string) => void;
  hideTooltip: () => void;
}

function getWorkspaceIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("ai") || lower.includes("artificial intelligence") || lower.includes("agent") || lower.includes("brain")) return Brain;
  if (lower.includes("web") || lower.includes("programming") || lower.includes("code") || lower.includes("dev")) return Code2;
  if (lower.includes("react") || lower.includes("next")) return Atom;
  if (lower.includes("ui") || lower.includes("ux") || lower.includes("design") || lower.includes("art")) return Palette;
  if (lower.includes("marketing") || lower.includes("seo") || lower.includes("brand")) return Megaphone;
  if (lower.includes("startup") || lower.includes("launch") || lower.includes("product")) return Rocket;
  if (lower.includes("research") || lower.includes("study") || lower.includes("learn")) return Book;
  if (lower.includes("system") || lower.includes("architecture")) return Network;
  if (lower.includes("server") || lower.includes("backend") || lower.includes("database")) return Server;
  if (lower.includes("science") || lower.includes("experiment") || lower.includes("lab")) return FlaskConical;
  if (lower.includes("youtube") || lower.includes("video") || lower.includes("content")) return Play;
  if (lower.includes("writing") || lower.includes("blog") || lower.includes("post")) return Pen;
  return null;
}

function WorkspaceLink({ ws, isActive, onTogglePin, onRename, onDelete, isVisuallyExpanded, showTooltip, hideTooltip }: WorkspaceLinkProps) {
  const Icon = getWorkspaceIcon(ws.title);
  const initial = ws.title.charAt(0).toUpperCase();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group w-full">
      <Link 
        href={`/workspace/${ws.id}`}
        onMouseEnter={(e) => showTooltip(e, ws.title)}
        onMouseLeave={hideTooltip}
        className={cn(
          "w-full flex items-center rounded-[calc(var(--radius)-4px)] text-xs font-medium border transition-all duration-200 overflow-hidden",
          isActive 
            ? "bg-accent/30 border-border/50 text-foreground font-semibold shadow-sm" 
            : "text-muted-foreground border-transparent hover:bg-card/60 hover:text-foreground hover:-translate-y-[1px] hover:shadow-sm",
          isVisuallyExpanded ? "px-2.5 py-1.5 justify-between" : "p-2 justify-center",
          isOpen ? "bg-card/60 text-foreground" : ""
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r-full" />
        )}
        <div className={cn("flex items-center gap-2 overflow-hidden", isVisuallyExpanded ? "pr-8" : "")}>
          {Icon ? (
            <Icon className={cn("w-3.5 h-3.5 shrink-0 transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground/90")} />
          ) : (
            <div className={cn("w-3.5 h-3.5 shrink-0 rounded-full flex items-center justify-center border transition-all duration-200", isActive ? "bg-primary border-primary" : "bg-primary/10 border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/30")}>
              <span className={cn("text-[8px] font-bold leading-none", isActive ? "text-primary-foreground" : "text-primary")}>{initial}</span>
            </div>
          )}
          {isVisuallyExpanded && <span className={cn("truncate whitespace-nowrap transition-colors duration-200", isActive && "text-foreground")}>{ws.title}</span>}
        </div>
      </Link>
      
      {isVisuallyExpanded && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 shrink-0 z-10 pointer-events-none group-hover:pointer-events-auto">
          {ws.is_pinned && !isOpen && (
            <Pin className="w-3 h-3 fill-primary text-primary opacity-100 transition-opacity group-hover:opacity-0" />
          )}
          
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger
              className={cn(
                "p-0.5 rounded opacity-0 transition-opacity hover:bg-card hover:text-foreground outline-none pointer-events-auto",
                (isOpen || ws.is_pinned) ? "absolute right-0" : "group-hover:opacity-100",
                isOpen ? "opacity-100" : ""
              )}
            >
              <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" sideOffset={5} className="w-48 bg-card border border-border rounded-lg shadow-xl p-1 z-[100] pointer-events-auto">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRename(ws.id, ws.title);
                  setIsOpen(false);
                }}
                className="text-xs font-medium cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-muted focus:bg-muted"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Rename Workspace</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTogglePin(e as any, ws.id);
                  setIsOpen(false);
                }}
                className="text-xs font-medium cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-muted focus:bg-muted"
              >
                <Pin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{ws.is_pinned ? "Unpin Workspace" : "Pin Workspace"}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                disabled
                className="text-xs font-medium cursor-not-allowed flex items-center justify-between gap-2 p-2 rounded-md opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-bold">Soon</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border/50 my-1" />
              
              <DropdownMenuItem 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(ws.id, ws.title);
                  setIsOpen(false);
                }}
                className="text-xs font-medium cursor-pointer flex items-center gap-2 p-2 rounded-md text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Workspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
