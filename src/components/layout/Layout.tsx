import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../services/auth.service';
import { useIsAdmin } from '../../hooks/useAdmin';
import NotificationBell from '../notifications/NotificationBell';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/canvas', label: 'Career Canvas', icon: Target },
  { path: '/plan', label: '90-Day Plan', icon: FileText },
  { path: '/resume', label: 'Resume Analysis', icon: FileText },
  { path: '/jobs', label: 'Job Board', icon: Briefcase },
  { path: '/crm', label: 'Job Hunt CRM', icon: Building2 },
  { path: '/interviews', label: 'Interviews', icon: Calendar },
  { path: '/mentors', label: 'Mentors', icon: Users },
];

export default function Layout() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    const name = user?.user_metadata?.full_name || user?.email || '';
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    return name
      .split(' ')
      .map((n: string) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-elevated transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-button">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold text-gray-900">
              Career Playbook
            </span>
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
        <div className="p-3 border-t border-gray-100">
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
                  <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-button ring-2 ring-white">
                    <span className="text-sm font-semibold text-white">
                      {getUserInitials()}
                    </span>
                  </div>
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
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
