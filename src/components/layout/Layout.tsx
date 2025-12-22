import { useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  Target,
  Briefcase,
  Building2,
  Calendar,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  Camera,
  GitCompare,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/auth.service';
import { useIsAdmin } from '../../hooks/useAdmin';
import { useProfile } from '../../hooks/useProfile';
import { uploadAvatar } from '../../services/avatar.service';
import NotificationBell from '../notifications/NotificationBell';
import Avatar from '../shared/Avatar';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/canvas', label: 'Career Goal', icon: Target },
  { path: '/plan', label: '12 Weeks Plan', icon: FileText },
  { path: '/resume-builder', label: 'Resume Builder', icon: FilePlus },
  { path: '/resume', label: 'Resume Analysis', icon: FileText },
  { path: '/resume-analysis', label: 'Resume vs JD', icon: GitCompare },
  { path: '/jobs', label: 'Job Board', icon: Briefcase },
  { path: '/crm', label: 'Job Hunt CRM', icon: Building2 },
  { path: '/interviews', label: 'Interviews', icon: Calendar },
  { path: '/mentoring', label: 'Mentoring', icon: Users },
  { path: '/sessions', label: 'Sessions', icon: Calendar },
];

export default function Layout() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { profile, updateProfile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const newUrl = await uploadAvatar(user.id, file);
      await updateProfile({ avatar_url: newUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
      setUserMenuOpen(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-elevated transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 shrink-0">
          <NavLink to="/dashboard" className="flex items-center">
            <img
              src="/images/logo.svg"
              alt="Career Playbook"
              className="h-8"
            />
          </NavLink>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-smooth"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-button'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}

          {/* Admin link - only visible to admins */}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
                  isActive
                    ? 'bg-warning-500 text-white shadow-button'
                    : 'text-warning-600 hover:bg-warning-50'
                }`
              }
            >
              <Shield className="w-5 h-5" />
              Admin
            </NavLink>
          )}
        </nav>

        {/* Settings at bottom */}
        <div className="p-3 border-t border-gray-100 shrink-0">
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-smooth ${
                isActive
                  ? 'bg-primary-500 text-white shadow-button'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md shadow-card">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-smooth"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Spacer for desktop */}
            <div className="hidden lg:block" />

            {/* Right side - notifications and user */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              {user && <NotificationBell userId={user.id} />}

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-smooth"
                >
                  <Avatar
                    src={profile?.avatar_url}
                    name={user?.user_metadata?.full_name || user?.email}
                    size="md"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                      {user?.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </button>

                {/* Dropdown menu */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.user_metadata?.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-smooth disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                        {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                      </button>
                      <NavLink
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-smooth"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </NavLink>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 transition-smooth"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                      {/* Hidden file input for avatar upload */}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="pb-16">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-100 py-3 px-4">
          <p className="text-xs text-gray-500 text-center">
            © 2025 Ragid Kader. Creator of Smart Career Planner | Beyond Your Career. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
