import { BookOpen, Home, Bell, PlaySquare, LayoutDashboard, Users, LogOut, MessageCircleQuestion } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Navbar } from './Navbar';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AskDoubtFloatingButton } from './AskDoubtFloatingButton';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, user, logout } = useAppStore();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', to: '/', icon: Home },
    ...(role === 'teacher' ? [{ name: 'Manage Users', to: '/users', icon: Users }] : []),
    { name: 'Study Materials', to: '/materials', icon: BookOpen },
    { name: 'Video Library', to: '/videos', icon: PlaySquare },
    { name: 'Notifications', to: '/notifications', icon: Bell },
    { name: 'Doubts', to: '/doubts', icon: MessageCircleQuestion },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-border text-primary gap-3">
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-xl font-bold tracking-tight">StudyDB</span>
        </div>

        <div className="px-4 py-6 flex-1 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </div>
        
        <div className="p-4 border-t border-border mt-auto">
           <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-xl mb-3">
             <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">{role === 'teacher' ? 'Teacher' : 'Student'}</div>
             <div className="text-sm font-semibold text-foreground">{user?.name}</div>
             <div className="text-xs text-muted-foreground mt-1">@{user?.username}</div>
           </div>
           <button 
             onClick={() => {
               closeSidebar();
               navigate('/', { replace: true });
               logout();
             }}
             className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-500 dark:hover:bg-red-500/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
           >
             <LogOut className="w-4 h-4" />
             Sign Out
           </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background relative">
          <Outlet />
        </main>
        {role === 'student' && <AskDoubtFloatingButton />}
      </div>
    </div>
  );
}
