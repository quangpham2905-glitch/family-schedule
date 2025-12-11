import { v4 as uuidv4 } from 'uuid';
import { Member, FamilyEvent, SystemNotification, UserRole } from '../types';

// STORAGE KEYS
const KEYS = {
  MEMBERS: 'db_familyMembers',
  EVENTS: 'db_familyEvents',
  NOTIFICATIONS: 'db_systemNotifications'
};

// REAL-TIME CHANNEL
// BroadcastChannel allows communication between tabs/windows of the same origin
const dbChannel = new BroadcastChannel('family_schedule_db_channel');

// TYPES
type DBListener = () => void;
const listeners: Set<DBListener> = new Set();

// Listen for updates from other tabs
dbChannel.onmessage = (event) => {
  if (event.data === 'update') {
    notifyListeners();
  }
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};

// --- CRUD OPERATIONS ---

const getMembers = (): Member[] => {
  const data = localStorage.getItem(KEYS.MEMBERS);
  return data ? JSON.parse(data) : [];
};

const saveMembers = (members: Member[]) => {
  localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
  dbChannel.postMessage('update');
  notifyListeners();
};

const getEvents = (): FamilyEvent[] => {
  const data = localStorage.getItem(KEYS.EVENTS);
  return data ? JSON.parse(data) : [];
};

const saveEvents = (events: FamilyEvent[]) => {
  localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
  dbChannel.postMessage('update');
  notifyListeners();
};

const getNotifications = (): SystemNotification[] => {
  const data = localStorage.getItem(KEYS.NOTIFICATIONS);
  return data ? JSON.parse(data) : [];
};

const saveNotifications = (notifs: SystemNotification[]) => {
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  dbChannel.postMessage('update');
  notifyListeners();
};

// --- EXPORTED API ---

export const db = {
  // SUBSCRIPTION
  subscribe: (callback: DBListener) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  // MEMBERS
  members: {
    getAll: getMembers,
    add: (member: Member) => {
      const current = getMembers();
      const newMember = { ...member, createdAt: new Date().toISOString() };
      saveMembers([...current, newMember]);
      
      // Auto-log notification
      db.notifications.add({
        id: uuidv4(),
        message: `Thành viên mới ${newMember.name} đã được thêm vào hệ thống.`,
        type: 'info',
        isRead: false,
        timestamp: new Date().toISOString()
      });
    },
    update: (member: Member) => {
      const current = getMembers();
      saveMembers(current.map(m => m.id === member.id ? member : m));
    },
    getById: (id: string) => getMembers().find(m => m.id === id)
  },

  // EVENTS
  events: {
    getAll: getEvents,
    add: (event: FamilyEvent) => {
      const current = getEvents();
      const newEvent = { 
        ...event, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveEvents([...current, newEvent]);
      return newEvent;
    },
    addBatch: (events: FamilyEvent[], authorName: string) => {
      const current = getEvents();
      const newEvents = events.map(e => ({
        ...e,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      saveEvents([...current, ...newEvents]);

      // REAL-TIME ALERT FOR ADMIN
      db.notifications.add({
        id: uuidv4(),
        message: `${authorName} vừa cập nhật ${events.length} sự kiện mới vào lịch trình.`,
        type: 'success',
        isRead: false,
        timestamp: new Date().toISOString(),
        relatedMemberId: events[0]?.memberId
      });
    },
    update: (event: FamilyEvent) => {
      const current = getEvents();
      const updated = { ...event, updatedAt: new Date().toISOString() };
      saveEvents(current.map(e => e.id === event.id ? updated : e));
    },
    delete: (id: string, authorName: string) => {
      const current = getEvents();
      const eventToDelete = current.find(e => e.id === id);
      if (eventToDelete) {
        saveEvents(current.filter(e => e.id !== id));
        
        // Log deletion
        db.notifications.add({
          id: uuidv4(),
          message: `${authorName} đã xóa sự kiện "${eventToDelete.title}".`,
          type: 'warning',
          isRead: false,
          timestamp: new Date().toISOString()
        });
      }
    }
  },

  // NOTIFICATIONS
  notifications: {
    getAll: getNotifications,
    add: (notif: SystemNotification) => {
      const current = getNotifications();
      saveNotifications([notif, ...current]); // Newest first
    },
    markAllRead: () => {
      const current = getNotifications();
      saveNotifications(current.map(n => ({ ...n, isRead: true })));
    }
  },

  // SEED DATA (IF EMPTY)
  seed: (initialMembers: Member[]) => {
    if (getMembers().length === 0) {
      saveMembers(initialMembers);
    }
  }
};