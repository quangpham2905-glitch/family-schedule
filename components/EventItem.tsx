import React from 'react';
import { FamilyEvent, Member, CompletionStatus, EventType } from '../types';

interface EventItemProps {
  event: FamilyEvent;
  member: Member | undefined;
  onToggleStatus: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

const typeColors: Record<EventType, string> = {
  [EventType.STUDY]: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100',
  [EventType.EXTRA_CURRICULAR]: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-100',
  [EventType.MEDICINE]: 'bg-red-50 text-red-700 border-red-200 ring-red-100',
  [EventType.ACTIVITY]: 'bg-green-50 text-green-700 border-green-200 ring-green-100',
  [EventType.OTHER]: 'bg-gray-50 text-gray-700 border-gray-200 ring-gray-100',
};

const typeIcons: Record<EventType, string> = {
  [EventType.STUDY]: 'fa-book-open',
  [EventType.EXTRA_CURRICULAR]: 'fa-chalkboard-user',
  [EventType.MEDICINE]: 'fa-pills',
  [EventType.ACTIVITY]: 'fa-futbol',
  [EventType.OTHER]: 'fa-list-check',
};

const EventItem: React.FC<EventItemProps> = ({ event, member, onToggleStatus, onDelete }) => {
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  
  const startTime = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  // Calculate duration
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.round(((diffMs % 3600000) / 60000));
  const durationStr = diffHrs > 0 ? `${diffHrs}h${diffMins > 0 ? ` ${diffMins}p` : ''}` : `${diffMins}p`;

  const isCompleted = event.status === CompletionStatus.COMPLETED;
  
  // Check if overdue
  const now = new Date();
  const isOverdue = !isCompleted && event.status !== CompletionStatus.MISSED && now > endDate;

  return (
    <div className={`relative group flex flex-col sm:flex-row items-start sm:items-stretch gap-4 p-4 rounded-2xl border transition-all duration-200 ${isCompleted ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-white border-gray-200 shadow-sm hover:shadow-md'}`}>
      
      {/* Left Column: Time & Status */}
      <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-3 min-w-[90px] sm:border-r sm:border-gray-100 sm:pr-4 w-full sm:w-auto border-b border-gray-100 sm:border-b-0 pb-3 sm:pb-0">
          <div className="text-left sm:text-left flex items-baseline sm:block gap-2">
            <span className={`block text-lg font-bold leading-none ${isOverdue ? 'text-red-500' : 'text-gray-900'}`}>{startTime}</span>
            <span className="text-xs text-gray-400 font-medium block mt-1">{durationStr}</span>
          </div>

          <button 
            onClick={() => onToggleStatus(event.id)}
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ml-auto sm:ml-0 ${
              isCompleted 
                ? 'bg-green-500 border-green-500 text-white' 
                : isOverdue 
                  ? 'border-red-300 hover:border-red-500 text-red-500'
                  : 'border-gray-300 hover:border-indigo-400 text-transparent hover:text-indigo-300'
            }`}
          >
            <i className={`fa-solid fa-check text-sm ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}></i>
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pt-1 w-full">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeColors[event.type]}`}>
            <i className={`fa-solid ${typeIcons[event.type]} mr-1`}></i>
            {event.type}
          </span>
          
          {member && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-md border border-gray-200">
               <div className={`w-3 h-3 rounded-full ${member.avatarColor}`}></div>
               <span className="text-[10px] font-semibold text-gray-600 truncate max-w-[100px]">{member.name}</span>
            </div>
          )}

          {event.isRecurring && (
             <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
               <i className="fa-solid fa-rotate"></i>
               <span>Lặp lại</span>
             </div>
          )}

          {isOverdue && (
            <span className="text-red-600 text-[10px] font-bold uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-md border border-red-100 animate-pulse ml-auto sm:ml-0">
              <i className="fa-solid fa-circle-exclamation mr-1"></i> Quá hạn
            </span>
          )}
        </div>
        
        <h3 className={`text-base font-bold text-gray-900 mb-1 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
          {event.title}
        </h3>
        
        {event.description && (
          <p className={`text-sm text-gray-500 leading-relaxed ${isCompleted ? 'text-gray-400' : ''} line-clamp-2`}>
            {event.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-medium border-t border-gray-50 pt-2 sm:border-0 sm:pt-0">
             <i className="fa-regular fa-clock"></i>
             <span>Kết thúc dự kiến: {endTime}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-4 right-4 sm:static sm:flex sm:flex-col sm:justify-center sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
         <button 
            onClick={() => onDelete(event.id)}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
            title="Xóa sự kiện"
         >
           <i className="fa-solid fa-trash-can text-sm"></i>
         </button>
      </div>
    </div>
  );
};

export default EventItem;