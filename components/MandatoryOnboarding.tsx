import React, { useRef, useState } from 'react';
import { Member } from '../types';
import { parseFile } from '../services/importService';

interface Props {
  currentUser: Member;
  hasEvents: boolean;
  onOpenAiModal: () => void;
  onOpenManualModal: () => void;
  onImportEvents: (events: any[]) => void;
}

const MandatoryOnboarding: React.FC<Props> = ({ 
  currentUser, 
  hasEvents, 
  onOpenAiModal, 
  onOpenManualModal,
  onImportEvents
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  // If user has events, don't show this modal
  if (hasEvents) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError('');

    try {
      const events = await parseFile(file, currentUser.id);
      if (events.length === 0) {
        setError("Không tìm thấy sự kiện nào trong file.");
      } else {
        onImportEvents(events);
      }
    } catch (err: any) {
      setError(err.message || "Lỗi khi đọc file.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-bounce-in relative">
        
        {/* Decorative Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm animate-pulse">
            <i className="fa-solid fa-calendar-plus text-4xl text-white"></i>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Xin chào, {currentUser.name}!</h2>
          <p className="text-blue-100">
            Để bắt đầu sử dụng TimeSync, bạn cần thiết lập thời khóa biểu cá nhân. 
            Hệ thống yêu cầu ít nhất 1 sự kiện.
          </p>
        </div>

        <div className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i>
              {error}
            </div>
          )}

          {/* Option 1: AI */}
          <button 
            onClick={onOpenAiModal}
            className="w-full group flex items-center p-4 border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 group-hover:text-indigo-700">Tạo lịch tự động bằng AI</h3>
              <p className="text-sm text-gray-500">Nhập văn bản (ví dụ: "Học toán thứ 2,4,6 lúc 8h")</p>
            </div>
          </button>

          {/* Option 2: Upload File */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full group flex items-center p-4 border-2 border-green-100 hover:border-green-500 hover:bg-green-50 rounded-2xl transition-all cursor-pointer text-left relative"
            disabled={isImporting}
          >
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
               {isImporting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-file-import"></i>}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 group-hover:text-green-700">Nhập từ File</h3>
              <p className="text-sm text-gray-500">Hỗ trợ file .ICS (Google Calendar) hoặc .CSV</p>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv,.ics"
              onChange={handleFileChange}
            />
          </button>

          {/* Option 3: Manual */}
          <button 
            onClick={onOpenManualModal}
            className="w-full group flex items-center p-4 border-2 border-gray-100 hover:border-gray-400 hover:bg-gray-50 rounded-2xl transition-all cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-xl mr-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-plus"></i>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 group-hover:text-gray-900">Nhập thủ công</h3>
              <p className="text-sm text-gray-500">Thêm từng sự kiện vào lịch</p>
            </div>
          </button>
        </div>

        <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-400">
           <i className="fa-solid fa-lock mr-1"></i>
           Dữ liệu sẽ được đồng bộ ngay lập tức với hệ thống quản trị.
        </div>
      </div>
    </div>
  );
};

export default MandatoryOnboarding;