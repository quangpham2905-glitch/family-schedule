import { GoogleGenAI, Type } from "@google/genai";
import { Member, EventType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateSmartSchedule = async (
  prompt: string,
  members: Member[]
): Promise<any[]> => {
  if (!apiKey) {
    console.warn("API Key is missing for Gemini");
    return [];
  }

  const memberContext = members.map(m => `${m.name} (ID: ${m.id}, ${m.age} tuổi)`).join(", ");
  
  const systemInstruction = `
    Bạn là một trợ lý lập lịch biểu gia đình thông minh.
    Nhiệm vụ của bạn là phân tích yêu cầu của người dùng và tạo ra danh sách các sự kiện lịch biểu JSON.
    
    Danh sách thành viên hiện tại: [${memberContext}]
    
    Các loại sự kiện (enum): 'Học tập', 'Học thêm', 'Uống thuốc', 'Hoạt động', 'Khác'.
    
    Hãy trả về một mảng JSON các đối tượng sự kiện. Mỗi đối tượng cần có:
    - title: Tên sự kiện (ngắn gọn)
    - description: Mô tả chi tiết (nếu có)
    - type: Một trong các loại enum trên
    - memberId: ID của thành viên tương ứng (chọn từ danh sách trên, nếu không rõ hãy chọn người đầu tiên)
    - startTime: Thời gian bắt đầu (định dạng ISO 8601, giả sử hôm nay là ngày hiện tại, tính toán thời gian hợp lý)
    - endTime: Thời gian kết thúc (định dạng ISO 8601)
    
    Ví dụ input: "Lên lịch cho Tý học toán lúc 8 giờ tối nay trong 1 tiếng"
    Output mong đợi: JSON Array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: Object.values(EventType) },
                    memberId: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING }
                }
            }
        }
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};