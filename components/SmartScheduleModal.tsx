import React, { useState } from 'react';
import { generateSmartSchedule } from '../services/geminiService';
import { Member, FamilyEvent } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onAddEvents: (events: Partial<FamilyEvent>[]) => void;
}

const SmartScheduleModal: React.FC<Props> = ({ isOpen, onClose, members, onAddEvents }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const events = await generateSmartSchedule(prompt, members);
      if (events && events.length > 0) {
        onAddEvents(events);
        onClose();
        setPrompt('');
      } else {
        setError("Không thể tạo lịch từ yêu cầu của bạn. Hãy thử lại chi tiết hơn.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi kết nối với AI. Vui lòng kiểm tra API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 mb-2">
              <i className="fa-solid fa-wand-magic-sparkles text-2xl animate-pulse"></i>
              <h2 className="text-xl font-bold">Trợ lý Lập lịch AI</h2>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>
          <p className="text-indigo-100 text-sm">
            Nhập yêu cầu bằng ngôn ngữ tự nhiên, AI sẽ tự động tạo lịch cho bạn.
          </p>
        </div>

        <div className="p-6">
          <textarea
            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 min-h-[120px] resize-none text-gray-700"
            placeholder="Ví dụ: Lên lịch cho Phương Uyên học toán tối nay lúc 8h trong 45 phút, sau đó cho Thu Trang uống thuốc..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            autoFocus
          />

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation"></i>
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bolt"></i>
                  Tạo Lịch
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartScheduleModal;