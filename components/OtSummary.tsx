import React, { useState } from 'react';
import { CalculationResult } from '../types';
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

interface Props {
  data: CalculationResult;
}

export const OtSummary: React.FC<Props> = ({ data }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (data.summary.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 bg-white rounded-lg border border-gray-200">
        ไม่พบข้อมูลโอทีในเดือนที่เลือก
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.summary.map((item, index) => {
        const isOpen = openIndex === index;
        const details = data.details[item.name];

        return (
          <div key={item.name} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm transition-all duration-200">
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
                <span className="font-semibold text-lg text-gray-800">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-green-700 font-bold bg-green-50 px-3 py-1 rounded-md border border-green-200">
                <DollarSign className="w-4 h-4" />
                {item.totalPay.toFixed(2)} บาท
              </div>
            </button>
            
            {isOpen && (
              <div className="p-4 border-t border-gray-200 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-l-md">วันที่</th>
                      <th className="px-4 py-3">ประเภท</th>
                      <th className="px-4 py-3">ช่วงเวลาโอที</th>
                      <th className="px-4 py-3">ชั่วโมง</th>
                      <th className="px-4 py-3 text-right rounded-r-md">ค่าตอบแทน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {details.map((record, rIndex) => (
                      <tr key={rIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{record.date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            record.type === 'วันหยุด' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {record.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">{record.otPeriod}</td>
                        <td className="px-4 py-3">{record.hours}</td>
                        <td className="px-4 py-3 text-right font-medium">{record.pay.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};