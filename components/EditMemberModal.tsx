import React, { useState, useEffect } from 'react';
import { Member, UserRole } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null; // null implies Create Mode
  onSave: (id: string, name: string, age: number, avatarColor: string, password?: string, role?: UserRole) => void;
}

const COLORS = [
  'bg-blue-500', 'bg-rose-500', 'bg-teal-500', 'bg-amber-500',
  'bg-indigo-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'
];

const EditMemberModal: React.FC<Props> = ({ isOpen, onClose, member, onSave }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(0);
  const [avatarColor, setAvatarColor] = useState(COLORS[0]);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.CHILD);

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name);
        setAge(member.age);
        setAvatarColor(member.avatarColor);
        setPassword(member.password || '');
        setRole(member.role || UserRole.CHILD);
      } else {
        // Reset for Create Mode
        setName('');
        setAge(0);
        setAvatarColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setPassword('');
        setRole(UserRole.CHILD);
      }
    }
  }, [isOpen, member]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If member is null, generate a temporary ID (or let parent handle it)
    // We pass a generated ID here so the parent knows it's a new item if it doesn't match existing
    const id = member ? member.id : crypto.randomUUID();
    onSave(id, name, age, avatarColor, password, role);
    onClose();
  };

  const isEditMode = !!member;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">
            {isEditMode ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
             <input
               type="text"
               required
               className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="Nhập tên..."
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
             <input
               type="number"
               required
               min="1"
               max="100"
               className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
               value={age}
               onChange={(e) => setAge(parseInt(e.target.value))}
             />
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
             <p className="text-xs font-bold text-gray-500 uppercase">Bảo mật & Quyền</p>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditMode ? "Để trống nếu không đổi" : "Nhập mật khẩu"}
                  required={!isEditMode}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value={UserRole.PARENT}>Phụ huynh (Admin)</option>
                  <option value={UserRole.CHILD}>Con cái (Thành viên)</option>
                </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Màu đại diện</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`w-8 h-8 rounded-full ${color} ${
                    avatarColor === color 
                      ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                      : 'hover:scale-110'
                  } transition-all`}
                />
              ))}
            </div>
          </div>
          <div className="pt-2 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Hủy</button>
             <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg shadow-md">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditMemberModal;