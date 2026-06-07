import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StudyMaterial, YoutubeVideo, Notification, LiveClassLink } from '../types';

export function useSupabaseQuery() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [liveClassLinks, setLiveClassLinks] = useState<LiveClassLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    const [materialsRes, videosRes, notifRes, liveClassRes] = await Promise.all([
      supabase.from('study_materials').select('*').order('created_at', { ascending: false }),
      supabase.from('youtube_videos').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
      supabase.from('live_class_links').select('*').order('created_at', { ascending: false }),
    ]);

    if (materialsRes.data) setMaterials(materialsRes.data as StudyMaterial[]);
    if (videosRes.data) setVideos(videosRes.data as YoutubeVideo[]);
    if (notifRes.data) setNotifications(notifRes.data as Notification[]);
    if (liveClassRes.data) setLiveClassLinks(liveClassRes.data as LiveClassLink[]);
    
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    async function initialFetch() {
      setLoading(true);
      
      const [materialsRes, videosRes, notifRes, liveClassRes] = await Promise.all([
        supabase.from('study_materials').select('*').order('created_at', { ascending: false }),
        supabase.from('youtube_videos').select('*').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('live_class_links').select('*').order('created_at', { ascending: false }),
      ]);

      if (!mounted) return;

      if (materialsRes.data) setMaterials(materialsRes.data as StudyMaterial[]);
      if (videosRes.data) setVideos(videosRes.data as YoutubeVideo[]);
      if (notifRes.data) setNotifications(notifRes.data as Notification[]);
      if (liveClassRes.data) setLiveClassLinks(liveClassRes.data as LiveClassLink[]);
      
      setLoading(false);
    }

    initialFetch();

    // Set up realtime subscriptions
    const materialsSubscription = supabase.channel('public:study_materials')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_materials' }, () => {
        // Simple strategy: refetch on any change to ensure consistency and ordering
        supabase.from('study_materials').select('*').order('created_at', { ascending: false })
          .then(res => { if (res.data) setMaterials(res.data as StudyMaterial[]); });
      }).subscribe();

    const videosSubscription = supabase.channel('public:youtube_videos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'youtube_videos' }, () => {
         supabase.from('youtube_videos').select('*').order('created_at', { ascending: false })
          .then(res => { if (res.data) setVideos(res.data as YoutubeVideo[]); });
      }).subscribe();

    const notifSubscription = supabase.channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
         supabase.from('notifications').select('*').order('created_at', { ascending: false })
          .then(res => { if (res.data) setNotifications(res.data as Notification[]); });
      }).subscribe();

    const liveClassSubscription = supabase.channel('public:live_class_links')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_class_links' }, () => {
         supabase.from('live_class_links').select('*').order('created_at', { ascending: false })
          .then(res => { if (res.data) setLiveClassLinks(res.data as LiveClassLink[]); });
      }).subscribe();

    return () => {
      mounted = false;
      materialsSubscription.unsubscribe();
      videosSubscription.unsubscribe();
      notifSubscription.unsubscribe();
      liveClassSubscription.unsubscribe();
    };
  }, []);

  return { materials, videos, notifications, liveClassLinks, loading, refetch: fetchData };
}
