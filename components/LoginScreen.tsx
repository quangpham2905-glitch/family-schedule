import React, { useState } from 'react';
import { Member, UserRole } from '../types';

interface Props {
  members: Member[];
  onLogin: (member: Member) => void;
  onRegister: (member: Member) => void;
}

const LoginScreen: React.FC<Props> = ({ members, onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAge, setNewAge] = useState<number | ''>('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.PARENT);
  const [newAvatarColor, setNewAvatarColor] = useState('bg-indigo-500');

  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find(m => m.id === selectedMemberId);
    
    if (!member) {
      setError('Vui lòng chọn thành viên');
      return;
    }

    if (member.password && member.password !== password) {
      setError('Mật khẩu không đúng');
      return;
    }

    onLogin(member);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Tên không được để trống');
      return;
    }
    if (!newPassword.trim()) {
      setError('Mật khẩu không được để trống');
      return;
    }
    if (!newAge) {
      setError('Vui lòng nhập tuổi');
      return;
    }

    const newMember: Member = {
      id: crypto.randomUUID(),
      name: newName,
      age: Number(newAge),
      role: newRole,
      password: newPassword,
      avatarColor: newAvatarColor
    };

    onRegister(newMember);
  };

  const COLORS = [
    'bg-blue-500', 'bg-rose-500', 'bg-teal-500', 'bg-amber-500',
    'bg-indigo-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-center relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <i className="fa-solid fa-house-chimney text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-white">Smart Family Schedule</h1>
          <p className="text-indigo-100 text-sm mt-2">
            {isRegistering ? 'Tạo tài khoản thành viên mới' : 'Đăng nhập để quản lý lịch trình'}
          </p>
        </div>

        <div className="p-8">
          {isRegistering ? (
            /* REGISTER FORM */
            <form onSubmit={handleRegister} className="space-y-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập / Tên</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Bố, Mẹ, ..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    required
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                   <select 
                     className="w-full border border-gray-300 rounded-xl p-3 outline-none"
                     value={newRole}
                     onChange={(e) => setNewRole(e.target.value as UserRole)}
                   >
                     <option value={UserRole.PARENT}>Phụ huynh</option>
                     <option value={UserRole.CHILD}>Con cái</option>
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Màu đại diện</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewAvatarColor(color)}
                      className={`w-8 h-8 rounded-full ${color} ${
                        newAvatarColor === color 
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                          : 'hover:scale-110'
                      } transition-all`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-2"
              >
                Hoàn tất đăng ký
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                }}
                className="w-full py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Quay lại đăng nhập
              </button>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn thành viên</label>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                  {members.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedMemberId(member.id);
                        setError('');
                      }}
                      className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                        selectedMemberId === member.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${member.avatarColor} text-white flex items-center justify-center font-bold mb-2`}>
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate w-full text-center">
                        {member.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMemberId && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedMemberId}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
              >
                Đăng Nhập
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                     setIsRegistering(true);
                     setError('');
                  }}
                  className="text-indigo-600 text-sm font-semibold hover:underline"
                >
                  Chưa có tài khoản? Đăng ký thành viên mới
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;