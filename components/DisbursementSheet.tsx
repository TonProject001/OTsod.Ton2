import React, { useMemo } from 'react';
import { CalculationResult, OTRecord } from '../types';
import { SPECIAL_STAFF } from '../utils/calculator';
import { bahttext } from '../utils/bahttext';

interface Props {
  data: CalculationResult;
  month: number;
  year: number;
  customHolidays: number[];
}

const POSITION_MAP: Record<string, string> = {
  "นางสาวปพิชญา เอี้ยงหมี": "เจ้าพนักงานโสตทัศนศึกษา\nชำนาญงาน",
  "นางสาวกนกวรรณ วงษ์กล่ำ": "นักวิชาการโสตทัศนศึกษา",
  "นายศุภฤกษ์ เนตรแก้ว": "นักวิชาการโสตทัศนศึกษา",
  "นายกฤชณัท เทพมงคล": "นักวิชาการโสตทัศนศึกษา",
  "นายปรพัฒน์ ขัตวงษ์": "พนักงานบริการ",
  "นายวิทวัส แปงใจ": "พนักงานบริการ"
};

const DEFAULT_POSITION = "พนักงานบริการ";

// ลำดับรายชื่อที่ต้องการ
const SORT_ORDER = [
  "นางสาวปพิชญา เอี้ยงหมี",
  "นางสาวกนกวรรณ วงษ์กล่ำ",
  "นายศุภฤกษ์ เนตรแก้ว",
  "นายกฤชณัท เทพมงคล",
  "นายปรพัฒน์ ขัตวงษ์",
  "นายวิทวัส แปงใจ"
];

export const DisbursementSheet: React.FC<Props> = ({ data, month, year, customHolidays }) => {
  const monthName = new Date(year, month - 1).toLocaleString('th-TH', { month: 'long' });
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filter and Sort Data
  const { filteredData, totalAmount, totalHours, positionCounts } = useMemo(() => {
    let result: { name: string; position: string; records: OTRecord[] }[] = [];
    let sumMoney = 0;
    let sumHours = 0;

    (Object.entries(data.details) as [string, OTRecord[]][]).forEach(([name, records]) => {
      // Exclude special staff if any defined in SPECIAL_STAFF
      if (SPECIAL_STAFF.length > 0 && SPECIAL_STAFF.includes(name)) return;

      const position = POSITION_MAP[name] || DEFAULT_POSITION;
      
      // Calculate total for this person to add to grand total
      records.forEach(r => {
        sumMoney += r.pay;
        sumHours += r.hours;
      });

      result.push({
        name,
        position,
        records
      });
    });

    // Sort by specific order
    result.sort((a, b) => {
      const indexA = SORT_ORDER.indexOf(a.name);
      const indexB = SORT_ORDER.indexOf(b.name);

      // ถ้าทั้งคู่มีในรายการ ให้เรียงตามลำดับ
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // ถ้าคนใดคนหนึ่งมีในรายการ ให้คนนั้นขึ้นก่อน
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // ถ้าไม่มีในรายการทั้งคู่ ให้เรียงตามตัวอักษร
      return a.name.localeCompare(b.name, 'th');
    });

    // Count positions dynamically from result (the staff present in the table for this month)
    let jpCount = 0;   // จพ.โสตทัศนศึกษา
    let nwkCount = 0;  // นวก.โสตทัศนศึกษา
    let pnwCount = 0;  // พนง.บริการ

    result.forEach(person => {
      if (person.position.includes('เจ้าพนักงานโสตทัศนศึกษา') || person.position.includes('จพ.โสตทัศนศึกษา')) {
        jpCount++;
      } else if (person.position.includes('นักวิชาการโสตทัศนศึกษา') || person.position.includes('นวก.โสตทัศนศึกษา')) {
        nwkCount++;
      } else if (person.position.includes('พนักงานบริการ') || person.position.includes('พนง.บริการ')) {
        pnwCount++;
      }
    });

    return { 
      filteredData: result, 
      totalAmount: sumMoney, 
      totalHours: sumHours,
      positionCounts: {
        jp: jpCount,
        nwk: nwkCount,
        pnw: pnwCount
      }
    };
  }, [data]);

  const isHoliday = (day: number) => {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 || customHolidays.includes(day);
  };

  const getHoursForDay = (records: OTRecord[], day: number, rateType: 60 | 50) => {
    const record = records.find(r => r.rawDateObj.getDate() === day);
    if (!record) return null;

    // Check rate type matches
    const isRecordHoliday = record.type === 'วันหยุด';
    if (rateType === 60 && !isRecordHoliday) return null;
    if (rateType === 50 && isRecordHoliday) return null;

    return Math.min(record.hours, 8);
  };

  return (
    <div className="bg-white p-2 print:p-0 w-full mx-auto print:max-w-none print:w-full print:break-inside-avoid print:page-break-inside-avoid">
      {/* Header */}
      <div className="text-center w-full mb-3 print:mb-1.5">
        <h2 className="text-lg font-bold print:text-[15px] leading-tight">หลักฐานการเบิกจ่ายค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ</h2>
        <p className="text-sm print:text-[11px] mt-0.5 leading-tight text-gray-800">
          ส่วนราชการโรงพยาบาลสมเด็จพระเจ้าตากสินมหาราช ประจำเดือน {monthName} พ.ศ. {year + 543} แผนก งานโสตทัศนศึกษา
        </p>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto print:overflow-visible">
        <table className="w-full text-[10px] print:text-[9px] border-collapse border border-black text-center table-fixed">
          <colgroup>
            <col className="w-[120px]" /> {/* Name */}
            <col className="w-[90px]" /> {/* Position */}
            <col className="w-[24px]" /> {/* Rate */}
            {/* Days: 31 days * 19px = 589px */}
            {daysArray.map(d => <col key={d} className="w-[19px]" />)} 
            <col className="w-[32px]" /> {/* Total Hours */}
            <col className="w-[42px]" /> {/* Rate/Hr */}
            <col className="w-[48px]" /> {/* Total Money */}
            <col className="w-[48px]" /> {/* Sign */}
          </colgroup>
          <thead>
            <tr className="bg-gray-100 print:bg-white h-8 print:h-7">
              <th rowSpan={2} className="border border-black px-1.5 print:px-1">ชื่อ-สกุล</th>
              <th rowSpan={2} className="border border-black px-1 print:px-0.5">ตำแหน่ง</th>
              <th rowSpan={2} className="border border-black px-0 text-[8.5px] print:text-[8px] leading-tight font-semibold">อัตรา/<br/>ชม.</th>
              <th colSpan={daysInMonth} className="border border-black h-4 px-0">วันที่ขึ้นปฏิบัติงาน</th>
              <th rowSpan={2} className="border border-black px-0 leading-tight">จำนวน<br/>เวร (ชม.)</th>
              <th rowSpan={2} className="border border-black px-0 leading-tight">จำนวนเงิน<br/>ต่อเวร</th>
              <th rowSpan={2} className="border border-black px-0 leading-tight text-[9px] print:text-[8px]">รวม<br/>จำนวนเงิน</th>
              <th rowSpan={2} className="border border-black px-0.5 print:px-0">ลายมือชื่อ</th>
            </tr>
            <tr className="bg-gray-100 print:bg-white h-5 print:h-4">
              {daysArray.map(day => (
                <th key={day} className={`border border-black px-0 font-normal ${isHoliday(day) ? 'bg-blue-100 print:bg-gray-300' : ''}`}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((person) => {
              const hours60 = person.records.filter(r => r.type === 'วันหยุด').reduce((sum, r) => sum + r.hours, 0);
              const pay60 = person.records.filter(r => r.type === 'วันหยุด').reduce((sum, r) => sum + r.pay, 0);
              
              const hours50 = person.records.filter(r => r.type === 'วันปกติ').reduce((sum, r) => sum + r.hours, 0);
              const pay50 = person.records.filter(r => r.type === 'วันปกติ').reduce((sum, r) => sum + r.pay, 0);
              
              const totalPay = pay60 + pay50;

              return (
                <React.Fragment key={person.name}>
                  {/* Row for Rate 50 */}
                  <tr className="h-5 print:h-[18px]">
                    <td rowSpan={2} className="border border-black text-left px-2 print:px-1 whitespace-nowrap overflow-hidden text-ellipsis">{person.name}</td>
                    {/* Position cell */}
                    <td rowSpan={2} className="border border-black text-center px-0.5 text-[9.5px] print:text-[8.5px] leading-tight whitespace-pre-line">{person.position}</td>
                    <td className="border border-black text-[9px] print:text-[8px] px-0">50</td>
                    {daysArray.map(day => (
                      <td key={day} className={`border border-black p-0 ${isHoliday(day) ? 'bg-blue-50 print:bg-gray-200' : ''}`}>
                        {getHoursForDay(person.records, day, 50)}
                      </td>
                    ))}
                    <td className="border border-black">{hours50 > 0 ? hours50 : ''}</td>
                    <td className="border border-black text-right px-1 print:px-0.5">{pay50 > 0 ? pay50.toLocaleString() : ''}</td>
                    <td rowSpan={2} className="border border-black text-right px-1 print:px-0.5 font-semibold">
                      {totalPay > 0 ? totalPay.toLocaleString() : ''}
                    </td>
                    <td rowSpan={2} className="border border-black"></td>
                  </tr>
                  
                  {/* Row for Rate 60 */}
                  <tr className="h-5 print:h-[18px]">
                    <td className="border border-black text-[9px] print:text-[8px] px-0">60</td>
                    {daysArray.map(day => (
                      <td key={day} className={`border border-black p-0 ${isHoliday(day) ? 'bg-blue-50 print:bg-gray-200' : ''}`}>
                        {getHoursForDay(person.records, day, 60)}
                      </td>
                    ))}
                    <td className="border border-black">{hours60 > 0 ? hours60 : ''}</td>
                    <td className="border border-black text-right px-1 print:px-0.5">{pay60 > 0 ? pay60.toLocaleString() : ''}</td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* Total Footer Row */}
            <tr className="font-bold bg-gray-50 print:bg-white h-7 print:h-[22px] text-[10px] print:text-[9px]">
              <td colSpan={daysInMonth + 2} className="border border-black text-center px-2 print:px-1">
                รวมรายการจ่ายทั้งสิ้น {totalAmount.toLocaleString()} บาท ({bahttext(totalAmount)})
              </td>
              <td className="border border-black text-center">รวม</td>
              <td className="border border-black text-center">{totalHours}</td>
              <td className="border border-black text-right px-1 print:px-0.5">{totalAmount.toLocaleString()}</td>
              <td className="border border-black text-right px-1 print:px-0.5">{totalAmount.toLocaleString()}</td>
              <td className="border border-black text-center"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Certification Footer - Exactly aligned with sample */}
      <div className="mt-3 print:mt-1.5 print:break-inside-avoid print:page-break-inside-avoid w-full text-gray-900">
        <p className="mb-1 print:mb-0.5 font-medium text-xs print:text-[9.5px] leading-tight">
          ขอรับรองว่าผู้มีรายชื่อข้างต้นได้ขึ้นปฏิบัติงาน นอกเวลาราชการจริง
        </p>
        <p className="mb-3 print:mb-2 font-medium text-xs print:text-[9.5px] leading-tight">
          ตรวจสอบถูกต้องแล้วเห็นควรจ่ายปฏิบัติงานนอกเวลาราชการ&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{totalAmount.toLocaleString()}&nbsp;&nbsp;บาท ให้กับ จพ.โสตทัศนศึกษา {positionCounts.jp} คน นวก.โสตทัศนศึกษา {positionCounts.nwk} คน พนง.บริการ {positionCounts.pnw} คน
        </p>

        {/* 5 columns with balanced spacing as shown in sample image */}
        <div className="grid grid-cols-5 gap-2 print:gap-1 text-center text-xs print:text-[8.5px] leading-tight">
          {/* Column 1 */}
          <div className="flex flex-col items-center">
            {/* Invisible spacer to match the header of other columns */}
            <div className="invisible h-4 print:h-3.5 mb-2 print:mb-1 text-[9px]">Spacer</div> 
            
            <div className="mb-2.5 print:mb-1.5 w-full text-[10px] print:text-[8.5px]">ลงชื่อ............................................</div>
            <div className="font-semibold text-xs print:text-[8.5px]">( นางสาวปพิชญา เอี้ยงหมี )</div>
            <div className="text-[11px] print:text-[8px] text-gray-800 mt-0.5">หัวหน้างานโสตทัศนศึกษา</div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-center">
            <div className="invisible h-4 print:h-3.5 mb-2 print:mb-1 text-[9px]">Spacer</div> 
            
            <div className="mb-2.5 print:mb-1.5 w-full text-[10px] print:text-[8.5px]">ลงชื่อ............................................</div>
            <div className="font-semibold text-xs print:text-[8.5px]">( นางสาวกาญจนา โลหพันธุ์ )</div>
            <div className="text-[11px] print:text-[8px] text-gray-800 mt-0.5">หัวหน้ากลุ่มงานพัฒนาทรัพยากรบุคคล</div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-center">
            <div className="h-4 print:h-3.5 mb-2 print:mb-1 font-normal text-[10px] print:text-[8.5px]">ตรวจสอบแล้วถูกต้องเห็นควรอนุมัติ</div>
            
            <div className="mb-2.5 print:mb-1.5 w-full relative text-[10px] print:text-[8.5px] whitespace-nowrap">
              <span>ลงชื่อ..................................หัวหน้าฝ่าย</span>
            </div>
            
            <div className="font-semibold text-xs print:text-[8.5px]">( นายธนันท์ชัย กองแก้ว )</div>
            <div className="text-[11px] print:text-[8px] text-gray-800 mt-0.5 leading-tight">
              <div>หัวหน้ากลุ่มภารกิจด้านพัฒนาระบบบริการ</div>
              <div>และสนับสนุนบริการสุขภาพ</div>
            </div>
          </div>

          {/* Column 4 */}
          <div className="flex flex-col items-center">
            <div className="h-4 print:h-3.5 mb-2 print:mb-1 font-normal text-[10px] print:text-[8.5px]">ได้ตรวจสอบแล้วถูกต้องเห็นควรอนุมัติ</div>
            
            <div className="mb-2.5 print:mb-1.5 w-full text-[10px] print:text-[8.5px]">ลงชื่อ............................................</div>
            
            <div className="font-semibold text-xs print:text-[8.5px]">( นางสาวทิวารินทร์ ทองจรูณ )</div>
            <div className="text-[11px] print:text-[8px] text-gray-800 mt-0.5">นักวิชาการเงินและบัญชี</div>
          </div>

          {/* Column 5 */}
          <div className="flex flex-col items-center">
            <div className="h-4 print:h-3.5 mb-2 print:mb-1 font-normal text-[10px] print:text-[8.5px]">คำสั่งผู้อำนวยการอนุมัติ</div>
            
            <div className="mb-2.5 print:mb-1.5 w-full text-[10px] print:text-[8.5px]">ลงชื่อ............................................</div>
            
            <div className="font-semibold text-xs print:text-[8.5px]">( นายแพทย์มงคล ลือชูวงศ์ )</div>
            <div className="text-[11px] print:text-[8px] text-gray-800 mt-0.5 whitespace-nowrap scale-[0.88] origin-top">
              ผู้อำนวยการโรงพยาบาลสมเด็จพระเจ้าตากสินมหาราช
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
