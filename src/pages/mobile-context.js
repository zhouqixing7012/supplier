import { createContext, useContext, useEffect, useRef } from 'react';

// 上下文与表单、弹层模块解耦，热更新时保持提供者与使用者身份一致。
export const InteractionContext = createContext(null);

export function useBackLayer(active, close) {
  const layers = useContext(InteractionContext)?.layers;
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!active || !layers) return;
    const entry = () => closeRef.current();
    layers.current.push(entry);
    return () => { layers.current = layers.current.filter(x => x !== entry); };
  }, [active, layers]);
}
