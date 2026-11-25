import { permissionGroups } from '../pages/mobile-data.js';

// PC 管理平台使用独立权限目录，避免影响移动端的权限选项。
export const pcPermissionGroups = {
  ...permissionGroups,
  '新媒体版权': ['免费类', '采购类'],
};
