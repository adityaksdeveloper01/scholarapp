import { useState, type FormEvent } from 'react';
import { BookOpen, FileDown, FileText, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { formatBytes } from '../lib/utils';
import { StudyMaterial } from '../types';

export function StudyMaterials() {
  const { role } = useAppStore();
  const { materials, loading, refetch } = useSupabaseQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const subjects = ['All', ...Array.from(new Set(materials.map(m => m.subject)))];

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || m.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !newTitle || !newSubject) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${newSubject}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('study-materials')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('study_materials').insert({
        title: newTitle,
        subject: newSubject,
        file_name: file.name,
        file_size: file.size,
        file_url: publicUrlData.publicUrl,
      });

      if (dbError) throw dbError;

      setShowUploadModal(false);
      setNewTitle('');
      setNewSubject('');
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      // Alerts are blocked in iframes
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (material: StudyMaterial) => {
    try {
      // Very basic path extraction from URL (might be brittle depending on exact structure but works for this simple MVP)
      const urlParts = material.file_url.split('/study-materials/');
      if (urlParts.length > 1) {
        const path = urlParts[1];
        const { error: storageError } = await supabase.storage.from('study-materials').remove([path]);
        if (storageError) console.error('Storage delete error:', storageError);
      }
      
      const { error: dbError } = await supabase.from('study_materials').delete().eq('id', material.id);
      if (dbError) throw dbError;
      refetch();
    } catch (error: any) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Materials</h1>
          <p className="text-muted-foreground mt-1">Browse and download educational resources.</p>
        </div>
        
        {role === 'teacher' && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            Upload Material
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search materials..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select 
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredMaterials.length === 0 ? (
         <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="font-medium text-lg">No materials found.</p>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map(mat => (
            <div key={mat.id} className="bg-card border border-border rounded-xl p-5 shadow-sm group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                {role === 'teacher' && (
                  <button onClick={() => handleDelete(mat)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <h3 className="font-semibold text-base line-clamp-1 mb-1">{mat.title}</h3>
              <p className="text-xs text-muted-foreground mb-4 inline-block px-2 py-1 bg-muted rounded-md">{mat.subject}</p>
              
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">{formatBytes(mat.file_size || 0)}</span>
                <a 
                  href={mat.file_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <FileDown className="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal (Very barebones logic) */}
      {showUploadModal && role === 'teacher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Upload New Material</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input required type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <input required type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-1">File</label>
                   <input required type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90" />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
                  <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                  <button type="submit" disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50">
                    {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Upload
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
