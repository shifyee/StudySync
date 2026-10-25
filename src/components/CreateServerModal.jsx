import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { api } from '@/lib/api.js';
import { useApp } from '@/lib/store.jsx';

export default function CreateServerModal({ open, onClose, onCreated }) {
  const { toast } = useApp();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const newServer = await api('/servers', { method: 'POST', body: { name } });
      onCreated(newServer);
      onClose();
      setName('');
    } catch (err) {
      toast(err.message || 'Failed to create server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent 
        title="Create a Study Group" 
        description="Your server is where you and your classmates hang out. Make yours and start studying together."
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Server Name</label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AP Chemistry Study Group"
              className="mt-1.5"
              maxLength={50}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="gradient" disabled={!name.trim() || loading}>
              {loading ? 'Creating...' : 'Create Server'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
