import { useState, useEffect, type FormEvent } from 'react';
import { Users, BookOpen, Video, Bell, Radio, Edit2, Link as LinkIcon, Loader2, PlayCircle, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { formatDistanceToNow } from 'date-fns';

function getYouTubeVideoId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export function DashboardHome() {
  const { role, user } = useAppStore();
  const { materials, videos, notifications, liveClassLinks, loading, refetch } = useSupabaseQuery();
  
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    async function fetchStudents() {
      const { count } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');
      if (count !== null) setStudentCount(count);
    }
    fetchStudents();
  }, []);
  
  const [isEditingLiveClass, setIsEditingLiveClass] = useState(false);
  const [liveClassTitle, setLiveClassTitle] = useState('');
  const [liveClassUrl, setLiveClassUrl] = useState('');
  const [isSubmittingLiveClass, setIsSubmittingLiveClass] = useState(false);

  const currentLiveClass = liveClassLinks[0]; // get the most recent one

  const handleUpdateLiveClass = async (e: FormEvent) => {
    e.preventDefault();
    if (!liveClassTitle || !liveClassUrl) return;

    setIsSubmittingLiveClass(true);
    try {
      if (currentLiveClass) {
        await supabase.from('live_class_links').update({ title: liveClassTitle, url: liveClassUrl }).eq('id', currentLiveClass.id);
      } else {
        await supabase.from('live_class_links').insert([{ title: liveClassTitle, url: liveClassUrl }]);
      }
      setIsEditingLiveClass(false);
      refetch();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSubmittingLiveClass(false);
    }
  };

  const handleEndClass = async () => {
    if (currentLiveClass && window.confirm('Are you sure you want to end the current live class?')) {
      try {
        await supabase.from('live_class_links').delete().eq('id', currentLiveClass.id);
        setIsEditingLiveClass(false);
        setLiveClassTitle('');
        setLiveClassUrl('');
        refetch();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleEditClick = () => {
    if (currentLiveClass) {
      setLiveClassTitle(currentLiveClass.title);
      setLiveClassUrl(currentLiveClass.url);
    }
    setIsEditingLiveClass(true);
  };

  const stats = [
    { label: 'Total Materials', value: materials.length, icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Total Videos', value: videos.length, icon: Video, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Total Notifications', value: notifications.length, icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Students', value: studentCount, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {role === 'teacher' ? 'Teacher Dashboard' : 'Student Portal'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {role === 'teacher' 
            ? 'Manage your study materials, videos, and notifications.' 
            : 'Welcome back! Here are your latest updates and materials.'}
        </p>
      </div>

      {/* Live Class Tile */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-2xl p-6 shadow-lg relative overflow-hidden transition-all duration-300 ${
          currentLiveClass 
            ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 border-indigo-500/50 text-white' 
            : 'bg-muted/30 border-border'
        }`}
      >
        {/* Background animation for live class */}
        {currentLiveClass && !isEditingLiveClass && (
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none mix-blend-screen">
            <Radio className="w-64 h-64 animate-ping text-indigo-300" />
          </div>
        )}

        <div className="flex items-start justify-between relative z-10 w-full">
          <div className="flex gap-5 w-full">
            <div className={`p-4 rounded-2xl shrink-0 backdrop-blur-xl ${
              currentLiveClass 
                ? 'bg-white/20 text-indigo-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] border border-white/20' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Radio className={`w-8 h-8 ${currentLiveClass && !isEditingLiveClass ? 'animate-pulse text-indigo-300' : ''}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                <h2 className={`text-xl font-bold ${currentLiveClass ? 'text-white' : 'text-foreground'}`}>
                  Live Class
                </h2>
                {currentLiveClass && !isEditingLiveClass && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-indigo-500 text-white rounded-full shadow-lg border border-indigo-400/50 animate-pulse w-fit tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                    ON AIR
                  </span>
                )}
              </div>
              
              {isEditingLiveClass && role === 'teacher' ? (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleUpdateLiveClass} 
                  className="mt-5 space-y-4 max-w-xl"
                >
                  <div className="space-y-1.5">
                    <label className={`text-sm font-medium ${currentLiveClass ? 'text-indigo-100' : 'text-foreground'}`}>Class Title</label>
                    <input
                      type="text"
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow ${
                        currentLiveClass 
                          ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20' 
                          : 'bg-background border-border text-foreground focus:ring-primary/50'
                      }`}
                      placeholder="e.g., Physics Revision Chapter 3"
                      value={liveClassTitle}
                      onChange={(e) => setLiveClassTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-sm font-medium ${currentLiveClass ? 'text-indigo-100' : 'text-foreground'}`}>Meeting Link</label>
                    <input
                      type="url"
                      className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow ${
                        currentLiveClass 
                          ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20' 
                          : 'bg-background border-border text-foreground focus:ring-primary/50'
                      }`}
                      placeholder="https://meet.google.com/..."
                      value={liveClassUrl}
                      onChange={(e) => setLiveClassUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingLiveClass}
                      className={`flex-1 sm:flex-none min-w-[120px] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg ${
                        currentLiveClass 
                          ? 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20' 
                          : 'bg-primary hover:bg-primary/90'
                      }`}
                    >
                      {isSubmittingLiveClass && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Class
                    </button>
                    {currentLiveClass && (
                      <button
                        type="button"
                        onClick={handleEndClass}
                        className="flex-1 sm:flex-none min-w-[120px] bg-red-500/20 text-red-100 border border-red-500/30 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-colors backdrop-blur-md"
                      >
                        End Class
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingLiveClass(false)}
                      className={`flex-1 sm:flex-none min-w-[120px] px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        currentLiveClass
                          ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              ) : (
                <div className="mt-1">
                  {currentLiveClass ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                      <div>
                        <p className="text-xl font-semibold text-white mb-1 tracking-tight">
                          {currentLiveClass.title}
                        </p>
                        <p className="text-sm text-indigo-200 flex items-center gap-2">
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span className="opacity-90">{new URL(currentLiveClass.url).hostname}</span>
                        </p>
                      </div>
                      
                      <motion.a 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        href={currentLiveClass.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-indigo-500 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:bg-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all shrink-0 border border-indigo-400/30"
                      >
                        <PlayCircle className="w-5 h-5 group-hover:animate-pulse" />
                        Join Now
                      </motion.a>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-muted-foreground text-sm mb-4">
                        No ongoing live class right now. Please check back later.
                      </p>
                      {role === 'teacher' && (
                        <button
                          onClick={handleEditClick}
                          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
                        >
                          <Radio className="w-4 h-4" />
                          Start a Live Class
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {role === 'teacher' && !isEditingLiveClass && currentLiveClass && (
            <button 
              onClick={handleEditClick}
              className="p-2.5 text-indigo-200 hover:text-white bg-white/10 rounded-xl transition-all border border-white/10 hover:bg-white/20 hover:border-white/30 absolute right-0 top-0 backdrop-blur-md"
              title="Edit Live Class"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Latest Videos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Recent Videos</h2>
          <Link to="/videos" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-xl bg-card">
            <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No recent videos available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.slice(0, 3).map(video => {
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
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{video.title}</h3>
                    <div className="flex items-center justify-between mt-3">
                       <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-primary/10 text-primary rounded-md">{video.subject}</span>
                       <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        {/* Recent Notifications */}
        <div className="bg-card border border-border rounded-xl p-6 col-span-1 lg:col-span-1 shadow-sm flex flex-col h-[400px]">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {notifications.slice(0, 5).length === 0 ? (
               <p className="text-sm text-muted-foreground">No recent notifications.</p>
            ) : (
                notifications.slice(0, 5).map((notif) => (
                <div key={notif.id} className="p-3 bg-muted/50 rounded-lg border border-border/50">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Recent Uploads */}
         <div className="bg-card border border-border rounded-xl p-6 col-span-1 lg:col-span-2 shadow-sm flex flex-col h-[400px]">
          <h2 className="text-lg font-semibold mb-4">Recent Materials</h2>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
             {materials.slice(0, 5).length === 0 ? (
               <p className="text-sm text-muted-foreground">No recent materials.</p>
            ) : (
                materials.slice(0, 5).map((mat) => (
                <div key={mat.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-md">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-medium text-sm line-clamp-1">{mat.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{mat.subject}</p>
                        </div>
                    </div>
                     <a 
                      href={mat.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        View
                    </a>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
