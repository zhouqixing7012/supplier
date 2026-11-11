import React from 'react';

// 沿用资产系统同层级标题的 4×16px 品牌标识。
export default function SectionCardTitle({ children }) {
  return <h3 className="pc-section-card-title">
    <span className="pc-section-card-marker" aria-hidden="true" />
    <span>{children}</span>
  </h3>;
}
