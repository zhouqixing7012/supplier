import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const pageSize = 20;
const pullThreshold = 64;
const interactive = 'input, textarea, select, button, a, label, [role="dialog"], [data-no-swipe]';

export function QueryList({ records, queryKey, header, view, enabled = true, children }) {
  const [limit, setLimit] = useState(() => view?.queryKey === queryKey ? view?.limit ?? pageSize : pageSize);
  const [phase, setPhase] = useState('');
  const [pull, setPull] = useState(0);
  const list = useRef(null);
  const tail = useRef(null);
  const frame = useRef(0);
  const lastQuery = useRef(queryKey);
  const currentLimit = lastQuery.current === queryKey ? limit : pageSize;
  const hasMore = enabled && currentLimit < records.length;

  useLayoutEffect(() => {
    if (lastQuery.current === queryKey) return;
    lastQuery.current = queryKey;
    setLimit(pageSize);
    setPhase('');
    setPull(0);
    if (enabled) window.scrollTo(0, 0);
  }, [queryKey, enabled]);

  useEffect(() => {
    if (enabled && view) Object.assign(view, { queryKey, limit: currentLimit });
  }, [view, queryKey, currentLimit, enabled]);

  useLayoutEffect(() => () => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, [queryKey, enabled]);

  const update = useCallback(mode => {
    if (frame.current || (mode === 'more' && !hasMore) || list.current?.closest('[inert]')) return;
    setPhase(mode);
    // 原型从当前查询的数据源读取下一页，先让查询状态绘制一帧。
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        setLimit(old => mode === 'refresh' ? pageSize : old + pageSize);
        setPhase('');
      });
    });
  }, [hasMore]);

  useEffect(() => {
    if (!hasMore || !tail.current || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) update('more');
    }, { threshold: 1 });
    observer.observe(tail.current);
    return () => observer.disconnect();
  }, [hasMore, currentLimit, update]);

  useEffect(() => {
    const node = list.current;
    if (!enabled || !node) return;
    let start = null;
    let distance = 0;
    const atTop = () => window.scrollY <= 1;
    const cancel = () => { start = null; distance = 0; setPull(0); };
    const begin = event => {
      if (event.touches.length !== 1) return cancel();
      if (frame.current || !atTop()) return;
      const point = event.touches[0];
      const target = event.isTrusted ? document.elementFromPoint(point.clientX, point.clientY) || event.target : event.target;
      if (!node.contains(target) || target.closest(interactive)) return;
      const bounds = node.getBoundingClientRect();
      if (point.clientX < bounds.left + 24 || point.clientX > bounds.right - 24) return;
      start = { x: point.clientX, y: point.clientY };
    };
    const move = event => {
      if (!start) return;
      if (event.touches.length !== 1 || !atTop()) return cancel();
      const point = event.touches[0];
      const dx = Math.abs(point.clientX - start.x);
      const dy = point.clientY - start.y;
      if (dy < -8 || (dx > 10 && dx >= Math.abs(dy))) return cancel();
      if (dy < 8 || dy < dx * 1.25) {
        if (distance) { distance = 0; setPull(0); }
        return;
      }
      if (event.cancelable) event.preventDefault();
      distance = dy;
      setPull(Math.min(48, dy / 1.6));
    };
    const end = () => {
      if (start && atTop() && distance >= pullThreshold) update('refresh');
      cancel();
    };
    node.addEventListener('touchstart', begin, { passive: true });
    node.addEventListener('touchmove', move, { passive: false });
    node.addEventListener('touchend', end);
    node.addEventListener('touchcancel', cancel);
    return () => {
      node.removeEventListener('touchstart', begin);
      node.removeEventListener('touchmove', move);
      node.removeEventListener('touchend', end);
      node.removeEventListener('touchcancel', cancel);
    };
  }, [enabled, update]);

  if (!enabled) return <>{header}{children(records)}</>;
  const refreshing = phase === 'refresh';
  const refreshLabel = refreshing ? '正在刷新…' : pull >= pullThreshold / 1.6 ? '松开刷新' : '下拉刷新';
  return <>
    {header}
    <div className="m-query-list" ref={list}>
      {(pull > 0 || refreshing) && <div className="m-list-refresh" role="status"
        style={{ height: refreshing ? 44 : pull }}>{refreshLabel}</div>}
      {children(records.slice(0, currentLimit))}
      {hasMore && <div className="m-list-more" ref={tail}>
        <button type="button" disabled={!!phase} onClick={() => update('more')}>{phase === 'more' ? '加载中…' : '加载更多'}</button>
      </div>}
      {!hasMore && currentLimit > pageSize && records.length > 0 && <p className="m-list-end" role="status">已加载全部</p>}
    </div>
  </>;
}
