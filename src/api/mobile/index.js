import { createMockManagement } from './mock-management.js';
import { createPortalMockApi } from './mock-portal.js';
import { createManagementHttpApi } from './http-management.js';
import { createPortalHttpApi } from './http-portal.js';
import { createMobileRequest } from './request.js';

export { MobileApiError } from './request.js';
export { mobileFileApi } from './host-files.js';

// 每次挂载独立创建会话，避免原型导图节点共享业务记录。
export function createMobileMockApi(options) {
  const management = createMockManagement(options);
  return { management, portal: createPortalMockApi(management) };
}

// 当前用于按契约联调，页面仍由本地会话 API 提供完整演示。
export function createMobileHttpApi(configuration) {
  const request = createMobileRequest(configuration);
  return { management: createManagementHttpApi(request), portal: createPortalHttpApi(request) };
}
