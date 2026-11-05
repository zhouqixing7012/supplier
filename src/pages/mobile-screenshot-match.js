import { screenshotScenes } from './mobile-data.js';

// 同一页面的历史空态、填写态作为候选；弹层与办理步骤优先于基础路由。
export function matchScreenshots(state = {}) {
  const { scene = '', shotTime, filtering, expanded, batch, sheet, exportOpen, tip,
    showBankForm, permissionForm, peoplePicker, newInviter, addressOpen, registerBankPicker,
    isRegistration, step, contacts = 0, registerBanks = 0, bankSelected, portalEmail, passwordScreen } = state;
  let scenes = [scene];
  if (scene === 'query') scenes = ['query-old', 'query-changing'];
  if (scene === 'detail-approval') scenes = ['detail-approval-empty'];
  if (scene === 'my-ratings') scenes = ['ratings'];
  if (scene === 'invite-again') scenes = ['invite'];
  if (scene === 'bank-application-form') scenes = ['application-empty'];
  if (scene.startsWith('portal')) scenes = passwordScreen ? [] : [portalEmail ? 'portal-email' : 'portal'];
  if (isRegistration) scenes = step === 0 ? ['register-basic-filled'] : step === 1
    ? [contacts ? 'register-contacts' : 'register-contacts-empty']
    : step === 2 ? [registerBanks ? 'register-banks' : 'register-banks-empty', ...(!registerBanks ? ['register-banks-deleted'] : [])] : [];
  if (['expiry', 'address', 'region'].includes(scene)) scenes = [scene];
  if (scene.startsWith('inviter') && scene !== 'inviter-batch') scenes = [newInviter ? 'inviter-selected' : 'inviter'];
  if (scene.startsWith('query') || scene.startsWith('mine')) {
    if (batch) scenes = [scene.startsWith('mine') ? 'mine-batch' : 'query-batch'];
    else if (expanded) scenes = ['query-add', 'query-export'];
  }
  if (showBankForm || registerBankPicker) scenes = [bankSelected ? 'bank-form-selected' : 'bank-form'];
  if (permissionForm) scenes = ['permission-form'];
  if (peoplePicker) scenes = ['people-empty', 'people'];
  if (addressOpen || scene === 'address') scenes = ['address', 'region'];
  if (filtering) scenes = ['filter'];
  if (sheet === 'more') scenes = ['query-more'];
  if (exportOpen) scenes = ['export'];
  if (tip) scenes = [scene.startsWith('bank') ? 'bank-tip' : 'approval-tip'];
  const matches = screenshotScenes.filter(shot => scenes.includes(shot.scene));
  // 独立截图入口在没有切换步骤或打开其他层时优先选中原图。
  return matches.sort((a, b) => Number(b.time === shotTime) - Number(a.time === shotTime) || scenes.indexOf(a.scene) - scenes.indexOf(b.scene) || a.index - b.index);
}

export function screenshotFromFilename(name) {
  return screenshotScenes.find(shot => shot.filename.toLowerCase() === name.toLowerCase()) || null;
}
