import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from './components/Layout';
import EventItem from './components/EventItem';
import StatsDashboard from './components/StatsDashboard';
import SmartScheduleModal from './components/SmartScheduleModal';
import EditMemberModal from './components/EditMemberModal';
import LoginScreen from './components/LoginScreen';
import MandatoryOnboarding from './components/MandatoryOnboarding';
import { Member, FamilyEvent, EventType, CompletionStatus, UserRole, SystemNotification } from './types';
import { db } from './services/database';

// Mock Initial Data for Seeding
const INITIAL_MEMBERS: Member[] = [
  { id: '1', name: 'Bố', age: 35, avatarColor: 'bg-blue-500', role: UserRole.PARENT, password: '123' },
  { id: '2', name: 'Mẹ', age: 32, avatarColor: 'bg-rose-500', role: UserRole.PARENT, password: '123' },
  { id: '3', name: 'Phương Uyên', age: 10, avatarColor: 'bg-teal-500', role: UserRole.CHILD, password: '123' },
  { id: '4', name: 'Thu Trang', age: 6, avatarColor: 'bg-amber-500', role: UserRole.CHILD, password: '123' },
];

const App: React.FC = () => {
  // --- REAL-TIME DATA STATE ---
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  // --- UI STATE ---
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Form State for Manual Add
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<EventType>(EventType.STUDY);
  const [newEventMemberId, setNewEventMemberId] = useState<string>('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');

  // --- INITIALIZATION & SUBSCRIPTION ---
  useEffect(() => {
    // Seed data if empty
    db.seed(INITIAL_MEMBERS);

    // Initial Fetch
    const fetchData = () => {
      setMembers(db.members.getAll());
      setEvents(db.events.getAll());
      setNotifications(db.notifications.getAll());
    };

    fetchData();

    // Subscribe to Real-time Changes (from other tabs or this tab)
    const unsubscribe = db.subscribe(() => {
      console.log('Database update received!');
      fetchData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // --- NOTIFICATION PERMISSIONS ---
  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert("Trình duyệt của bạn không hỗ trợ thông báo.");
      return;
    }
    Notification.requestPermission().then(permission => {
      setPermissionStatus(permission);
      if (permission === 'granted') {
        new Notification("Thông báo đã được bật", {
          body: "Hệ thống sẽ cập nhật dữ liệu theo thời gian thực.",
          icon: '/vite.svg'
        });
      }
    });
  };

  // --- CLICK OUTSIDE HANDLER ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- BACKGROUND CHECKER FOR REMINDERS ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      // We read directly from state, if state is updated via DB sub, this loop sees fresh data
      
      const currentEvents = db.events.getAll(); // Ensure we check latest DB source
      let hasChanges = false;

      const updatedEvents = currentEvents.map(event => {
        if (event.status !== CompletionStatus.PENDING || event.notifiedCompletion) {
          return event;
        }

        const endTime = new Date(event.endTime);
        const timeDiff = now.getTime() - endTime.getTime();

        // Check if event ended within the last 30 minutes
        if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { 
            if (Notification.permission === 'granted') {
              new Notification("Nhắc nhở hoàn thành", {
                  body: `Sự kiện "${event.title}" đã kết thúc. Đừng quên đánh dấu hoàn thành nhé!`,
                  icon: '/vite.svg',
                  tag: event.id
              });
            }
            hasChanges = true;
            return { ...event, notifiedCompletion: true };
        }
        return event;
      });

      if (hasChanges) {
        updatedEvents.forEach(e => {
            if (e.notifiedCompletion && !currentEvents.find(ce => ce.id === e.id)?.notifiedCompletion) {
                db.events.update(e);
            }
        });
      }

    }, 60000); 

    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---

  const handleLogin = (member: Member) => {
    setCurrentUser(member);
  };

  const handleRegister = (newMember: Member) => {
    db.members.add(newMember);
    setCurrentUser(newMember); // Auto login
    // Notification is handled inside db.members.add
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('calendar');
  };

  // Permission helpers
  const canEditSchedule = true; 
  const canEditMembers = currentUser?.role === UserRole.PARENT;
  
  const canMarkComplete = (event: FamilyEvent) => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.PARENT) return true;
    return event.memberId === currentUser.id;
  };

  const toggleEventStatus = (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event || !canMarkComplete(event)) {
      alert("Bạn không có quyền thay đổi trạng thái sự kiện này.");
      return;
    }

    const nextStatus = event.status === CompletionStatus.COMPLETED 
      ? CompletionStatus.PENDING 
      : CompletionStatus.COMPLETED;
    
    db.events.update({ ...event, status: nextStatus });
    
    // Notify admin if completed
    if (nextStatus === CompletionStatus.COMPLETED) {
        db.notifications.add({
            id: uuidv4(),
            message: `${currentUser?.name} đã hoàn thành: ${event.title}`,
            type: 'success',
            isRead: false,
            timestamp: new Date().toISOString(),
            relatedMemberId: currentUser?.id
        });
    }
  };

  const deleteEvent = (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    
    if (currentUser?.role === UserRole.CHILD && event.memberId !== currentUser.id) {
       alert("Bạn chỉ có thể xóa lịch trình của mình.");
       return;
    }

    if (confirm('Bạn có chắc muốn xóa sự kiện này?')) {
      db.events.delete(id, currentUser?.name || 'Ai đó');
    }
  };

  const handleSaveMember = (id: string, name: string, age: number, avatarColor: string, password?: string, role?: UserRole) => {
    if (!canEditMembers) return;
    
    const existingMember = members.find(m => m.id === id);
    if (existingMember) {
        db.members.update({ ...existingMember, name, age, avatarColor, password, role: role || existingMember.role });
    } else {
        const newMember: Member = {
          id,
          name, 
          age, 
          avatarColor, 
          password, 
          role: role || UserRole.CHILD
        };
        db.members.add(newMember);
    }
    
    // Update local user state if needed
    if (currentUser && currentUser.id === id) {
       // Re-fetch ensures we have latest, but we might need to update auth state directly
       // However, since we listen to DB, 'members' state will update. 
       // We just need to ensure currentUser reflects that.
       const updated = { ...currentUser, name, age, avatarColor, password, role: role || currentUser.role };
       setCurrentUser(updated);
    }
  };

  const addSmartEvents = (newEvents: Partial<FamilyEvent>[]) => {
    const formattedEvents: FamilyEvent[] = newEvents.map(e => ({
      id: uuidv4(),
      memberId: e.memberId || (currentUser ? currentUser.id : members[0].id),
      title: e.title || 'Sự kiện mới',
      description: e.description || '',
      type: e.type || EventType.OTHER,
      startTime: e.startTime || new Date().toISOString(),
      endTime: e.endTime || new Date(new Date().getTime() + 3600000).toISOString(),
      isRecurring: false,
      status: CompletionStatus.PENDING,
      notifiedCompletion: false
    }));
    
    db.events.addBatch(formattedEvents, currentUser?.name || 'Người dùng');
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle || !newEventStart || !newEventEnd) return;

    const startDateTime = new Date(selectedDate);
    const [startH, startM] = newEventStart.split(':').map(Number);
    startDateTime.setHours(startH, startM, 0, 0);

    const endDateTime = new Date(selectedDate);
    const [endH, endM] = newEventEnd.split(':').map(Number);
    endDateTime.setHours(endH, endM, 0, 0);

    const newEvent: FamilyEvent = {
      id: uuidv4(),
      memberId: newEventMemberId || currentUser?.id || members[0].id,
      title: newEventTitle,
      type: newEventType,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      isRecurring: false,
      status: CompletionStatus.PENDING,
      description: 'Thêm thủ công',
      notifiedCompletion: false
    };

    db.events.addBatch([newEvent], currentUser?.name || 'Người dùng');
    setIsEventModalOpen(false);

    // Reset form
    setNewEventTitle('');
    setNewEventStart('');
    setNewEventEnd('');
  };

  const handleImportEvents = (importedEvents: FamilyEvent[]) => {
    db.events.addBatch(importedEvents, currentUser?.name || 'Người dùng');
  };

  // --- HELPERS ---
  const hasUserEvents = currentUser 
    ? events.some(e => e.memberId === currentUser.id)
    : true;

  const getEventsForDate = (date: Date) => {
    const dateEvents = events.filter(e => {
      const eDate = new Date(e.startTime);
      return eDate.getDate() === date.getDate() &&
             eDate.getMonth() === date.getMonth() &&
             eDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (currentUser?.role === UserRole.PARENT) return dateEvents;
    return dateEvents.filter(e => e.memberId === currentUser?.id);
  };

  const filteredEvents = getEventsForDate(selectedDate);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!currentUser) {
    return (
      <LoginScreen 
        members={members} // This now comes from DB state
        onLogin={handleLogin} 
        onRegister={handleRegister}
      />
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} currentUser={currentUser} onLogout={handleLogout}>
      
      <MandatoryOnboarding 
         currentUser={currentUser}
         hasEvents={hasUserEvents}
         onOpenAiModal={() => setIsSmartModalOpen(true)}
         onOpenManualModal={() => {
            setNewEventMemberId(currentUser.id);
            const now = new Date();
            const h = now.getHours().toString().padStart(2, '0');
            const m = now.getMinutes().toString().padStart(2, '0');
            setNewEventStart(`${h}:${m}`);
            const nextH = (now.getHours() + 1).toString().padStart(2, '0');
            setNewEventEnd(`${nextH}:${m}`);
            setIsEventModalOpen(true);
         }}
         onImportEvents={handleImportEvents}
      />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeTab === 'calendar' && 'Lịch Biểu Hôm Nay'}
            {activeTab === 'members' && 'Quản Lý Thành Viên'}
            {activeTab === 'reports' && 'Báo Cáo & Giám Sát'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
             {activeTab === 'calendar' && new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(selectedDate)}
             {activeTab === 'members' && `${members.length} thành viên trong gia đình`}
             {activeTab === 'reports' && 'Dữ liệu được cập nhật thời gian thực'}
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* Notification Bell */}
          <div className="relative" ref={notifDropdownRef}>
            <button 
              onClick={() => {
                setIsNotifDropdownOpen(!isNotifDropdownOpen);
                if (!isNotifDropdownOpen) db.notifications.markAllRead();
              }}
              className={`bg-white border text-gray-600 p-2.5 rounded-xl hover:bg-gray-50 transition-colors relative shadow-sm ${unreadCount > 0 ? 'border-indigo-200 text-indigo-600' : 'border-gray-200'}`}
              title="Thông báo hệ thống"
            >
               <i className={`fa-solid fa-bell ${unreadCount > 0 ? 'animate-swing' : ''}`}></i>
               {unreadCount > 0 && (
                 <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                   {unreadCount > 9 ? '9+' : unreadCount}
                 </span>
               )}
            </button>

            {/* Notification Dropdown */}
            {isNotifDropdownOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-fade-in origin-top-right">
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                   <span className="font-bold text-gray-700 text-sm">Cập nhật hệ thống</span>
                   <button onClick={() => db.notifications.markAllRead()} className="text-xs text-indigo-600 hover:underline">Đã xem hết</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                   {notifications.length === 0 ? (
                     <div className="p-8 text-center text-gray-400 text-sm">
                       <i className="fa-solid fa-bell-slash mb-2 text-2xl opacity-50"></i>
                       <p>Chưa có thông báo nào</p>
                     </div>
                   ) : (
                     notifications.map(notif => (
                       <div key={notif.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}>
                          <div className="flex gap-3">
                             <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                notif.type === 'success' ? 'bg-green-500' : notif.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                             }`} />
                             <div>
                                <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                  <i className="fa-regular fa-clock text-[9px]"></i>
                                  {new Date(notif.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
              </div>
            )}
          </div>

          {permissionStatus === 'default' && (
             <button 
                onClick={requestNotificationPermission}
                className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl hover:bg-indigo-200 transition-colors"
                title="Bật thông báo"
             >
                <i className="fa-solid fa-bell-ring"></i>
             </button>
          )}

          {activeTab === 'calendar' && canEditSchedule && (
            <>
              <button 
                onClick={() => setIsSmartModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-medium"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span className="hidden sm:inline">AI Tạo Lịch</span>
              </button>
              <button 
                onClick={() => {
                   setNewEventMemberId(currentUser.id);
                   setIsEventModalOpen(true);
                }}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <i className="fa-solid fa-plus"></i>
                <span className="hidden sm:inline">Thêm Mới</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="animate-fade-in">
          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-6">
             <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                <i className="fa-solid fa-chevron-left"></i>
             </button>
             <div className="flex items-center gap-2 font-semibold text-gray-800">
               <i className="fa-regular fa-calendar"></i>
               {selectedDate.toLocaleDateString('vi-VN')}
             </div>
             <button onClick={() => changeDate(1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600">
                <i className="fa-solid fa-chevron-right"></i>
             </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Events List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 mb-4">
                    <i className="fa-solid fa-mug-hot text-2xl"></i>
                  </div>
                  <h3 className="text-gray-900 font-semibold text-lg">
                    {currentUser.role === UserRole.PARENT ? "Chưa có lịch trình" : "Bạn không có lịch trình nào"}
                  </h3>
                  <p className="text-gray-500 max-w-xs mx-auto mt-2">
                    {currentUser.role === UserRole.PARENT ? "Hôm nay cả nhà rảnh rỗi. Hãy thêm sự kiện mới." : "Hãy thêm sự kiện để bắt đầu ngày mới!"}
                  </p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <EventItem 
                    key={event.id}
                    event={event}
                    member={members.find(m => m.id === event.memberId)}
                    onToggleStatus={toggleEventStatus}
                    onDelete={deleteEvent}
                  />
                ))
              )}
            </div>

            {/* Side Panel */}
            <div className="hidden lg:block space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                 <h3 className="font-bold text-gray-800 mb-4">Gia đình</h3>
                 <div className="space-y-3">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full ${m.avatarColor} flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm`}>
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.role === UserRole.PARENT ? 'Phụ huynh' : 'Con cái'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBERS TAB */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {members.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center relative group">
              <div className={`w-24 h-24 ${member.avatarColor} rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-md`}>
                {member.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              <p className="text-gray-500 mb-1">{member.age} tuổi</p>
              <span className={`text-xs px-2 py-1 rounded-full ${member.role === UserRole.PARENT ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'} mb-4`}>
                {member.role === UserRole.PARENT ? 'Quản trị viên' : 'Thành viên'}
              </span>
              
              {canEditMembers && (
                <button 
                  onClick={() => {
                    setEditingMember(member);
                    setIsMemberModalOpen(true);
                  }}
                  className="w-full py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          ))}
          {canEditMembers && (
            <button 
              className="h-full min-h-[250px] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition-all bg-gray-50/50"
              onClick={() => {
                setEditingMember(null); // Create Mode
                setIsMemberModalOpen(true);
              }}
            >
               <i className="fa-solid fa-plus text-3xl mb-2"></i>
               <span className="font-medium">Thêm thành viên</span>
            </button>
          )}
        </div>
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
        <StatsDashboard events={events} members={members} />
      )}

      {/* MODALS */}
      {canEditSchedule && (
        <SmartScheduleModal 
          isOpen={isSmartModalOpen} 
          onClose={() => setIsSmartModalOpen(false)}
          members={members}
          onAddEvents={addSmartEvents}
        />
      )}
      
      {canEditMembers && (
        <EditMemberModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          member={editingMember}
          onSave={handleSaveMember}
        />
      )}

      {/* Manual Add Modal */}
      {isEventModalOpen && canEditSchedule && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Thêm sự kiện mới</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleManualAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ví dụ: Học Toán"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thành viên</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                    value={newEventMemberId}
                    onChange={e => setNewEventMemberId(e.target.value)}
                    disabled={currentUser.role === UserRole.CHILD}
                  >
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                    value={newEventType}
                    onChange={e => setNewEventType(e.target.value as EventType)}
                  >
                    {Object.values(EventType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                  <input 
                    type="time" 
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                    value={newEventStart}
                    onChange={e => setNewEventStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                  <input 
                    type="time" 
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none"
                    value={newEventEnd}
                    onChange={e => setNewEventEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                 <button 
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                 >
                   Hủy
                 </button>
                 <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg shadow-md"
                 >
                   Lưu
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default App;