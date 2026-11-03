import test from 'node:test';
import assert from 'node:assert/strict';
import { isSpreadsheetName, spreadsheetAccept } from '../src/pages/mobile-portal-files.js';

test('账单文件限制xls/xlsx，支持大写扩展名，拒绝图片及双重扩展名', () => {
  assert.equal(spreadsheetAccept, '.xls,.xlsx');
  for (const name of ['酒店账单.xls', '飞机账单.xlsx', '账单.XLSX']) assert.equal(isSpreadsheetName(name), true);
  for (const name of ['', '账单.png', '账单.csv', '账单.xlsx.exe', '账单.xls.png']) assert.equal(isSpreadsheetName(name), false);
});
