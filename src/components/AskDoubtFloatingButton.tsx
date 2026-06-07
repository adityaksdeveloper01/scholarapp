import { useState, type FormEvent } from 'react';
import { MessageCircleQuestion, X, Loader2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'motion/react';

export function AskDoubtFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { user } = useAppStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !question.trim() || !user) return;

    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      const { error } = await supabase.from('doubts').insert({
        student_id: user.id,
        subject: subject,
        question: question,
        status: 'pending'
      });

      if (error) throw error;
      
      setSuccess(true);
      setSubject('');
      setQuestion('');
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting doubt:', err);
      alert('Failed to ask doubt. If this persists, please contact admin to update the Supabase database with the "doubts" table schema.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-xl hover:bg-primary/90 transition-transform hover:scale-105 z-40 active:scale-95"
        title="Ask a Doubt"
      >
        <MessageCircleQuestion className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-24 right-6 w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Ask a Doubt</h3>
                  <p className="text-primary-foreground/80 text-xs">A teacher will respond shortly.</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400 rounded-full flex items-center justify-center mb-3">
                      <Send className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-lg text-foreground">Doubt Sent!</p>
                    <p className="text-sm text-muted-foreground mt-1">Check the Doubts tab for answers.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-foreground">Subject / Topic</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Physics, Math..."
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-foreground">Your Question</label>
                      <textarea 
                        required
                        rows={4}
                        placeholder="Describe what you need help with..."
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircleQuestion className="w-4 h-4" />}
                      Send Doubt
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
