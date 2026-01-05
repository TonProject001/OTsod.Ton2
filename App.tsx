import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, FileText, Table, Printer, Plus, Trash2, Info, Link, RefreshCw, AlertCircle, FileCheck } from 'lucide-react';
import { calculateOT, generateMockData } from './utils/calculator';
import { OtSummary } from './components/OtSummary';
import { SignSheet } from './components/SignSheet';
import { DisbursementSheet } from './components/DisbursementSheet';
import { RawRecord } from './types';

// Hardcoded API URL
const API_URL = 'https://script.google.com/macros/s/AKfycbz7sBoBdkM24qt6fnHkohU40bwJ78FEenw-XsA22hKlCcejVbUHC9uMMFKSCnoP-MtS/exec';

const App: React.FC = () => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [customHolidays, setCustomHolidays] = useState<number[]>([]);
  const [holidayInput, setHolidayInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'sheet' | 'disbursement'>('summary');

  // API State
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading immediately
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedData, setFetchedData] = useState<RawRecord[]>([]);

  // Generate mock data (fallback)
  const mockData = useMemo(() => generateMockData(year), [year]);

  // Determine which data to use
  const activeRawData = isApiConnected ? fetchedData : mockData;

  const handleAddHoliday = () => {
    const day = parseInt(holidayInput);
    if (day >= 1 && day <= 31 && !customHolidays.includes(day)) {
      setCustomHolidays(prev => [...prev, day].sort((a, b) => a - b));
      setHolidayInput('');
    }
  };

  const removeHoliday = (day: number) => {
    setCustomHolidays(prev => prev.filter(d => d !== day));
  };

  const handleFetchData = async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('ไม่สามารถเชื่อมต่อกับ Server ได้');
      }
      const jsonData = await response.json();
      
      // Parse dates from JSON string to Date objects
      const parsedData: RawRecord[] = jsonData.map((item: any) => ({
        name: item.name,
        timestamp: new Date(item.timestamp)
      })).filter((item: RawRecord) => !isNaN(item.timestamp.getTime()));

      setFetchedData(parsedData);
      setIsApiConnected(true);
    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล');
      setIsApiConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    handleFetchData();
  }, []);

  const calculationResult = useMemo(() => {
    return calculateOT(month, year, customHolidays, activeRawData);
  }, [month, year, customHolidays, activeRawData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Dynamic Print Styles */}
      <style>{`
        @media print {
          @page {
            size: ${activeTab === 'disbursement' ? 'A4 landscape' : 'A4 portrait'};
            /* Set margin: 10mm for landscape to allow more width, 15mm for portrait */
            margin: ${activeTab === 'disbursement' ? '10mm' : '15mm'};
          }
          body {
            /* Ensure background graphics are printed if needed */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header - Hidden on Print */}
      <div className="bg-white shadow-sm border-b border-gray-200 no-print">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              โปรแกรมคำนวณค่าล่วงเวลา (OT)
            </h1>
            <div className="flex items-center gap-3">
               {/* Status Badge */}
               <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${
                 isLoading ? 'bg-yellow-100 text-yellow-700' :
                 isApiConnected ? 'bg-green-100 text-green-700' : 
                 'bg-gray-100 text-gray-500'
               }`}>
                 {isLoading ? (
                   <><RefreshCw className="w-3 h-3 animate-spin" /> กำลังโหลดข้อมูล...</>
                 ) : isApiConnected ? (
                   <><Link className="w-3 h-3" /> ข้อมูลจริง (Live)</>
                 ) : (
                   <><Info className="w-3 h-3" /> ข้อมูลจำลอง (Mock)</>
                 )}
               </span>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                พิมพ์เอกสาร
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Controls - Hidden on Print */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100 no-print">
          
          {/* Error Message if API fails */}
          {!isLoading && !isApiConnected && fetchError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 flex-shrink-0" />
               <div>
                 <p className="font-semibold">ไม่สามารถดึงข้อมูลได้</p>
                 <p className="text-sm">{fetchError} (กำลังแสดงผลด้วยข้อมูลจำลอง)</p>
                 <button 
                    onClick={handleFetchData}
                    className="mt-2 text-sm text-red-700 underline hover:text-red-900 font-semibold"
                 >
                   ลองเชื่อมต่อใหม่
                 </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลือกเดือน</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปี (ค.ศ.)</label>
              <input 
                type="number" 
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เพิ่มวันหยุดพิเศษ (เฉพาะวันที่)</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={holidayInput}
                onChange={(e) => setHolidayInput(e.target.value)}
                placeholder="เช่น 13"
                className="flex-1 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
              <button 
                onClick={handleAddHoliday}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> เพิ่ม
              </button>
            </div>
            
            {customHolidays.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {customHolidays.map(day => (
                  <span key={day} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    วันที่ {day}
                    <button onClick={() => removeHoliday(day)} className="ml-2 text-blue-600 hover:text-blue-900">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs - Hidden on Print */}
        <div className="flex border-b border-gray-200 mb-6 no-print overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            สรุปผลการคำนวณ
          </button>
          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'sheet'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Table className="w-4 h-4" />
            ตารางลงเวลา
          </button>
          <button
            onClick={() => setActiveTab('disbursement')}
            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'disbursement'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            หลักฐานการเบิกจ่าย
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {activeTab === 'summary' && <OtSummary data={calculationResult} />}
          {activeTab === 'sheet' && <SignSheet data={calculationResult} month={month} year={year} />}
          {activeTab === 'disbursement' && <DisbursementSheet data={calculationResult} month={month} year={year} customHolidays={customHolidays} />}
        </div>
      </main>
    </div>
  );
};

export default App;
