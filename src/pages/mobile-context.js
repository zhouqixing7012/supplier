import { createContext } from 'react';

// 上下文与表单、弹层模块解耦，热更新时保持提供者与使用者身份一致。
export const InteractionContext = createContext(null);
