import { useState, type FormEvent } from 'react';
import { Loader2, Plus, Search, Trash2, Video as VideoIcon } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { YoutubeVideo } from '../types';
import { formatDistanceToNow } from 'date-fns';

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function VideoLibrary() {
  const { role } = useAppStore();
  const { videos, loading, refetch } = useSupabaseQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  
  // Modal State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const subjects = ['All', ...Array.from(new Set(videos.map(v => v.subject)))].sort();

  const filteredVideos = videos.filter(v => 
    (filterSubject === 'All' || v.subject === filterSubject) &&
    (v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     v.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSubject || !newUrl) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('youtube_videos').insert({
        title: newTitle,
        subject: newSubject,
        youtube_url: newUrl,
      });

      if (error) throw error;

      setShowAddModal(false);
      setNewTitle('');
      setNewSubject('');
      setNewUrl('');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (video: YoutubeVideo) => {
    try {
      const { error } = await supabase.from('youtube_videos').delete().eq('id', video.id);
      if (error) throw error;
      refetch();
    } catch (error: any) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Video Library</h1>
          <p className="text-muted-foreground mt-1">Watch and learn from curated video lectures.</p>
        </div>
        
        {role === 'teacher' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Add Video
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search videos by title or subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select 
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 sm:w-48 appearance-none"
        >
          {subjects.map(subject => (
            <option key={subject} value={subject}>{subject}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card">
            <VideoIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="font-medium text-lg">No videos found.</p>
            <p className="text-muted-foreground text-sm mt-1">We couldn't find any videos matching your search.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVideos.map(video => {
            const videoId = getYouTubeVideoId(video.youtube_url);
            return (
            <div key={video.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm group">
              <div className="aspect-video relative bg-muted">
                {videoId ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${videoId}`} 
                    title={video.title}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="absolute inset-0"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Invalid Video URL</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-base line-clamp-2 leading-snug">{video.title}</h3>
                  {role === 'teacher' && (
                    <button onClick={() => handleDelete(video)} className="text-muted-foreground hover:text-destructive flex-shrink-0 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                   <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">{video.subject}</span>
                   <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                   </span>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && role === 'teacher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Add YouTube Video</h2>
              <form onSubmit={handleAddVideo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input required type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">YouTube URL</label>
                   <input required type="url" placeholder="https://youtube.com/watch?v=..." value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Add Video
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
