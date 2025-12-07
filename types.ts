export interface RawRecord {
  name: string;
  timestamp: Date;
}

export interface OTRecord {
  date: string; // dd/mm/yyyy
  rawDateObj: Date;
  type: 'วันปกติ' | 'วันหยุด';
  otPeriod: string;
  startTime: string; // HH:mm for Table
  endTime: string; // HH:mm for Table
  hours: number;
  pay: number;
}

export interface PersonResult {
  name: string;
  totalPay: number;
  records: OTRecord[];
}

export interface CalculationResult {
  summary: { name: string; totalPay: number }[];
  details: Record<string, OTRecord[]>;
}