// 同级导航与层级页面分别表达，返回方向优先使用历史记录。
export const managementRoutes = ['query', 'mine', 'my-ratings', 'ratings', 'rating-ops', 'bank-application'];
const portalRoots = ['workspace-home', 'workspace-tasks', 'workspace-account'];
const scene = route => route.split('?')[0];
export function routeMotion(from, to, returning = false) {
  from = scene(from); to = scene(to);
  if (from === to) return 'fade';
  if (portalRoots.includes(from) && portalRoots.includes(to)) return 'fade';
  if (managementRoutes.includes(from) && managementRoutes.includes(to)) return managementRoutes.indexOf(to) > managementRoutes.indexOf(from) ? 'tab-next' : 'tab-prev';
  if (returning || managementRoutes.includes(to) || portalRoots.includes(to) || (/^(detail|workspace-info)/.test(to) && /edit|bank|permission|workspace-changes/.test(from))) return 'back';
  return 'forward';
}
export function swipeTarget(active, count, dx, dy, elapsed) {
  if (elapsed > 900 || Math.abs(dx) < 65 || Math.abs(dx) < Math.abs(dy) * 1.6) return active;
  return Math.max(0, Math.min(count - 1, active + (dx < 0 ? 1 : -1)));
}

// 嵌套操作中，页面方向优先于关闭弹层和记录反馈。
export function resolveMotion(current, next) {
  const navigation = kind => ['forward', 'back', 'tab-next', 'tab-prev'].includes(kind);
  return navigation(current) && !navigation(next) ? current : next;
}
export function captureScrollPositions(source, copy) {
  const positions = [];
  const visit = (original, clone) => {
    if (original.scrollTop || original.scrollLeft) positions.push({ node: clone, top: original.scrollTop, left: original.scrollLeft });
    [...original.children].forEach((child, index) => { if (clone.children[index]) visit(child, clone.children[index]); });
  };
  visit(source, copy);
  return positions;
}
export function restoreScrollPositions(positions) {
  positions.forEach(({ node, top, left }) => { if (node.isConnected) { node.scrollTop = top; node.scrollLeft = left; } });
}
