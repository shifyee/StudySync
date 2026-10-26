import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Hash, Volume2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api.js';
import { useApp } from '@/lib/store.jsx';

export default function ServerSettingsModal({ open, onClose, server, onRefresh }) {
  const { toast } = useApp();
  const [newChannel, setNewChannel] = useState('');
  const [channelType, setChannelType] = useState('TEXT');
  const [loading, setLoading] = useState(false);

  if (!server) return null;

  const createChannel = async (e) => {
    e.preventDefault();
    if (!newChannel.trim()) return;
    setLoading(true);
    try {
      await api(`/servers/${server.id}/channels`, { 
        method: 'POST', 
        body: { name: newChannel, type: channelType } 
      });
      setNewChannel('');
      onRefresh();
      toast('Channel created');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (channelId) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;
    try {
      await api(`/servers/${server.id}/channels/${channelId}`, { method: 'DELETE' });
      onRefresh();
      toast('Channel deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Server Settings" description={`Manage channels for ${server.name}`}>
        <div className="space-y-6 pt-4 max-h-[60vh] overflow-y-auto pr-2">
          
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Text Channels</h3>
            {server.channels.filter(c => c.type === 'TEXT').map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-accent/30 border border-border/50">
                <div className="flex items-center gap-2"><Hash className="h-4 w-4" /> {c.name}</div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteChannel(c.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-4">Voice Channels</h3>
            {server.channels.filter(c => c.type === 'VOICE').map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-accent/30 border border-border/50">
                <div className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> {c.name}</div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteChannel(c.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>

          <form onSubmit={createChannel} className="border-t border-border/50 pt-4 space-y-3">
            <h3 className="text-sm font-bold">Create Channel</h3>
            <div className="flex gap-2">
              <select 
                value={channelType} 
                onChange={(e) => setChannelType(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="TEXT">Text</option>
                <option value="VOICE">Voice</option>
              </select>
              <Input 
                value={newChannel} 
                onChange={(e) => setNewChannel(e.target.value)} 
                placeholder="new-channel" 
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !newChannel.trim()}>Create</Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
