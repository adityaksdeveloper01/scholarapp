import { useState, useEffect, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { AppUser } from '../types';
import { Loader2, Plus, Edit2, Trash2, KeyRound, AlertCircle, Save, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { motion } from 'motion/react';

export function UsersManage() {
  const { user } = useAppStore();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'student'|'teacher'>('student');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    
    const subscription = supabase.channel('public:app_users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_users' }, fetchUsers)
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setUsers(data as AppUser[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setRole('student');
    setFormError('');
    setEditingUser(null);
  };

  const openModal = (userToEdit?: AppUser) => {
    resetForm();
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUsername(userToEdit.username);
      setPassword(userToEdit.password || '');
      setName(userToEdit.name);
      setRole(userToEdit.role);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingUser) {
        const { error } = await supabase
          .from('app_users')
          .update({ username: username.trim(), password: password.trim(), name: name.trim(), role })
          .eq('id', editingUser.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_users')
          .insert([{ username: username.trim(), password: password.trim(), name: name.trim(), role }]);
          
        if (error) throw error;
      }
      closeModal();
    } catch (err: any) {
      console.error('Error saving user:', err);
      setFormError(err.message || 'Error saving user');
    } finally {
      setFormLoading(false);
    }
  };

  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', userToDelete);
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting user:', err);
    } finally {
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setUserToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-muted-foreground mt-1 text-sm">Add or edit students and teachers.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Password</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((rowUser) => (
                <tr key={rowUser.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{rowUser.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{rowUser.username}</td>
                  <td className="px-6 py-4 text-muted-foreground font-mono bg-muted/20">{rowUser.password}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      rowUser.role === 'teacher' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {rowUser.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openModal(rowUser)}
                      className="text-muted-foreground hover:text-primary transition-colors p-1"
                      title="Edit user"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {rowUser.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteClick(rowUser.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No users found.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button onClick={closeModal} className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-500/10 text-red-600 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">User ID</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. student01"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. secret123"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'student'|'teacher')}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm flex justify-center items-center gap-2"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-card border border-border text-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-lg font-bold">Delete User?</h3>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-card border border-border text-foreground py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
