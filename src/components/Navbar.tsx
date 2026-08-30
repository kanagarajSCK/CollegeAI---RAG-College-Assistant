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
        return 'College AI Assistant';
      case 'documents':
        return 'Documents & Knowledge Base';
      case 'settings':
        return 'Account Settings';
      default:
        return 'CollegeAI';
    }
  };

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 lg:hidden"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-1.5 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-gray-900">{getTitle()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

