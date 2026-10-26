import { useEffect, useState } from 'react';
import { Palette, Accessibility, User, ExternalLink, LayoutTemplate, Upload } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input, Textarea } from '@/components/ui/input.jsx';
import { api } from '@/lib/api.js';
import { useApp } from '@/lib/store.jsx';
import { cn } from '@/lib/utils';

const THEMES = [
  { id: 'nordic', name: 'Nordic', tag: 'Dusty blue · sage', swatches: ['hsl(207 25% 45%)', 'hsl(110 20% 90%)', 'hsl(228 40% 98%)'] },
  { id: 'ocean', name: 'Ocean', tag: 'Teal · cyan', swatches: ['hsl(195 65% 42%)', 'hsl(180 45% 90%)', 'hsl(195 40% 98%)'] },
  { id: 'sunset', name: 'Sunset', tag: 'Warm orange · peach', swatches: ['hsl(25 80% 50%)', 'hsl(35 70% 92%)', 'hsl(30 40% 98%)'] },
  { id: 'forest', name: 'Forest', tag: 'Deep green · moss', swatches: ['hsl(145 42% 36%)', 'hsl(100 35% 90%)', 'hsl(130 30% 98%)'] },
  { id: 'rose', name: 'Rose', tag: 'Dusty pink · blush', swatches: ['hsl(345 55% 50%)', 'hsl(340 65% 94%)', 'hsl(350 40% 98%)'] },
  { id: 'slate', name: 'Slate', tag: 'Neutral · cool gray', swatches: ['hsl(220 15% 42%)', 'hsl(220 20% 92%)', 'hsl(220 25% 98%)'] },
];

const STYLES = [
  { id: 'nordic', name: 'Nordic', tag: 'Serif headings · balanced', preview: { radius: '12px', heading: 'Georgia, serif', headingWeight: 700 } },
  { id: 'studio', name: 'Studio', tag: 'Sharp · dense · modern', preview: { radius: '6px', heading: 'Inter Tight, sans-serif', headingWeight: 700 } },
  { id: 'paper', name: 'Paper', tag: 'Rounded · soft · bookish', preview: { radius: '20px', heading: 'Georgia, serif', headingWeight: 700 } },
];

export default function SettingsDialog({ open, onClose }) {
  const { user, setUser } = useApp();
  const [tab, setTab] = useState('profile');
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('studysync_theme_v2') || 'nordic'; } catch { return 'nordic'; } });
  const [style, setStyle] = useState(() => { try { return localStorage.getItem('studysync_ui_style') || 'nordic'; } catch { return 'nordic'; } });
  const [reduceMotion, setReduceMotion] = useState(() => { try { return localStorage.getItem('studysync_reduce_motion') === '1'; } catch { return false; } });

  useEffect(() => {
    if (!open) return;
    setDisplayName(user?.displayName || '');
    setBio(user?.bio || '');
    setAvatarUrl(user?.avatarUrl || '');
  }, [open, user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('studysync_token');
      const res = await fetch('/api/upload', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAvatarUrl(data.url);
    } catch (err) { alert("Upload failed: " + err.message); } finally { setUploading(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await api('/auth/profile', { method: 'PUT', body: { displayName, bio, avatarUrl } });
      setUser(updated);
      onClose();
    } catch (err) { alert("Failed to save: " + err.message); } finally { setSaving(false); }
  };

  const chooseTheme = (id) => { setTheme(id); document.documentElement.setAttribute('data-theme', id === 'nordic' ? '' : id); localStorage.setItem('studysync_theme_v2', id); };
  const chooseStyle = (id) => { setStyle(id); document.documentElement.setAttribute('data-style', id === 'nordic' ? '' : id); localStorage.setItem('studysync_ui_style', id); };
  const toggleMotion = (on) => { setReduceMotion(on); document.documentElement.classList.toggle('reduce-motion', on); localStorage.setItem('studysync_reduce_motion', on ? '1' : '0'); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden flex h-[600px] sm:flex-row flex-col border-border/50">
        
        {/* Sidebar */}
        <div className="w-full sm:w-56 bg-muted/30 p-4 border-b sm:border-b-0 sm:border-r border-border/50 flex flex-row sm:flex-col gap-1 shrink-0 overflow-x-auto">
          <button onClick={() => setTab('profile')} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left whitespace-nowrap", tab === 'profile' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50')}>
            <User className="h-4 w-4" /> My Profile
          </button>
          <button onClick={() => setTab('appearance')} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left whitespace-nowrap", tab === 'appearance' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50')}>
            <Palette className="h-4 w-4" /> Appearance
          </button>
          <button onClick={() => setTab('accessibility')} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left whitespace-nowrap", tab === 'accessibility' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50')}>
            <Accessibility className="h-4 w-4" /> Accessibility
          </button>
          <button onClick={() => setTab('credits')} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left whitespace-nowrap", tab === 'credits' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50')}>
            <ExternalLink className="h-4 w-4" /> Credits
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {tab === 'profile' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-xl font-bold">Your Profile</h3>
                <p className="text-sm text-muted-foreground mt-1">This is how others will see you in chat.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold overflow-hidden relative group shrink-0">
                  {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : user?.name?.charAt(0)}
                  {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-xs text-white">...</div>}
                </div>
                <div>
                  <input type="file" id="avatar-upload" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById('avatar-upload').click()}>
                    <Upload className="h-3.5 w-3.5 mr-1" /> Change Avatar
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Display Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Logan S." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About Me</label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people a bit about yourself..." rows={4} />
              </div>
              <Button variant="gradient" onClick={saveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-8">
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Layout Style</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {STYLES.map((s) => (
                    <button key={s.id} onClick={() => chooseStyle(s.id)} className={cn('group relative flex flex-col gap-3 rounded-lg border p-3 text-left transition-all', style === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40')}>
                      <div className="flex h-16 items-center justify-center rounded-md bg-muted/40">
                        <div className="rounded-md border bg-card px-3 py-2 shadow-sm" style={{ borderRadius: s.preview.radius }}>
                          <div className="text-sm" style={{ fontFamily: s.preview.heading, fontWeight: s.preview.headingWeight }}>Aa</div>
                        </div>
                      </div>
                      <p className="text-sm font-medium">{s.name}</p>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Color Theme</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => chooseTheme(t.id)} className={cn('group relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-all', theme === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/40')}>
                      <div className="flex gap-1.5">{t.swatches.map((c, i) => <span key={i} className="h-4 w-4 rounded-full ring-1 ring-black/5" style={{ background: c }} />)}</div>
                      <p className="text-sm font-medium">{t.name}</p>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {tab === 'accessibility' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Accessibility</h3>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Reduce motion</p>
                  <p className="text-xs text-muted-foreground">Disable animations across the site.</p>
                </div>
                <button role="switch" aria-checked={reduceMotion} onClick={() => toggleMotion(!reduceMotion)} className={cn('relative inline-flex h-6 w-11 items-center rounded-full transition-colors', reduceMotion ? 'bg-primary' : 'bg-muted')}>
                  <span className={cn('block h-5 w-5 rounded-full bg-background shadow transition-transform', reduceMotion ? 'translate-x-5' : 'translate-x-0')} />
                </button>
              </div>
            </div>
          )}

          {tab === 'credits' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">Credits</h3>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Built by</p>
                <a href="https://about.me/shifyee" target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-2 text-base font-semibold hover:text-primary">
                  shifyee <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                </a>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">StudySync is a collaborative study platform.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
