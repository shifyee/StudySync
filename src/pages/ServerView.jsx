import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Send, Loader2, Plus, GraduationCap, BookOpen, X, Edit2, Trash2, Reply } from 'lucide-react';
import { api } from '@/lib/api.js';
import { getSocket } from '@/lib/socket.js';
import { useApp } from '@/lib/store.jsx';
import AttachmentModal from '@/components/AttachmentModal.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx';

export default function ServerView() {
  const { serverId, channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [server, setServer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [attachment, setAttachment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editModal, setEditModal] = useState({ open: false, id: null, content: '' });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  
  const scrollRef = useRef(null);

  useEffect(() => {
    api(`/servers/${serverId}`).then((data) => {
      setServer(data);
      if (!channelId && data.channels?.length > 0) {
        const firstText = data.channels.find(c => c.type === 'TEXT');
        if (firstText) navigate(`/server/${serverId}/${firstText.id}`, { replace: true });
      }
    }).catch(console.error);
  }, [serverId, channelId, navigate]);

  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const socket = getSocket();
    socket.emit('channel:join', { channelId });

    api(`/servers/channels/${channelId}/messages`)
      .then((history) => {
        setMessages(history);
        setLoading(false);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(console.error);

    const onMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const onMessageUpdated = (msg) => {
      setMessages((prev) => prev.map(m => m.id === msg.id ? { ...m, content: msg.content, updatedAt: msg.updatedAt } : m));
    };

    const onMessageDeleted = (id) => {
      setMessages((prev) => prev.filter(m => m.id !== id));
    };

    socket.on('message:new', onMessage);
    socket.on('message:updated', onMessageUpdated);
    socket.on('message:deleted', onMessageDeleted);

    return () => { 
      socket.off('message:new', onMessage); 
      socket.off('message:updated', onMessageUpdated);
      socket.off('message:deleted', onMessageDeleted);
    };
  }, [channelId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if ((!content.trim() && !attachment) || !channelId) return;
    
    const socket = getSocket();
    socket.emit('message:send', { 
      channelId, 
      content, 
      userId: user.id,
      attachmentId: attachment?.id,
      attachmentType: attachment?.type
    });
    
    setContent('');
    setAttachment(null);
  };

  const handleEdit = () => {
    if (!editModal.content.trim()) return;
    const socket = getSocket();
    socket.emit('message:edit', { messageId: editModal.id, content: editModal.content });
    setEditModal({ open: false, id: null, content: '' });
  };

  const handleDelete = () => {
    const socket = getSocket();
    socket.emit('message:delete', { messageId: deleteModal.id });
    setDeleteModal({ open: false, id: null });
  };

  const activeChannel = server?.channels.find(c => c.id === channelId);
  if (!server) return null;

  return (
    <div className="flex h-full bg-background relative">
      <div className="flex flex-1 flex-col min-w-0 border-r border-border/50">
        <div className="flex h-[60px] shrink-0 items-center border-b border-border/50 px-4 bg-card/30">
          <Hash className="h-5 w-5 text-muted-foreground mr-2" />
          <h2 className="text-base font-bold">{activeChannel?.name || 'Select a channel'}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Hash className="h-12 w-12 mb-2 opacity-20" />
              <p>Welcome to #{activeChannel?.name}!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.userId === user.id;
              return (
                <div key={msg.id} className="flex gap-3 group relative hover:bg-accent/30 p-2 -mx-2 rounded-md transition-colors">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {msg.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm hover:underline cursor-pointer">{msg.user?.name || 'User'}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.updatedAt && msg.updatedAt !== msg.createdAt && (
                        <span className="text-[10px] text-muted-foreground">(edited)</span>
                      )}
                    </div>
                    
                    {msg.content && <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{msg.content}</p>}

                    {msg.attachmentType === 'ASSIGNMENT' && msg.attachment && (
                      <div className="mt-2 rounded-lg border-l-4 border-l-primary bg-card border border-border/50 p-3 max-w-sm shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                          <GraduationCap className="h-3.5 w-3.5" /> SHARED ASSIGNMENT
                        </div>
                        <p className="font-semibold text-sm">{msg.attachment.title}</p>
                      </div>
                    )}

                    {msg.attachmentType === 'STUDYSET' && msg.attachment && (
                      <div className="mt-2 rounded-lg border-l-4 border-l-emerald-500 bg-card border border-border/50 p-3 max-w-sm shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 mb-1">
                          <BookOpen className="h-3.5 w-3.5" /> SHARED STUDY SET
                        </div>
                        <p className="font-semibold text-sm">{msg.attachment.title}</p>
                      </div>
                    )}
                  </div>

                  <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card border border-border/50 rounded-md shadow-sm">
                    <button onClick={() => { setContent(`@${msg.user.name} `); }} className="p-1.5 hover:bg-accent text-muted-foreground rounded-l-md" title="Reply">
                      <Reply className="h-3.5 w-3.5" />
                    </button>
                    {isMine && (
                      <>
                        <button onClick={() => setEditModal({ open: true, id: msg.id, content: msg.content })} className="p-1.5 hover:bg-accent text-muted-foreground" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteModal({ open: true, id: msg.id })} className="p-1.5 hover:bg-accent hover:text-destructive rounded-r-md" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} className="h-4" />
        </div>

        <div className="p-4 shrink-0">
          {attachment && (
            <div className="mb-2 flex items-center justify-between bg-card border border-border/50 p-2 rounded-lg text-sm">
              <div className="flex items-center gap-2 min-w-0">
                {attachment.type === 'ASSIGNMENT' ? <GraduationCap className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-emerald-500" />}
                <span className="truncate font-medium">{attachment.title}</span>
              </div>
              <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <form onSubmit={sendMessage} className="flex items-center gap-2 bg-accent/50 rounded-xl px-2 py-1 border border-border/50 focus-within:border-primary/50 focus-within:bg-accent transition-colors">
            <button type="button" onClick={() => setIsModalOpen(true)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors">
              <Plus className="h-5 w-5" />
            </button>
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Message #${activeChannel?.name || ''}`}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground h-10"
            />
            <button type="submit" disabled={!content.trim() && !attachment} className="p-2 text-primary disabled:text-muted-foreground hover:bg-primary/10 rounded-full transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex w-60 shrink-0 flex-col bg-card/30">
        <div className="flex h-[60px] items-center border-b border-border/50 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Members — {server.members?.length || 0}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {server.members?.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer">
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {member.user?.name?.charAt(0) || '?'}
                </div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{member.user?.name || 'User'}</p>
                {member.role === 'ADMIN' && <p className="text-[10px] text-primary">Admin</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AttachmentModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSelect={(item) => {
          setAttachment(item);
          setIsModalOpen(false);
        }}
      />

      <Dialog open={editModal.open} onOpenChange={(o) => !o && setEditModal({ open: false, id: null, content: '' })}>
        <DialogContent title="Edit Message">
          <Input 
            value={editModal.content} 
            onChange={(e) => setEditModal(prev => ({ ...prev, content: e.target.value }))}
            className="mt-2"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setEditModal({ open: false, id: null, content: '' })}>Cancel</Button>
            <Button variant="gradient" onClick={handleEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModal.open} onOpenChange={(o) => !o && setDeleteModal({ open: false, id: null })}>
        <DialogContent title="Delete Message" description="Are you sure you want to delete this message? This cannot be undone.">
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDeleteModal({ open: false, id: null })}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
