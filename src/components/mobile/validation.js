export const fieldIssue = (field, message) => ({ field, message });

const pending = new WeakMap();

// 先等表单挂载，再定位当前页面或最上层办理面板内的字段。
export function focusFormError(issue = {}) {
  const page = document.querySelector('#root .mobile-page');
  if (!page) return;
  const request = {};
  pending.set(page, request);
  requestAnimationFrame(() => {
    if (!page.isConnected || pending.get(page) !== request) return;
    const scope = [...page.querySelectorAll('.m-overlay, .m-fullscreen-panel')]
      .filter(node => !node.closest('[inert]') && node.getClientRects().length).at(-1) || page;
    const fields = [...scope.querySelectorAll('[data-field-label]')];
    let target = fields.find(node => node.dataset.fieldLabel === issue.field);
    if (!issue.field && issue.message) {
      target = fields.filter(node => issue.message.includes(node.dataset.fieldLabel))
        .sort((a, b) => b.dataset.fieldLabel.length - a.dataset.fieldLabel.length)[0];
    }
    if (!target && !issue.field) {
      const invalid = [...scope.querySelectorAll('[aria-invalid="true"]')].find(node =>
        !issue.message || node.getAttribute('aria-describedby')?.split(/\s+/)
          .some(id => document.getElementById(id)?.textContent === issue.message));
      target = invalid?.closest('[data-field-label]') || invalid;
    }
    if (!target) return;
    const collapsed = target.closest('.m-section-reveal[data-open="false"]');
    window.dispatchEvent(new CustomEvent('mobile-validation', { detail: { target, message: issue.message } }));
    requestAnimationFrame(async () => {
      if (collapsed) await Promise.allSettled((collapsed.getAnimations?.() || []).map(animation => animation.finished));
      if (pending.get(page) !== request || !target.isConnected || target.closest('[inert]')) return;
      const control = target.matches('button, input, textarea, [tabindex]') ? target
        : target.querySelector('[data-validation-control], input:not([type="file"]), textarea, .m-select-field');
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      control?.focus({ preventScroll: true });
    });
  });
}
