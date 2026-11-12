import test from 'node:test';
import assert from 'node:assert/strict';
import { alignTableColumns, columnAlignment } from '../src/erp/columnAlignment.js';

// 同时验证列语义和表头、正文一致，覆盖详情页容易遗漏的字段。
for (const [column, expected] of [
  [{ title: '银行账号' }, 'left'], [{ title: '账户类型' }, 'center'],
  [{ title: '币种' }, 'center'], [{ title: '有效开始日期' }, 'center'],
  [{ title: '审批节点数', align: 'right' }, 'right'],
  [{ title: '资质等级', align: 'center' }, 'center'],
  [{ title: '操作' }, 'right'], [{ title: '序号' }, 'center'],
  [{ title: '含税金额' }, 'right'],
]) {
  test(column.title, () => {
    assert.equal(columnAlignment(column), expected);
    const [normalized] = alignTableColumns([column]);
    assert.equal(normalized.onCell().style.textAlign, expected);
    assert.equal(normalized.onHeaderCell().style.textAlign, expected);
  });
}
