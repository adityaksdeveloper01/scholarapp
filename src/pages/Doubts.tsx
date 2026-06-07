import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { Doubt, AppUser } from '../types';
import { Loader2, MessageCircleQuestion, CheckCircle2, User, Clock, Trash2, Send, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function Doubts() {
  const { role, user } = useAppStore();
  const [doubts, setDoubts] = useState<(Doubt & { student?: AppUser, teacher?: AppUser })[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Teacher answer state
  const [answeringDoubtId, setAnsweringDoubtId] = useState<string | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDoubts();
  }, [user]);

  const fetchDoubts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('doubts')
        .select(`
          *,
          student:app_users!student_id(id, name, username),
          teacher:app_users!teacher_id(id, name, username)
        `)
        .order('created_at', { ascending: false });

      if (role === 'student') {
        query = query.eq('student_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setDoubts(data || []);
    } catch (error) {
      console.error('Error fetching doubts:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (doubtId: string) => {
    if (!answerContent.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('doubts').update({
        answer: answerContent,
        teacher_id: user.id,
        status: 'answered',
        updated_at: new Date().toISOString()
      }).eq('id', doubtId);

      if (error) throw error;
      
      setAnsweringDoubtId(null);
      setAnswerContent('');
      fetchDoubts();
    } catch (error) {
      console.error('Error answering doubt:', error);
      alert('Failed to submit answer. Please ensure the "doubts" table schema is correctly configured in Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete confirmation state
  const [doubtToDelete, setDoubtToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!doubtToDelete) return;
    try {
      const { error } = await supabase.from('doubts').delete().eq('id', doubtToDelete);
      if (error) throw error;
      setDoubts(doubts.filter(d => d.id !== doubtToDelete));
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDoubtToDelete(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDoubtToDelete(id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Q&A / Doubts</h1>
        <p className="text-muted-foreground mt-1">
          {role === 'teacher' ? 'Answer student questions and provide guidance.' : 'Your questions and teacher responses.'}
        </p>
      </div>

      {doubts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card">
          <MessageCircleQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="font-medium text-lg">No doubts found.</p>
          <p className="text-muted-foreground text-sm mt-1">
            {role === 'student' ? 'Use the floating button to ask a doubt anytime.' : "You're all caught up!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {doubts.map((doubt) => (
            <div key={doubt.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 flex gap-4">
                <div className="shrink-0 mt-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${doubt.status === 'answered' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-500' : 'bg-primary/10 text-primary'}`}>
                    {doubt.status === 'answered' ? <CheckCircle2 className="w-4 h-4" /> : <MessageCircleQuestion className="w-4 h-4" />}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 bg-muted rounded-md">{doubt.subject}</span>
                        {role === 'teacher' && doubt.student && (
                          <span className="text-sm font-medium flex items-center gap-1.5 opacity-80">
                            <User className="w-3.5 h-3.5" />
                            {doubt.student.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(doubt.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground text-sm font-medium mt-2 leading-relaxed">
                        {doubt.question}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {role === 'teacher' && doubt.status === 'pending' && answeringDoubtId !== doubt.id && (
                        <button 
                          onClick={() => setAnsweringDoubtId(doubt.id)}
                          className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                        >
                          Answer
                        </button>
                      )}
                      {(role === 'student' || role === 'teacher') && doubt.status === 'pending' && (
                        <button 
                          onClick={() => handleDeleteClick(doubt.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {doubt.status === 'answered' && doubt.answer && (
                <div className="bg-muted/30 px-5 py-4 border-t border-border flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-medium mb-1">
                       {doubt.teacher?.name || 'Teacher'} <span className="text-xs text-muted-foreground font-normal ml-2">{doubt.updated_at ? formatDistanceToNow(new Date(doubt.updated_at), { addSuffix: true }) : ''}</span>
                     </p>
                     <p className="text-sm text-foreground/90 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/50">
                       {doubt.answer}
                     </p>
                  </div>
                </div>
              )}

              {answeringDoubtId === doubt.id && (
                <div className="p-4 bg-muted/50 border-t border-border">
                  <textarea
                    autoFocus
                    rows={3}
                    placeholder="Type your answer here..."
                    className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3"
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setAnsweringDoubtId(null);
                        setAnswerContent('');
                      }}
                      className="px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => submitAnswer(doubt.id)}
                      disabled={isSubmitting || !answerContent.trim()}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Submit Answer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {doubtToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold">Delete Doubt?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this doubt? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
              <button
                onClick={() => setDoubtToDelete(null)}
                className="flex-1 bg-card border border-border text-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
