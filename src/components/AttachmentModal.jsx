import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { BookOpen, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api.js';

export default function AttachmentModal({ open, onClose, onSelect }) {
  const [tab, setTab] = useState('ASSIGNMENT');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const endpoint = tab === 'ASSIGNMENT' ? '/assignments' : '/sets';
    api(endpoint)
      .then(data => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, tab]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Share to Chat" description="Select an assignment or study set to share with the group.">
        
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
          <button 
            onClick={() => setTab('ASSIGNMENT')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'ASSIGNMENT' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <GraduationCap className="h-4 w-4" /> Assignments
          </button>
          <button 
            onClick={() => setTab('STUDYSET')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'STUDYSET' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}
          >
            <BookOpen className="h-4 w-4" /> Study Sets
          </button>
        </div>

        <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-4">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">Nothing to share yet.</p>
          ) : (
            items.map(item => (
              <button
                key={item.id}
                onClick={() => onSelect({ id: item.id, type: tab, title: item.title, meta: tab === 'ASSIGNMENT' ? item.dueDate : `${item._count?.cards || 0} cards` })}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tab === 'ASSIGNMENT' ? new Date(item.dueDate).toLocaleDateString() : `${item._count?.cards || 0} flashcards`}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
