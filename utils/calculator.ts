import { RawRecord, CalculationResult, OTRecord } from '../types';

export const SPECIAL_STAFF = ['นายวิทวัส แปงใจ', 'นายปรพัฒน์ ขัตวงษ์'];

function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function isDayHoliday(date: Date, customHolidays: number[]): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return true; // Sunday=0, Saturday=6
  if (customHolidays.includes(date.getDate())) return true;
  return false;
}

export function calculateOT(
  selectedMonth: number,
  selectedYear: number,
  customHolidays: number[],
  rawData: RawRecord[]
): CalculationResult {
  const dailyTimestamps: Record<string, Record<string, Date[]>> = {};

  // Group timestamps
  rawData.forEach(row => {
    const { name, timestamp } = row;
    if (!name || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) return;
    if (timestamp.getMonth() + 1 !== selectedMonth || timestamp.getFullYear() !== selectedYear) return;

    const dateKey = timestamp.toDateString();
    if (!dailyTimestamps[name]) dailyTimestamps[name] = {};
    if (!dailyTimestamps[name][dateKey]) dailyTimestamps[name][dateKey] = [];
    dailyTimestamps[name][dateKey].push(timestamp);
  });

  const results: Record<string, OTRecord[]> = {};

  for (const name in dailyTimestamps) {
    results[name] = [];

    for (const dateKey in dailyTimestamps[name]) {
      const timestamps = dailyTimestamps[name][dateKey];
      if (timestamps.length < 2) continue;

      const startTime = new Date(Math.min(...timestamps.map(t => t.getTime())));
      const endTime = new Date(Math.max(...timestamps.map(t => t.getTime())));

      const holiday = isDayHoliday(startTime, customHolidays);
      let otHours = 0;
      const recordDate = `${startTime.getDate()}/${startTime.getMonth() + 1}/${startTime.getFullYear()}`;
      const isSpecial = SPECIAL_STAFF.includes(name);

      if (holiday) {
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        otHours = Math.floor(durationHours);
        if (otHours < 2) otHours = 0;

        if (otHours > 0) {
          let holidayPay;
          if (isSpecial) {
            holidayPay = otHours * 50;
            if (holidayPay > 400) holidayPay = 400;
          } else {
            holidayPay = otHours * 60;
            if (holidayPay > 420) holidayPay = 420;
          }

          results[name].push({
            date: recordDate,
            rawDateObj: startTime,
            type: 'วันหยุด',
            otPeriod: `${formatTime(startTime)} - ${formatTime(endTime)}`,
            startTime: formatTime(startTime),
            endTime: formatTime(endTime),
            hours: otHours,
            pay: holidayPay
          });
        }
      } else {
        // Normal Day
        let otStartTimeDecimal = 16.5;
        if (isSpecial) otStartTimeDecimal = 17.0;

        const checkOutTimeDecimal = endTime.getHours() + (endTime.getMinutes() / 60);
        otHours = Math.floor(checkOutTimeDecimal - otStartTimeDecimal);

        if (otHours > 4) otHours = 4;
        if (otHours < 2) otHours = 0;

        if (otHours > 0) {
          const otStartDate = new Date(endTime);
          otStartDate.setHours(Math.trunc(otStartTimeDecimal), (otStartTimeDecimal % 1) * 60, 0, 0);

          results[name].push({
            date: recordDate,
            rawDateObj: otStartDate,
            type: 'วันปกติ',
            otPeriod: `${formatTime(otStartDate)} - ${formatTime(endTime)}`,
            startTime: formatTime(otStartDate),
            endTime: formatTime(endTime),
            hours: otHours,
            pay: otHours * 50
          });
        }
      }
    }
  }

  const summary: { name: string; totalPay: number }[] = [];
  const details: Record<string, OTRecord[]> = {};

  for (const name in results) {
    const totalPay = results[name].reduce((sum, r) => sum + r.pay, 0);
    if (totalPay > 0) {
      summary.push({ name, totalPay });
      details[name] = results[name].sort((a, b) => a.rawDateObj.getTime() - b.rawDateObj.getTime());
    }
  }

  summary.sort((a, b) => a.name.localeCompare(b.name, 'th'));

  return { summary, details };
}

// Generate Mock Data for frontend demo
export function generateMockData(year: number): RawRecord[] {
  // Using names from your original code + professional sounding placeholders
  const names = [
    'นายวิทวัส แปงใจ', 
    'นายปรพัฒน์ ขัตวงษ์', 
    'นายศักดิ์ดา มั่นคง', // ชื่อสมมติ
    'นางสาวนิภา ขยันงาน'  // ชื่อสมมติ
  ];
  const records: RawRecord[] = [];
  
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // 60% chance of work on weekday, 20% on weekend
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const chance = isWeekend ? 0.2 : 0.6;

    names.forEach(name => {
      if (Math.random() < chance) {
        // Time In: 08:00 - 09:00 (Random)
        const inTime = new Date(d);
        inTime.setHours(8, Math.floor(Math.random() * 60));
        records.push({ name, timestamp: inTime });

        // Time Out: 16:30 - 21:00 (Random)
        const outTime = new Date(d);
        outTime.setHours(16 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
        records.push({ name, timestamp: outTime });
      }
    });
  }
  return records;
}