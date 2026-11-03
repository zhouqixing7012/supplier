import test from 'node:test';
import assert from 'node:assert/strict';
import { routeMotion, swipeTarget, resolveMotion, captureScrollPositions, restoreScrollPositions } from '../src/pages/mobile-motion.js';

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


test('嵌套返回和页签选择覆盖记录或关闭动效', () => {
  assert.equal(resolveMotion('record', 'back'), 'back');
  assert.equal(resolveMotion('sheet-close', 'tab-next'), 'tab-next');
  assert.equal(resolveMotion('fade', 'forward'), 'forward');
});
test('关闭弹层保留页面方向，同级请求采用最后一次方向', () => {
  assert.equal(resolveMotion('back', 'sheet-close'), 'back');
  assert.equal(resolveMotion('tab-next', 'fade'), 'tab-next');
  assert.equal(resolveMotion('forward', 'back'), 'back');
});
test('视觉副本恢复根节点和嵌套纵横滚动', () => {
  const child = { children: [], scrollTop: 240, scrollLeft: 16 };
  const source = { children: [child], scrollTop: 80, scrollLeft: 0 };
  const copyChild = { children: [], isConnected: true, scrollTop: 0, scrollLeft: 0 };
  const copy = { children: [copyChild], isConnected: true, scrollTop: 0, scrollLeft: 0 };
  const positions = captureScrollPositions(source, copy);
  restoreScrollPositions(positions);
  assert.equal(copy.scrollTop, 80);
  assert.equal(copyChild.scrollTop, 240);
  assert.equal(copyChild.scrollLeft, 16);
});
test('已经移除的控件不恢复滚动，未滚动节点不记录', () => {
  const copy = { children: [], isConnected: false, scrollTop: 0 };
  restoreScrollPositions(captureScrollPositions({ children: [], scrollTop: 80, scrollLeft: 0 }, copy));
  assert.equal(copy.scrollTop, 0);
  assert.deepEqual(captureScrollPositions({ children: [], scrollTop: 0, scrollLeft: 0 }, copy), []);
});
