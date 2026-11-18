// 金额以十进制整数分数计算，避免二进制浮点误差。
export const isDecimal = value => /^\d+(?:\.\d+)?$/.test(String(value));
function decimal(value) {
  if (!isDecimal(value)) throw new Error('请输入有效的非负数字');
  const [whole, part = ''] = String(value).split('.');
  return [BigInt(whole + part), 10n ** BigInt(part.length)];
}
function rounded(n, d, places) {
  const scale = 10n ** BigInt(places);
  const q = (n * scale * 2n + d) / (d * 2n);
  const digits = q.toString().padStart(places + 1, '0');
  return places ? digits.slice(0, -places) + '.' + digits.slice(-places) : digits;
}
function unitPrice(n, d) {
  if (n === 0n) return '0.00';
  let exponent = n.toString().length - d.toString().length;
  if (exponent >= 0 ? n < d * 10n ** BigInt(exponent) : n * 10n ** BigInt(-exponent) < d) exponent--;
  const places = 13 - exponent;
  // 最多14位有效数字；尾零省略，但小数至少两位。
  let result = places >= 0 ? rounded(n, d, places) : rounded(n, d * 10n ** BigInt(-places), 0) + '0'.repeat(-places);
  if (!result.includes('.')) return result + '.00';
  const [whole, part] = result.split('.');
  return whole + '.' + part.replace(/0+$/, '').padEnd(2, '0');
}
export function calculateTax(line, rate) {
  if (rate === '') return { ...line, rate, netUnit: '', tax: '', net: '' };
  const [r, rs] = decimal(rate);
  const [unit, us] = decimal(line.grossUnit);
  const [gross, gs] = decimal(line.gross);
  const divisor = 100n * rs + r;
  return { ...line, rate,
    netUnit: unitPrice(unit * 100n * rs, us * divisor),
    net: rounded(gross * 100n * rs, gs * divisor, 2),
    tax: rounded(gross * r, gs * divisor, 2),
  };
}
export function quoteError(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (!isDecimal(lines[i].grossUnit)) return `请填写第${i + 1}项有效的含税单价`;
    if (!isDecimal(lines[i].rate)) return `请填写第${i + 1}项有效的税率`;
  }
  return '';
}
export function remainingTime(item, now = Date.now()) {
  if (item.inquiryStatus === '定价完成') return '已完成';
  const delta = new Date(item.end.replace(' ', 'T')).getTime() - now;
  if (delta <= 0) return '已过期';
  const minutes = Math.floor(delta / 60000);
  return `${Math.floor(minutes / 1440)}天${Math.floor(minutes % 1440 / 60)}小时${minutes % 60}分`;
}
