import { createMockManagement } from './mock-management.js';
import { createPortalMockApi } from './mock-portal.js';

// 每次挂载独立创建会话。
export function createMobileMockApi() {
  return { management: createMockManagement(), portal: createPortalMockApi() };
}
