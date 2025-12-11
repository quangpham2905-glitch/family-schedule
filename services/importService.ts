import { v4 as uuidv4 } from 'uuid';
import { FamilyEvent, EventType, CompletionStatus } from '../types';

export const parseFile = async (file: File, memberId: string): Promise<FamilyEvent[]> => {
  const text = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(text, memberId);
  } else if (extension === 'ics') {
    return parseICS(text, memberId);
  } else {
    throw new Error("Định dạng file không được hỗ trợ. Vui lòng dùng .csv hoặc .ics");
  }
};

const parseCSV = (text: string, memberId: string): FamilyEvent[] => {
  const lines = text.split('\n');
  const events: FamilyEvent[] = [];
  const now = new Date();

  // Skip header if exists (simple check if first row contains 'Title')
  const startIndex = lines[0].toLowerCase().includes('title') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Expected format: Title, StartTime (ISO or HH:mm), EndTime (ISO or HH:mm), Type, Description
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 3) continue;

    const title = parts[0];
    let startStr = parts[1];
    let endStr = parts[2];
    
    // Handle simple time format HH:mm by appending to today's date
    if (startStr.includes(':') && !startStr.includes('T')) {
       const [h, m] = startStr.split(':').map(Number);
       const d = new Date();
       d.setHours(h, m, 0, 0);
       startStr = d.toISOString();
    }
    
    if (endStr.includes(':') && !endStr.includes('T')) {
       const [h, m] = endStr.split(':').map(Number);
       const d = new Date();
       d.setHours(h, m, 0, 0);
       endStr = d.toISOString();
    }

    const typeStr = parts[3] || 'Khác';
    // Map string to Enum if possible
    let type = EventType.OTHER;
    Object.values(EventType).forEach(t => {
        if (t.toLowerCase() === typeStr.toLowerCase()) type = t;
    });

    events.push({
      id: uuidv4(),
      memberId,
      title,
      startTime: startStr,
      endTime: endStr,
      type,
      description: parts[4] || 'Nhập từ CSV',
      status: CompletionStatus.PENDING,
      isRecurring: false,
      notifiedCompletion: false
    });
  }
  return events;
};

const parseICS = (text: string, memberId: string): FamilyEvent[] => {
  const events: FamilyEvent[] = [];
  const lines = text.split(/\r\n|\r|\n/);
  
  let inEvent = false;
  let currentEvent: any = {};

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      inEvent = false;
      if (currentEvent.summary && currentEvent.dtstart && currentEvent.dtend) {
        events.push({
          id: uuidv4(),
          memberId,
          title: currentEvent.summary,
          startTime: parseICSDate(currentEvent.dtstart),
          endTime: parseICSDate(currentEvent.dtend),
          type: EventType.OTHER, // Default for ICS
          description: currentEvent.description || 'Nhập từ iCalendar',
          status: CompletionStatus.PENDING,
          isRecurring: false,
          notifiedCompletion: false
        });
      }
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) currentEvent.summary = line.substring(8);
      if (line.startsWith('DESCRIPTION:')) currentEvent.description = line.substring(12);
      if (line.startsWith('DTSTART')) currentEvent.dtstart = line.split(':')[1];
      if (line.startsWith('DTEND')) currentEvent.dtend = line.split(':')[1];
    }
  }

  return events;
};

const parseICSDate = (icsDate: string): string => {
  // Simple parser for YYYYMMDDTHHmmSSZ
  if (!icsDate) return new Date().toISOString();
  
  const year = parseInt(icsDate.substring(0, 4));
  const month = parseInt(icsDate.substring(4, 6)) - 1;
  const day = parseInt(icsDate.substring(6, 8));
  const hour = parseInt(icsDate.substring(9, 11)) || 0;
  const min = parseInt(icsDate.substring(11, 13)) || 0;
  const sec = parseInt(icsDate.substring(13, 15)) || 0;

  return new Date(year, month, day, hour, min, sec).toISOString();
};