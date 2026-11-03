import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Download, Loader2, ArrowLeft, Layers, AlertCircle, Edit3, Save, Play, Plus, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { api } from '@/lib/api.js';
import { useApp } from '@/lib/store.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import Logo from '@/components/Logo.jsx';
import CollabEditor from '@/components/CollabEditor.jsx';

export default function SharedSet() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, toast } = useApp();
  
  const [setData, setSetData] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  // Study Mode State
  const [studyMode, setStudyMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Add Card State
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api(`/share/${token}`)
      .then((data) => {
        setSetData(data);
        setCards(data.cards || []);
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
      toast(res.copied ? 'Set saved to your library!' : 'Already in your library', 'success');
      navigate(`/notes/${res.set.id}`);
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

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;
    setAddingCard(true);
    try {
      const card = await api(`/share/${token}/cards`, {
        method: 'POST',
        body: { front: newFront, back: newBack }
      });
      setCards([...cards, card]);
      setNewFront('');
      setNewBack('');
      toast('Card added!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAddingCard(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((i) => (i + 1) % cards.length), 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((i) => (i - 1 + cards.length) % cards.length), 150);
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
        <Logo size="lg" className="mb-6" />
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 max-w-md w-full flex flex-col items-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
          <h1 className="text-xl font-bold mb-2">Set Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <Link to="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to StudySync</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo size="sm" compact />
            <span className="font-bold text-lg hidden sm:block">StudySync</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block mr-2">
              Shared by {setData.author}
            </span>
            <Button 
              variant={studyMode ? "secondary" : "outline"} 
              onClick={() => setStudyMode(!studyMode)}
            >
              <Play className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">{studyMode ? 'Exit Study Mode' : 'Study Mode'}</span>
            </Button>
            <Button 
              variant={isEditing ? "outline" : "secondary"} 
              onClick={() => setIsEditing(!isEditing)}
              className="hidden sm:flex"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancel Editing' : 'Edit together'}
            </Button>
            <Button variant="gradient" onClick={handleSaveToLibrary} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin sm:mr-2" /> : <Download className="h-4 w-4 sm:mr-2" />}
              <span className="hidden sm:inline">Save to my sets</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Title Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            {setData.title}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {cards.length} flashcards
          </p>
        </div>

        {/* Study Mode */}
        {studyMode ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {cards.length > 0 ? (
              <>
                <div 
                  className="perspective-1000 w-full max-w-2xl h-80 cursor-pointer"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <div className={`relative w-full h-full preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center bg-card hover:bg-accent/10">
                      <span className="absolute top-4 left-4 text-xs font-bold text-muted-foreground uppercase">Front</span>
                      <h2 className="text-2xl font-medium">{cards[currentIndex]?.front}</h2>
                      <span className="absolute bottom-4 text-xs text-muted-foreground">Click to flip</span>
                    </Card>
                    {/* Back */}
                    <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-center bg-primary/5 border-primary/20">
                      <span className="absolute top-4 left-4 text-xs font-bold text-primary uppercase">Back</span>
                      <h2 className="text-xl text-foreground/90">{cards[currentIndex]?.back}</h2>
                    </Card>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Button variant="outline" size="icon" onClick={prevCard} className="h-12 w-12 rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    {currentIndex + 1} / {cards.length}
                  </span>
                  <Button variant="outline" size="icon" onClick={nextCard} className="h-12 w-12 rounded-full">
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCurrentIndex(0)}>
                  <RotateCcw className="h-3.5 w-3.5 mr-2" /> Restart
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No flashcards to study yet.</p>
            )}
          </div>
        ) : (
          <>
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

            {/* Flashcards Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Flashcards</h2>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                {cards.map((card, i) => (
                  <Card key={i} className="bg-card transition-colors hover:border-primary/30">
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

            {/* Add Card Form */}
            <Card className="border-dashed bg-transparent shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add a Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCard} className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    placeholder="Front (term)" 
                    value={newFront} 
                    onChange={(e) => setNewFront(e.target.value)} 
                    className="flex-1 bg-background"
                  />
                  <Input 
                    placeholder="Back (definition)" 
                    value={newBack} 
                    onChange={(e) => setNewBack(e.target.value)} 
                    className="flex-1 bg-background"
                  />
                  <Button type="submit" disabled={addingCard || !newFront.trim() || !newBack.trim()}>
                    {addingCard ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
