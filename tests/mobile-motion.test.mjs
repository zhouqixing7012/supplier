import test from 'node:test';
import assert from 'node:assert/strict';
import { routeMotion, swipeTarget } from '../src/pages/mobile-motion.js';

test('层级前进返回与浏览器后退方向', () => {
  assert.equal(routeMotion('query', 'detail'), 'forward');
  assert.equal(routeMotion('detail', 'query'), 'back');
  assert.equal(routeMotion('rating-edit', 'rating-detail', true), 'back');
  assert.equal(routeMotion('workspace-account-email', 'workspace-home'), 'back');
});
test('同级底栏淡入，管理页签按顺序切换，查询参数不制造层级', () => {
  assert.equal(routeMotion('workspace-home', 'workspace-account'), 'fade');
  assert.equal(routeMotion('query', 'mine'), 'tab-next');
  assert.equal(routeMotion('ratings', 'my-ratings'), 'tab-prev');
  assert.equal(routeMotion('workspace-info?edit=1', 'workspace-info'), 'fade');
});
test('滑动阈值、纵向保护及边界回弹', () => {
  assert.equal(swipeTarget(1, 4, -100, 10, 200), 2);
  assert.equal(swipeTarget(1, 4, 100, 10, 200), 0);
  assert.equal(swipeTarget(1, 4, 40, 0, 200), 1);
  assert.equal(swipeTarget(1, 4, 100, 90, 200), 1);
  assert.equal(swipeTarget(1, 4, 100, 0, 1000), 1);
  assert.equal(swipeTarget(0, 4, 100, 0, 200), 0);
  assert.equal(swipeTarget(3, 4, -100, 0, 200), 3);
});
