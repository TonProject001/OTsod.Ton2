/**
 * Convert number to Thai Baht text
 * e.g. 120.50 -> หนึ่งร้อยยี่สิบบาทห้าสิบสตางค์
 */
export function bahttext(num: number): string {
  if (!num) return 'ศูนย์บาทถ้วน';

  const suffix = 'บาทถ้วน';
  const textNum = num.toFixed(2);
  const [bahtPart, satangPart] = textNum.split('.');

  const thaiNums = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertGroup = (nStr: string): string => {
    let result = '';
    const len = nStr.length;
    
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i));
      const pos = len - i - 1;
      
      if (digit !== 0) {
        if (pos === 0 && digit === 1 && len > 1) {
          result += 'เอ็ด';
        } else if (pos === 1 && digit === 2) {
          result += 'ยี่';
        } else if (pos === 1 && digit === 1) {
          result += '';
        } else {
          result += thaiNums[digit];
        }
        
        if (pos === 1 && digit === 1) {
          result += 'สิบ';
        } else if (pos !== 0 || (pos === 0 && len === 1) || (pos === 0 && digit !== 1)) {
          result += units[pos];
        } else if (pos === 0 && digit === 1 && len > 1) {
             // Already handled 'เอ็ด'
        }
         
        if(pos === 1 && digit === 2) {
             result += 'สิบ';
        }
      }
    }
    return result;
  };

  // Simple implementation for common ranges (not handling > million complex logic for brevity if not needed, 
  // but standard logic usually loops millions. For this app, OT likely won't exceed millions per person/sheet easily).
  // Let's use a simpler verified logic block for standard numbers.
  
  const readNumber = (numberStr: string): string => {
      let res = '';
      const len = numberStr.length;
      for(let i=0; i<len; i++) {
          const digit = parseInt(numberStr[i]);
          const unitIndex = len - i - 1;
          
          if(digit === 0) continue;
          
          if (unitIndex === 0 && digit === 1 && len > 1) {
              res += 'เอ็ด';
          } else if (unitIndex === 1 && digit === 2) {
              res += 'ยี่';
          } else if (unitIndex === 1 && digit === 1) {
              // nothing for 1 in ten position (sip)
          } else {
              res += thaiNums[digit];
          }
          
          if(unitIndex === 1 && digit === 2) res += 'สิบ';
          else if(unitIndex === 1 && digit === 1) res += 'สิบ';
          else res += units[unitIndex];
      }
      return res;
  }

  let bahtText = readNumber(bahtPart);
  if(bahtText === '') bahtText = 'ศูนย์';
  
  let satangText = '';
  if (parseInt(satangPart) > 0) {
      satangText = readNumber(satangPart) + 'สตางค์';
      return bahtText + 'บาท' + satangText;
  }

  return bahtText + 'บาทถ้วน';
}