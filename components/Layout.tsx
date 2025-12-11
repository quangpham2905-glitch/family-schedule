import React, { useState } from 'react';
import { Member, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: Member | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'calendar', label: 'Lịch biểu', icon: 'fa-calendar-days' },
    { id: 'members', label: 'Thành viên', icon: 'fa-users' },
    { id: 'reports', label: 'Báo cáo', icon: 'fa-chart-pie' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <button 
          onClick={() => onTabChange('calendar')}
          className="p-6 flex items-center gap-3 w-full hover:bg-gray-50 transition-colors text-left outline-none focus:bg-gray-50"
          title="Về trang chủ"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
            <i className="fa-solid fa-house-chimney"></i>
          </div>
          <span className="text-xl font-bold text-gray-800">FamilyPlan</span>
        </button>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5`}></i>
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          {currentUser && (
            <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-xl">
               <div className={`w-10 h-10 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold`}>
                 {currentUser.name.charAt(0)}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                 <p className="text-xs text-gray-500">{currentUser.role === UserRole.PARENT ? 'Quản trị viên' : 'Thành viên'}</p>
               </div>
            </div>
          )}
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-20">
          <button 
            onClick={() => onTabChange('calendar')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <i className="fa-solid fa-house-chimney text-xs"></i>
            </div>
            <span className="font-bold text-gray-800">FamilyPlan</span>
          </button>
          <div className="flex items-center gap-3">
             {currentUser && (
               <div className={`w-8 h-8 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                 {currentUser.name.charAt(0)}
               </div>
             )}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
           <div className="absolute top-[60px] left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 md:hidden flex flex-col p-4 animate-fade-in">
             {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-2 ${
                    activeTab === item.id
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} w-5`}></i>
                  {item.label}
                </button>
              ))}
              <div className="border-t border-gray-100 my-2 pt-2">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <i className="fa-solid fa-right-from-bracket w-5"></i>
                  Đăng xuất
                </button>
              </div>
           </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;