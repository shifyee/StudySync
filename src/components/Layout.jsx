import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Timer, BookOpen, GraduationCap,
  Users, Moon, Sun, Contrast, LogOut, Music2, VolumeX,
  PanelLeftClose, PanelLeftOpen, Settings, X, Gamepad2,
  Plus, Home, Hash, Volume2
} from 'lucide-react';
import { useApp } from '@/lib/store.jsx';
import { useMusic } from '@/lib/music.jsx';
import { api } from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo.jsx';
import Tour from '@/components/Tour.jsx';
import SettingsDialog from '@/components/SettingsDialog.jsx';
import NotesChat from '@/components/NotesChat.jsx';
import MusicPlayer from '@/components/MusicPlayer.jsx';
import TimerBadge from '@/components/TimerBadge.jsx';
import InstallBanner from '@/components/InstallBanner.jsx';
import CreateServerModal from '@/components/CreateServerModal.jsx';

const BASE_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/notes', label: 'Notes', icon: BookOpen },
  { to: '/grades', label: 'Grades', icon: GraduationCap },
  { to: '/rooms', label: 'Rooms', icon: Users },
];

function useGamesUnlocked() {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem('studysync_games_unlocked') === 'true'
  );
  useEffect(() => {
    const check = () => setUnlocked(localStorage.getItem('studysync_games_unlocked') === 'true');
    window.addEventListener('studysync:gamesUnlocked', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('studysync:gamesUnlocked', check);
      window.removeEventListener('storage', check);
    };
  }, []);
  return unlocked;
}

export default function Layout() {
  const { user, logout, isDark, toggleDark, contrast, toggleContrast, sidebarOpen, toggleSidebar } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servers, setServers] = useState([]);
  const [activeServer, setActiveServer] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const gamesUnlocked = useGamesUnlocked();
  
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = !location.pathname.startsWith('/server/');
  const match = location.pathname.match(/^\/server\/([^/]+)/);
  const activeServerId = match ? match[1] : null;

  useEffect(() => {
    api('/servers').then(setServers).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeServerId) {
      api(`/servers/${activeServerId}`).then(setActiveServer).catch(console.error);
    } else {
      setActiveServer(null);
    }
  }, [activeServerId]);

  const NAV = gamesUnlocked ? [...BASE_NAV, { to: '/study', label: 'Games', icon: Gamepad2 }] : BASE_NAV;

  const ServerRail = () => (
    <div className="w-[72px] shrink-0 bg-black/40 flex flex-col items-center py-3 gap-2 overflow-y-auto custom-scrollbar border-r border-border/20 z-20">
      <NavLink
        to="/"
        className={({ isActive }) => cn(
          "group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200",
          isHome ? "bg-primary text-primary-foreground rounded-xl shadow-md" : "bg-white/5 text-white/70 hover:bg-primary hover:text-white"
        )}
        title="Home"
      >
        <Home className="h-6 w-6" />
      </NavLink>

      <div className="w-8 h-[2px] bg-white/10 rounded-full my-1" />

      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => navigate(`/server/${server.id}`)}
          className={cn(
            "group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 text-lg font-bold",
            activeServerId === server.id 
              ? "bg-primary text-primary-foreground rounded-xl shadow-md" 
              : "bg-white/5 text-white/70 hover:bg-primary hover:text-white"
          )}
          title={server.name}
        >
          {server.name.charAt(0).toUpperCase()}
        </button>
      ))}

      <button 
        onClick={() => setIsCreateOpen(true)}
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-green-500 hover:bg-green-500 hover:text-white transition-all"
        title="Create a Server"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );

  const ChannelSidebar = ({ compact = false, onNavigate }) => (
    <>
      <div className={cn('flex h-[60px] items-center border-b border-border/40 px-4', compact ? 'justify-center' : 'justify-between')}>
        {isHome ? (
          <NavLink to="/" onClick={onNavigate}><Logo size={compact ? 'sm' : 'md'} compact={compact} /></NavLink>
        ) : (
          <div className="font-semibold truncate flex-1">{activeServer?.name || 'Server'}</div>
        )}
        {!compact && (
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:inline-flex text-muted-foreground">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {compact && (
        <div className="flex justify-center pt-2 pb-1">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden md:inline-flex">
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className={cn('flex-1 overflow-y-auto p-2 space-y-0.5', compact && 'px-1 mt-2')}>
        {isHome ? (
          NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate} 
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-[15px] font-medium transition-colors',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                compact && 'justify-center p-2.5'
              )}
              title={compact ? label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!compact && <span>{label}</span>}
            </NavLink>
          ))
        ) : (
          <>
            <div className="px-2 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Text Channels</div>
            {activeServer?.channels.filter(c => c.type === 'TEXT').map(channel => (
              <NavLink key={channel.id} to={`/server/${activeServerId}/${channel.id}`} onClick={onNavigate}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-[15px] font-medium transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground',
                  compact && 'justify-center'
                )}
                title={compact ? channel.name : undefined}
              >
                <Hash className="h-4 w-4 shrink-0 opacity-70" />
                {!compact && <span className="truncate">{channel.name}</span>}
              </NavLink>
            ))}
            
            <div className="px-2 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Voice Channels</div>
            {activeServer?.channels.filter(c => c.type === 'VOICE').map(channel => (
               <div key={channel.id} className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-[15px] font-medium text-muted-foreground hover:bg-accent/50 cursor-pointer', compact && 'justify-center')} title={compact ? channel.name : undefined}>
                <Volume2 className="h-4 w-4 shrink-0 opacity-70" />
                {!compact && <span className="truncate">{channel.name}</span>}
              </div>
            ))}
          </>
        )}
      </nav>

      <div className={cn('border-t border-border/50 p-2 bg-card', compact && 'flex flex-col items-center')}>
        <div className={cn('flex items-center gap-1.5', compact ? 'flex-col' : 'justify-between px-1')}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
              {user?.name?.charAt(0) || '?'}
            </div>
            {!compact && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">{user?.name || 'Student'}</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} className="h-8 w-8 text-muted-foreground">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { logout(); onNavigate?.(); }} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <a href="#main" className="sr-only">Skip to content</a>
      
      <ServerRail />

      <aside className={cn('hidden md:flex flex-col border-r border-border/50 bg-card/60 backdrop-blur-xl transition-[width] duration-200 z-10', sidebarOpen ? 'w-60' : 'w-16')}>
        <ChannelSidebar compact={!sidebarOpen} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col border-r bg-card shadow-xl">
            <div className="absolute right-2 top-2 z-10">
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ChannelSidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex items-center gap-2 border-b border-border/50 px-3 py-2 md:hidden bg-card/60 backdrop-blur-xl">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <span className="font-bold">{isHome ? 'StudySync' : activeServer?.name}</span>
        </header>

        <main id="main" className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <MusicPlayer />
      <TimerBadge />
      <InstallBanner />
      <Tour />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <NotesChat />
      
      <CreateServerModal 
        open={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={(newServer) => {
          setServers(prev => [...prev, newServer]);
          navigate(`/server/${newServer.id}`);
        }}
      />
    </div>
  );
}
