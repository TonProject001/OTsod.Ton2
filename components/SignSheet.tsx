import React, { useMemo } from 'react';
import { CalculationResult, OTRecord } from '../types';
import { SPECIAL_STAFF } from '../utils/calculator';

interface Props {
  data: CalculationResult;
  month: number;
  year: number;
}

interface FlatRecord extends OTRecord {
  name: string;
}

// Helper function to format date like "13 พฤศจิกายน 2568"
const formatThaiDate = (date: Date): string => {
  const day = date.getDate();
  const month = date.toLocaleDateString('th-TH', { month: 'long' });
  const year = date.getFullYear() + 543;
  return `${day} ${month} ${year}`;
};

// Internal Component for Rendering a Single Table Page
const SignSheetPage: React.FC<{
  records: FlatRecord[];
  monthName: string;
  year: number;
  titleSuffix?: string;
  isSecondPage?: boolean;
}> = ({ records, monthName, year, titleSuffix, isSecondPage }) => {
  if (records.length === 0) return null;

  return (
    <div className={`bg-white p-8 rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0 print:w-full mb-8 print:mb-0 ${isSecondPage ? 'print:break-before-page' : ''}`}>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">รายชื่อผู้ปฏิบัติงานนอกเวลาราชการ แผนก งานโสตทัศนศึกษา {titleSuffix && <span className="text-gray-700 font-normal text-base block mt-1">({titleSuffix})</span>}</h2>
        <p className="text-gray-600 mt-1">
          ประจำเดือน <span className="font-semibold text-gray-900">{monthName}</span> พ.ศ. <span className="font-semibold text-gray-900">{year + 543}</span>
        </p>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-sm text-left border-collapse border border-gray-300 print:border-black">
          <thead className="bg-gray-100 text-gray-900 font-semibold text-center print:bg-gray-200 print:text-black print:table-header-group">
            <tr>
              <th className="border border-gray-300 print:border-black px-2 py-2 w-32">วัน/เดือน/ปี</th>
              <th className="border border-gray-300 print:border-black px-2 py-2 w-48">ชื่อ-สกุล</th>
              <th className="border border-gray-300 print:border-black px-2 py-2 w-20">เวลามา</th>
              <th className="border border-gray-300 print:border-black px-2 py-2">ลายมือชื่อ</th>
              <th className="border border-gray-300 print:border-black px-2 py-2 w-20">เวลากลับ</th>
              <th className="border border-gray-300 print:border-black px-2 py-2">ลายมือชื่อ</th>
              <th className="border border-gray-300 print:border-black px-2 py-2 w-24">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50 print:hover:bg-transparent h-12 break-inside-avoid">
                <td className="border border-gray-300 print:border-black px-2 text-center whitespace-nowrap">
                  {formatThaiDate(record.rawDateObj)}
                </td>
                <td className="border border-gray-300 print:border-black px-2">{record.name}</td>
                <td className="border border-gray-300 print:border-black px-2 text-center">{record.startTime}</td>
                <td className="border border-gray-300 print:border-black px-2"></td>
                <td className="border border-gray-300 print:border-black px-2 text-center">{record.endTime}</td>
                <td className="border border-gray-300 print:border-black px-2"></td>
                <td className="border border-gray-300 print:border-black px-2 text-center text-gray-600 print:text-black text-xs">
                  {record.type === 'วันหยุด' ? 'วันหยุด' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const SignSheet: React.FC<Props> = ({ data, month, year }) => {
  // Split records into General and Special staff
  const { generalRecords, specialRecords } = useMemo(() => {
    let general: FlatRecord[] = [];
    let special: FlatRecord[] = [];

    (Object.entries(data.details) as [string, OTRecord[]][]).forEach(([name, records]) => {
      const isSpecial = SPECIAL_STAFF.includes(name);
      records.forEach(r => {
        if (isSpecial) {
          special.push({ ...r, name });
        } else {
          general.push({ ...r, name });
        }
      });
    });

    const sortFn = (a: FlatRecord, b: FlatRecord) => {
      // Sort by Date
      const timeDiff = a.rawDateObj.getTime() - b.rawDateObj.getTime();
      if (timeDiff !== 0) return timeDiff;
      // If same date, sort by Name
      return a.name.localeCompare(b.name, 'th');
    };

    return {
      generalRecords: general.sort(sortFn),
      specialRecords: special.sort(sortFn)
    };
  }, [data]);

  const monthName = new Date(year, month - 1).toLocaleString('th-TH', { month: 'long' });

  if (generalRecords.length === 0 && specialRecords.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 bg-white rounded-lg border border-gray-200">
        ไม่พบข้อมูลสำหรับสร้างตารางลงชื่อในเดือน {monthName} {year}
      </div>
    );
  }

  return (
    <div>
      {/* General Staff Page */}
      <SignSheetPage 
        records={generalRecords} 
        monthName={monthName} 
        year={year} 
        titleSuffix="พนักงานทั่วไป"
      />

      {/* Special Staff Page (Printed on new page) */}
      <SignSheetPage 
        records={specialRecords} 
        monthName={monthName} 
        year={year} 
        titleSuffix="พนักงานโสตฯ/จ้างเหมาบริการ"
        isSecondPage={generalRecords.length > 0} 
      />
    </div>
  );
};
