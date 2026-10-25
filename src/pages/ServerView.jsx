import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Hash, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api.js';
import { getSocket } from '@/lib/socket.js';
import { useApp } from '@/lib/store.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';

export default function ServerView() {
  const { serverId, channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useApp();
  
  const [server, setServer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // 1. Fetch Server Details & Channels
  useEffect(() => {
    api(`/servers/${serverId}`).then((data) => {
      setServer(data);
      // If no channel is selected in URL, auto-redirect to the first text channel
      if (!channelId && data.channels?.length > 0) {
        const firstText = data.channels.find(c => c.type === 'TEXT');
        if (firstText) navigate(`/server/${serverId}/${firstText.id}`, { replace: true });
      }
    }).catch(console.error);
  }, [serverId, channelId, navigate]);

  // 2. Fetch Messages & Join Socket Room
  useEffect(() => {
    if (!channelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const socket = getSocket();
    
    // Join the socket channel
    socket.emit('channel:join', { channelId });

    // Fetch history
    api(`/servers/channels/${channelId}/messages`)
      .then((history) => {
        setMessages(history);
        setLoading(false);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(console.error);

    // Listen for new messages
    const onMessage = (msg) => {
      setMessages((prev) => {
        // Prevent duplicate keys if message comes from our own send
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    socket.on('message:new', onMessage);

    return () => {
      socket.off('message:new', onMessage);
    };
  }, [channelId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!content.trim() || !channelId) return;
    
    const socket = getSocket();
    socket.emit('message:send', {
      channelId,
      content,
      userId: user.id
    });
    setContent('');
  };

  const activeChannel = server?.channels.find(c => c.id === channelId);

  if (!server) return null;

  // Render the chat or a blank state
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Channel Header */}
      <div className="flex h-[60px] shrink-0 items-center border-b border-border/50 px-4 bg-card/30">
        <Hash className="h-5 w-5 text-muted-foreground mr-2" />
        <h2 className="text-base font-bold">{activeChannel?.name || 'Select a channel'}</h2>
      </div>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
            <Hash className="h-12 w-12 mb-2 opacity-20" />
            <p>Welcome to #{activeChannel?.name}!</p>
            <p className="text-sm">This is the start of the channel.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 group hover:bg-accent/30 p-2 -mx-2 rounded-md transition-colors">
              <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {msg.user?.name?.charAt(0) || '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm hover:underline cursor-pointer">{msg.user?.name || 'User'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} className="h-4" />
      </div>

      {/* Message Input */}
      <div className="p-4 shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-2 bg-accent/50 rounded-xl px-3 py-1 border border-border/50 focus-within:border-primary/50 focus-within:bg-accent transition-colors">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Message #${activeChannel?.name || ''}`}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground h-10"
          />
          {/* FIXED: Changed </Button> to </button> */}
          <button type="submit" disabled={!content.trim()} className="p-2 text-primary disabled:text-muted-foreground hover:bg-primary/10 rounded-full transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
