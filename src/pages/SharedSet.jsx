import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Download, Loader2, ArrowLeft, Layers, AlertCircle, Edit3, Save } from 'lucide-react';
import { api } from '@/lib/api.js';
import { useApp } from '@/lib/store.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import Logo from '@/components/Logo.jsx';
import CollabEditor from '@/components/CollabEditor.jsx';

export default function SharedSet() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, toast } = useApp();
  
  const [setData, setSetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Edit Together State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api(`/share/${token}`)
      .then((data) => {
        setSetData(data);
        setEditedContent(data.content || '');
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'This shared set does not exist or has expired.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSaveToLibrary = async () => {
    if (!user) {
      toast('Please log in to save this set.', 'warn');
      navigate('/login');
      return;
    }
    
    setSaving(true);
    try {
      const res = await api(`/share/${token}/save`, { method: 'POST' });
      if (res.copied) {
        toast('Set saved to your library!', 'success');
        navigate(`/notes/${res.set.id}`);
      } else {
        toast(res.message || 'Already in your library', 'info');
        navigate(`/notes/${res.set.id}`);
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdits = async () => {
    setSaving(true);
    try {
      await api(`/share/${token}/content`, { 
        method: 'PUT', 
        body: { content: editedContent } 
      });
      setSetData(prev => ({ ...prev, content: editedContent }));
      setIsEditing(false);
      toast('Changes saved successfully', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="mb-6 flex items-center gap-2">
          <Logo size="lg" />
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 max-w-md w-full flex flex-col items-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
          <h1 className="text-xl font-bold text-foreground mb-2">Set Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error}
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to StudySync
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size="sm" compact />
            <span className="font-bold text-lg hidden sm:block">StudySync</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Shared by {setData.author}
            </span>
            <Button 
              variant={isEditing ? "outline" : "secondary"} 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel Editing' : 'Edit together'}
            </Button>
            <Button variant="gradient" onClick={handleSaveToLibrary} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Save to my sets
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            {setData.title}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {setData.cards?.length || 0} flashcards
          </p>
        </div>

        {/* Notes Content */}
        <Card>
          <CardContent className="p-6">
            {isEditing ? (
              <div className="space-y-4">
                <CollabEditor 
                  setId={setData.id} 
                  initialContent={setData.content} 
                  onContentChange={setEditedContent} 
                />
                <div className="flex justify-end pt-2">
                  <Button variant="gradient" onClick={handleSaveEdits} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="prose-editor max-w-none text-sm text-foreground/90"
                dangerouslySetInnerHTML={{ __html: setData.content }} 
              />
            )}
          </CardContent>
        </Card>

        {/* Flashcards */}
        {setData.cards?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Flashcards</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {setData.cards.map((card, i) => (
                <Card key={i} className="bg-card">
                  <CardContent className="p-4 flex flex-col gap-3 h-full justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Front</p>
                      <p className="text-sm font-medium">{card.front}</p>
                    </div>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Back</p>
                      <p className="text-sm text-muted-foreground">{card.back}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
