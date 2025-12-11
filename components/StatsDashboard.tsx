import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FamilyEvent, Member, CompletionStatus, EventType } from '../types';

interface Props {
  events: FamilyEvent[];
  members: Member[];
}

const COLORS = {
  [CompletionStatus.COMPLETED]: '#22c55e', // green-500
  [CompletionStatus.MISSED]: '#ef4444',    // red-500
  [CompletionStatus.PENDING]: '#cbd5e1',   // slate-300
};

const StatsDashboard: React.FC<Props> = ({ events, members }) => {
  // 1. Overall Completion Status
  const statusData = [
    { name: 'Hoàn thành', value: events.filter(e => e.status === CompletionStatus.COMPLETED).length, color: COLORS[CompletionStatus.COMPLETED] },
    { name: 'Bỏ lỡ', value: events.filter(e => e.status === CompletionStatus.MISSED).length, color: COLORS[CompletionStatus.MISSED] },
    { name: 'Chờ xử lý', value: events.filter(e => e.status === CompletionStatus.PENDING).length, color: COLORS[CompletionStatus.PENDING] },
  ].filter(d => d.value > 0);

  // 2. Member Performance
  const memberData = members.map(m => {
    const memberEvents = events.filter(e => e.memberId === m.id);
    const completed = memberEvents.filter(e => e.status === CompletionStatus.COMPLETED).length;
    const total = memberEvents.length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      name: m.name,
      completed,
      missed: memberEvents.filter(e => e.status === CompletionStatus.MISSED).length,
      rate,
      totalEvents: total // Used to check for missing data
    };
  });

  // 3. Events by Type
  const typeData = Object.values(EventType).map(type => ({
    name: type,
    count: events.filter(e => e.type === type).length
  })).filter(d => d.count > 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Missing Data Alert */}
      {memberData.some(m => m.totalEvents === 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <i className="fa-solid fa-triangle-exclamation text-orange-500 mt-1"></i>
          <div>
            <h4 className="font-bold text-orange-800">Cảnh báo nhập liệu</h4>
            <p className="text-sm text-orange-700">Các thành viên sau chưa nhập thời khóa biểu: 
              <span className="font-bold ml-1">
                {memberData.filter(m => m.totalEvents === 0).map(m => m.name).join(', ')}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Tổng sự kiện</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{events.length}</p>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Tỷ lệ hoàn thành</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {events.length > 0 ? Math.round((events.filter(e => e.status === CompletionStatus.COMPLETED).length / events.length) * 100) : 0}%
            </p>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Bỏ lỡ</h3>
            <p className="text-3xl font-bold text-red-500 mt-2">
               {events.filter(e => e.status === CompletionStatus.MISSED).length}
            </p>
         </div>
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Thành viên tích cực</h3>
            <p className="text-xl font-bold text-indigo-600 mt-2 truncate">
              {memberData.filter(m => m.totalEvents > 0).sort((a,b) => b.completed - a.completed)[0]?.name || "Chưa có"}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart: Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Trạng thái hoàn thành</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Member Performance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Tiến độ theo thành viên</h3>
          <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData} layout="vertical" margin={{ left: 20 }}>
                   <XAxis type="number" hide />
                   <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} />
                   <Tooltip 
                      cursor={{fill: 'transparent'}} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border border-gray-200 shadow-lg rounded-lg text-sm">
                              <p className="font-bold">{data.name}</p>
                              {data.totalEvents === 0 ? (
                                <p className="text-red-500">Chưa nhập liệu!</p>
                              ) : (
                                <p>Hoàn thành: {data.completed}/{data.totalEvents}</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                   />
                   <Bar dataKey="completed" name="Hoàn thành" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} background={{ fill: '#f1f5f9' }} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <h3 className="text-lg font-bold text-gray-800 mb-4">Phân loại hoạt động</h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {typeData.map((t) => (
              <div key={t.name} className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl">
                 <span className="text-2xl font-bold text-indigo-600">{t.count}</span>
                 <span className="text-xs text-gray-500 mt-1 uppercase text-center">{t.name}</span>
              </div>
            ))}
         </div>
      </div>

      {/* NEW SECTION: DETAILED SCHEDULE REPORT */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-indigo-500"></i>
          Chi tiết Lịch trình Gia đình
        </h3>
        
        <div className="space-y-8">
          {members.map(member => {
            // Filter and sort events for this member
            const memberEvents = events
              .filter(e => e.memberId === member.id)
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            return (
              <div key={member.id} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Member Header */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${member.avatarColor} flex items-center justify-center text-white font-bold shadow-sm`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{member.name}</h4>
                      <p className="text-xs text-gray-500">{member.age} tuổi • {memberEvents.length} sự kiện</p>
                    </div>
                  </div>
                  {memberEvents.length === 0 && (
                    <span className="text-red-500 text-xs font-bold uppercase bg-red-50 px-2 py-1 rounded-md border border-red-100">
                      Chưa nhập liệu
                    </span>
                  )}
                </div>

                {/* Events Table */}
                <div className="overflow-x-auto">
                  {memberEvents.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3 font-medium">Thời gian</th>
                          <th className="px-4 py-3 font-medium">Hoạt động</th>
                          <th className="px-4 py-3 font-medium">Loại</th>
                          <th className="px-4 py-3 font-medium text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {memberEvents.map(evt => {
                          const start = new Date(evt.startTime);
                          const isCompleted = evt.status === CompletionStatus.COMPLETED;
                          return (
                            <tr key={evt.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                <div className="font-bold">{start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                <div className="text-[10px] text-gray-400">{start.toLocaleDateString('vi-VN')}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{evt.title}</div>
                                {evt.description && <div className="text-xs text-gray-500 truncate max-w-[150px]">{evt.description}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  {evt.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
                                  isCompleted 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                  {isCompleted ? (
                                    <>
                                      <i className="fa-solid fa-check"></i> Đã xong
                                    </>
                                  ) : (
                                    <>
                                      <i className="fa-regular fa-clock"></i> Chờ
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-gray-400 text-sm">
                      <i className="fa-solid fa-calendar-xmark text-2xl mb-2 opacity-50"></i>
                      <p>Thành viên này chưa có lịch trình nào được ghi nhận.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
