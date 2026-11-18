export function middleEllipsis(value, limit) {
  const chars = Array.from(value || '');
  if (chars.length <= limit) return value || '';
  const extension = (value || '').match(/\.[^.]+$/)?.[0] || '';
  const extensionLength = Math.min(12, Array.from(extension).length);
  const available = Math.max(extensionLength + 1, 2, limit - 3);
  const tail = Math.min(12, available - 1, Math.max(extensionLength, 1, Math.floor(available * .4)));
  return chars.slice(0, available - tail).join('') + '...' + chars.slice(-tail).join('');
}
