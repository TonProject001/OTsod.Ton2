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
  "นายกฤชณัท เทพมงคล": "นักวิชาการโสตทัศนศึกษา"
};

const DEFAULT_POSITION = "พนักงาน";

// ลำดับรายชื่อที่ต้องการ
const SORT_ORDER = [
  "นางสาวปพิชญา เอี้ยงหมี",
  "นางสาวกนกวรรณ วงษ์กล่ำ",
  "นายศุภฤกษ์ เนตรแก้ว",
  "นายกฤชณัท เทพมงคล"
];

export const DisbursementSheet: React.FC<Props> = ({ data, month, year, customHolidays }) => {
  const monthName = new Date(year, month - 1).toLocaleString('th-TH', { month: 'long' });
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Filter and Sort Data
  const { filteredData, totalAmount, totalHours } = useMemo(() => {
    let result: { name: string; position: string; records: OTRecord[] }[] = [];
    let sumMoney = 0;
    let sumHours = 0;

    (Object.entries(data.details) as [string, OTRecord[]][]).forEach(([name, records]) => {
      // Exclude special staff
      if (SPECIAL_STAFF.includes(name)) return;

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

    return { filteredData: result, totalAmount: sumMoney, totalHours: sumHours };
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
    <div className="bg-white p-2 print:p-0 w-full mx-auto print:w-full">
      {/* Header */}
      <div className="text-center w-full mb-4">
        <h2 className="text-lg font-bold print:text-xl leading-tight">หลักฐานการเบิกจ่ายค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ</h2>
        <p className="text-sm print:text-base mt-1 leading-tight">
          ส่วนราชการโรงพยาบาลสมเด็จพระเจ้าตากสินมหาราช ประจำเดือน {monthName} พ.ศ. {year + 543} แผนก งานโสตทัศนศึกษา
        </p>
      </div>

      {/* Table */}
      <div className="w-full">
        {/* Adjusted column widths: Rate increased to 45px */}
        <table className="w-full text-[10px] border-collapse border border-black text-center print:text-[10px] table-fixed">
          <colgroup>
            <col className="w-[30px]" /> {/* Seq */}
            <col className="w-[145px]" /> {/* Name */}
            <col className="w-[95px]" /> {/* Position */}
            <col className="w-[45px]" /> {/* Rate: Increased from 30px to 45px */}
            {/* Days: 31 days * 17px = 527px */}
            {daysArray.map(d => <col key={d} className="w-[17px]" />)} 
            <col className="w-[30px]" /> {/* Total Hours */}
            <col className="w-[40px]" /> {/* Rate/Hr */}
            <col className="w-[45px]" /> {/* Total Money */}
            <col className="w-[45px]" /> {/* Sign */}
          </colgroup>
          <thead>
            <tr className="bg-gray-100 print:bg-white h-9">
              <th rowSpan={2} className="border border-black px-1">ลำดับ</th>
              <th rowSpan={2} className="border border-black px-1">ชื่อ-สกุล</th>
              <th rowSpan={2} className="border border-black px-1">ตำแหน่ง</th>
              <th className="border border-black h-4 text-[9px]">ตอบแทน</th>
              <th colSpan={daysInMonth} className="border border-black h-4">วันที่ขึ้นปฏิบัติราชการ</th>
              <th rowSpan={2} className="border border-black px-0 leading-tight">จำนวน<br/>ชั่วโมง</th>
              <th rowSpan={2} className="border border-black px-0 leading-tight">จำนวนเงิน<br/>ต่อชั่วโมง</th>
              <th rowSpan={2} className="border border-black px-0 leading-tight text-[9px]">จำนวนเงิน<br/>รวม</th>
              <th rowSpan={2} className="border border-black px-1">ลายมือชื่อ</th>
            </tr>
            <tr className="bg-gray-100 print:bg-white h-5">
              <th className="border border-black text-[8px] px-0 font-normal">ชั่วโมงละบาท</th>
              {daysArray.map(day => (
                <th key={day} className={`border border-black px-0 font-normal text-[9px] ${isHoliday(day) ? 'bg-blue-100 print:bg-gray-300' : ''}`}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((person, index) => {
              const hours60 = person.records.filter(r => r.type === 'วันหยุด').reduce((sum, r) => sum + r.hours, 0);
              const pay60 = person.records.filter(r => r.type === 'วันหยุด').reduce((sum, r) => sum + r.pay, 0);
              
              const hours50 = person.records.filter(r => r.type === 'วันปกติ').reduce((sum, r) => sum + r.hours, 0);
              const pay50 = person.records.filter(r => r.type === 'วันปกติ').reduce((sum, r) => sum + r.pay, 0);
              
              const totalPay = pay60 + pay50;

              return (
                <React.Fragment key={person.name}>
                  {/* Row for Rate 60 */}
                  <tr className="h-5">
                    <td rowSpan={2} className="border border-black">{index + 1}</td>
                    {/* Name: Removed nowrap/ellipsis, allowed wrap, adjust padding */}
                    <td rowSpan={2} className="border border-black text-left px-1 whitespace-normal break-words leading-tight">{person.name}</td>
                    {/* Position: Slight font reduction if needed, allowed wrap */}
                    <td rowSpan={2} className="border border-black text-center px-1 text-[9px] leading-tight whitespace-pre-line break-words">{person.position}</td>
                    <td className="border border-black text-[9px]">60</td>
                    {daysArray.map(day => (
                      <td key={day} className={`border border-black p-0 ${isHoliday(day) ? 'bg-blue-50 print:bg-gray-200' : ''}`}>
                        {getHoursForDay(person.records, day, 60)}
                      </td>
                    ))}
                    <td className="border border-black">{hours60 > 0 ? hours60 : ''}</td>
                    <td className="border border-black text-right px-1">{pay60 > 0 ? pay60.toLocaleString() : ''}</td>
                    <td rowSpan={2} className="border border-black text-right px-1 font-semibold">
                      {totalPay > 0 ? totalPay.toLocaleString() : ''}
                    </td>
                    <td rowSpan={2} className="border border-black"></td>
                  </tr>
                  
                  {/* Row for Rate 50 */}
                  <tr className="h-5">
                    <td className="border border-black text-[9px]">50</td>
                    {daysArray.map(day => (
                      <td key={day} className={`border border-black p-0 ${isHoliday(day) ? 'bg-blue-50 print:bg-gray-200' : ''}`}>
                        {getHoursForDay(person.records, day, 50)}
                      </td>
                    ))}
                    <td className="border border-black">{hours50 > 0 ? hours50 : ''}</td>
                    <td className="border border-black text-right px-1">{pay50 > 0 ? pay50.toLocaleString() : ''}</td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* Total Footer Row */}
            <tr className="font-bold bg-gray-50 print:bg-white h-7 text-[10px]">
              <td colSpan={daysInMonth + 3} className="border border-black text-center px-4">
                รวมรายการจ่ายทั้งสิ้น {totalAmount.toLocaleString()} บาท ({bahttext(totalAmount)})
              </td>
              <td className="border border-black text-center">รวม</td>
              <td className="border border-black text-center">{totalHours}</td>
              <td className="border border-black text-right px-1">{totalAmount.toLocaleString()}</td>
              <td className="border border-black text-right px-1">{totalAmount.toLocaleString()}</td>
              <td className="border border-black text-center"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Certification Footer - Exactly aligned with sample */}
      <div className="mt-8 print:mt-6 page-break-inside-avoid w-full">
        <p className="mb-6 font-medium text-xs print:text-sm">ขอรับรองว่าผู้มีรายชื่อข้างต้นได้ขึ้นปฏิบัติงาน นอกเวลาราชการจริง</p>

        {/* Increased gap from gap-4 to gap-8 for equal spacing distribution */}
        <div className="grid grid-cols-4 gap-8 text-center text-xs print:text-xs leading-relaxed">
          {/* Column 1 */}
          <div className="flex flex-col items-center">
            {/* Invisible spacer to match the 2-line header of other columns */}
            <div className="invisible h-5 mb-4">Spacer</div> 
            
            <div className="mb-6 w-full">ลงชื่อ............................................</div>
            <div className="font-semibold">นางสาวกาญจนา โลหพันธุ์</div>
            <div>นักวิชาการสาธารณสุขชำนาญการ</div>
            <div>หัวหน้ากลุ่มงานพัฒนทรัพยากรบุคคล</div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col items-center">
            <div className="h-5 mb-4 font-normal">ได้ตรวจสอบแล้วถูกต้องเห็นควรอนุมัติ</div>
            
            <div className="mb-6 w-full relative">
              <span>ลงชื่อ................................... ผู้ตรวจสอบ</span>
            </div>
            
            <div className="font-semibold">นายนันท์ชัย กองแก้ว</div>
            <div>นายแพทย์ชำนาญการพิเศษ</div>
            {/* Adjusted scale slightly for narrower column */}
            <div className="whitespace-nowrap scale-[0.80] origin-top">หัวหน้ากลุ่มภารกิจด้านพัฒนาระบบบริการและสนับสนุนบริการสุขภาพ</div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col items-center">
            <div className="h-5 mb-4 font-normal">ได้ตรวจสอบแล้วถูกต้องเห็นควรอนุมัติ</div>
            
            <div className="mb-6 w-full">ลงชื่อ............................................</div>
            
            <div className="font-semibold">นางสาวทิวารินทร์ ทองจรูณ</div>
            <div>นักวิชาการเงินและบัญชี</div>
          </div>

           {/* Column 4 */}
           <div className="flex flex-col items-center">
            <div className="h-5 mb-4 font-normal">คำสั่งผู้อำนวยการ อนุมัติ</div>
            
            <div className="mb-6 w-full">ลงชื่อ............................................</div>
            
            <div className="font-semibold">นายแพทย์มงคล ลือชูวงศ์</div>
            <div>ผู้อำนวยการโรงพยาบาลสมเด็จพระเจ้าตากสินมหาราช</div>
          </div>
        </div>
      </div>
    </div>
  );
};
