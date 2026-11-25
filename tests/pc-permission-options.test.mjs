import assert from 'node:assert/strict';
import test from 'node:test';
import { permissionGroups } from '../src/pages/mobile-data.js';
import { pcPermissionGroups } from '../src/pc/permission-options.js';

test('PC权限目录新增新媒体版权及对应分类', () => {
  assert.deepEqual(pcPermissionGroups['新媒体版权'], ['免费类', '采购类']);
});

test('新媒体版权权限只扩展PC目录，不改变移动端共享目录', () => {
  assert.equal(Object.hasOwn(permissionGroups, '新媒体版权'), false);
  assert.deepEqual(
    Object.keys(pcPermissionGroups),
    [...Object.keys(permissionGroups), '新媒体版权'],
  );
});
