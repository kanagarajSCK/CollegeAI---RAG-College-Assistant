import React from 'react';
import { Menu, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onOpenSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onOpenSidebar }) => {
  const { user } = useAuth();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'chat':
        return 'AI Assistant';
      case 'documents':
        return 'Documents';
      case 'settings':
        return 'Settings';
      default:
        return 'CollegeAI';
    }
  };

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 sm:px-4 bg-white/95 backdrop-blur-xs border-b border-gray-200 lg:hidden shrink-0"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-1 text-gray-700 hover:text-gray-900 active:bg-gray-100 rounded-lg transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-gray-900 truncate">{getTitle()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center shadow-2xs">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};


