import { useState, type FormEvent } from 'react';
import { BellRing, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { Notification } from '../types';
import { formatDistanceToNow } from 'date-fns';

export function Notifications() {
  const { role } = useAppStore();
  const { notifications, loading, refetch } = useSupabaseQuery();
  
  // Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMessage) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        title: newTitle,
        message: newMessage,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewTitle('');
      setNewMessage('');
    } catch (error) {
       console.error('Save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (notification: Notification) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notification.id);
      if (error) throw error;
      refetch();
    } catch (error: any) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">Important announcements and updates.</p>
        </div>
        
        {role === 'teacher' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Create Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card">
            <BellRing className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="font-medium text-lg">No notifications yet.</p>
            <p className="text-muted-foreground text-sm mt-1">Check back later for updates.</p>
         </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline connecting line */}
          <div className="absolute left-6 top-4 bottom-4 w-px bg-border hidden md:block"></div>
          
          <div className="space-y-6 md:space-y-8">
            {notifications.map((notif) => (
              <div key={notif.id} className="relative flex items-start gap-4 md:gap-6 group">
                <div className="hidden md:flex relative z-10 w-12 h-12 bg-card rounded-full border-4 border-background items-center justify-center -ml-6 shadow-sm">
                   <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                </div>
                
                <div className="flex-1 bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{notif.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
                        Admin
                      </p>
                    </div>
                    {role === 'teacher' && (
                      <button onClick={() => handleDelete(notif)} className="text-muted-foreground hover:text-destructive shrink-0 p-1 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {notif.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && role === 'teacher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea required rows={4} value={newMessage} onChange={e => setNewMessage(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent resize-none"></textarea>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Post Announcement
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
