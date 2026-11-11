import React, { useEffect, useRef, useState } from 'react';

export default function FixedActionBar({ className = '', children }) {
  const ref = useRef(null);
  const [hasMoreContent, setHasMoreContent] = useState(false);

  useEffect(() => {
    const scrollRegion = ref.current?.closest('[data-pc-scroll-region]');
    if (!scrollRegion) return undefined;

    const update = () => {
      const remaining = scrollRegion.scrollHeight - scrollRegion.clientHeight - scrollRegion.scrollTop;
      setHasMoreContent(remaining > 1);
    };
    const observer = new ResizeObserver(update);
    observer.observe(scrollRegion);
    const content = scrollRegion.querySelector('[data-pc-scroll-content]');
    if (content) observer.observe(content);
    scrollRegion.addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      observer.disconnect();
      scrollRegion.removeEventListener('scroll', update);
    };
  }, []);

  return <div ref={ref} className={`pc-fixed-action-bar ${className}`.trim()} data-scroll-divider={hasMoreContent}>
    {children}
  </div>;
}
