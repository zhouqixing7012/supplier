import React, { createContext, useContext } from 'react';
import { theme } from 'antd-pc';

const DEFAULT_COLUMNS = 3;
const DEFAULT_LABEL_WIDTH = 96;
const DetailGridContext = createContext({ columns: DEFAULT_COLUMNS });
const DetailGridSlotContext = createContext(null);

function normalizeColumns(columns) {
  return Math.max(1, Math.floor(Number(columns) || DEFAULT_COLUMNS));
}

function normalizeSpan(span, columns) {
  const numericSpan = Math.max(1, Math.floor(Number(span) || 1));
  return Math.min(numericSpan, columns);
}

// 展开声明式字段，保留稳定 key，跨行重排不卸载可编辑控件。
function detailChildren(children, prefix = '') {
  const items = [];
  React.Children.toArray(children).forEach((child, index) => {
    const key = `${prefix}${React.isValidElement(child) ? child.key : index}`;
    if (React.isValidElement(child) && child.type === React.Fragment) items.push(...detailChildren(child.props.children, `${key}/`));
    else items.push({ child, key });
  });
  return items;
}

// 显式跨度保持不变；只扩展默认字段，剩余空位补有边框的真实网格。
function layoutDetailChildren(children, columns, completeRows) {
  const rows = [];
  let row = [], used = 0;
  const finishRow = () => {
    if (!row.length) return;
    const remaining = columns - used;
    if (completeRows && remaining > 0) {
      const last = row[row.length - 1];
      if (!last.explicit && !last.spacer && React.isValidElement(last.child) && typeof last.child.type !== 'string') last.span += remaining;
      else row.push({ filler: true, span: remaining });
    }
    rows.push(row); row = []; used = 0;
  };
  detailChildren(children).forEach(({ child, key }) => {
    const element = React.isValidElement(child);
    const spacer = element && typeof child.type === 'string' && child.props['aria-hidden'] && !child.props.children;
    const spacerTracks = spacer && /^span (\d+)$/.exec(child.props.style?.gridColumn || '');
    const span = normalizeSpan(spacerTracks ? Math.ceil(Number(spacerTracks[1]) / 2) : element ? child.props.span : columns, columns);
    if (used + span > columns) finishRow();
    row.push({ child, key, span, spacer, explicit: spacer || (element && child.props.span != null) });
    used += span;
    if (used === columns) finishRow();
  });
  finishRow();
  return rows;
}

function toCssWidth(width) {
  return typeof width === 'number' ? `${width}px` : width;
}

function collectPrototypeLabelText(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectPrototypeLabelText).join('');
  if (React.isValidElement(node)) return collectPrototypeLabelText(node.props?.children);
  return '';
}

export function toPrototypeLabel(label) {
  const text = collectPrototypeLabelText(label).replace(/\s+/g, ' ').trim();
  if (!text) return undefined;
  return text
    .replace(/^[*＊]\s*/, '')
    .replace(/[:：]\s*$/, '')
    .trim() || undefined;
}

export function DetailGrid({
  children,
  columns = DEFAULT_COLUMNS,
  labelWidth = DEFAULT_LABEL_WIDTH,
  minWidth,
  className = '',
  completeRows = true,
}) {
  const { token } = theme.useToken();
  const normalizedColumns = normalizeColumns(columns);
  const normalizedLabelWidth = toCssWidth(labelWidth);
  const templateColumns = Array.from(
    { length: normalizedColumns },
    () => `${normalizedLabelWidth} minmax(0, 1fr)`
  ).join(' ');
  const rows = layoutDetailChildren(children, normalizedColumns, completeRows);

  return (
    <div className={className || undefined} style={{ width: '100%', minWidth: 0, overflowX: minWidth ? 'auto' : undefined }}>
      <DetailGridContext.Provider value={{ columns: normalizedColumns }}>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: templateColumns,
            minWidth,
            margin: 0,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            borderLeft: `1px solid ${token.colorBorderSecondary}`,
            fontSize: token.fontSize,
            lineHeight: token.lineHeight,
          }}
        >
          {rows.flatMap((row, rowIndex) => {
            let column = 1;
            return row.map((item, index) => {
              const start = column;
              column += item.span * 2;
              const key = item.key ?? `filler-${rowIndex}-${index}`;
              if (item.filler || item.spacer) {
                const style = {
                  ...(item.spacer ? item.child.props.style : {}), gridColumn: `${start} / span ${item.span * 2}`, gridRow: rowIndex + 1,
                  borderRight: `1px solid ${token.colorBorderSecondary}`, borderBottom: `1px solid ${token.colorBorderSecondary}`,
                  minWidth: 0, background: token.colorBgContainer,
                };
                return item.spacer ? React.cloneElement(item.child, { key, style })
                  : <div key={key} aria-hidden="true" data-detail-grid-filler style={style} />;
              }
              return <DetailGridSlotContext.Provider key={key} value={{ span: item.span, column: start, row: rowIndex + 1 }}>{item.child}</DetailGridSlotContext.Provider>;
            });
          })}
        </dl>
      </DetailGridContext.Provider>
    </div>
  );
}

export function DetailItem({ label, children, span = 1 }) {
  const { token } = theme.useToken();
  const { columns } = useContext(DetailGridContext);
  const slot = useContext(DetailGridSlotContext);
  const normalizedSpan = normalizeSpan(slot?.span ?? span, columns);
  const valueColumnSpan = normalizedSpan * 2 - 1;
  const isFullRow = normalizedSpan === columns;
  const prototypeLabel = toPrototypeLabel(label);
  const cellBaseStyle = {
    padding: `${token.paddingXS}px ${token.paddingSM}px`,
    margin: 0,
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <>
      <dt
        data-prototype-bindable="detail-field"
        data-prototype-label={prototypeLabel}
        title={prototypeLabel}
        style={{
          ...cellBaseStyle,
          gridColumn: isFullRow ? '1 / 2' : slot ? `${slot.column} / span 1` : undefined,
          gridRow: slot?.row,
          background: token.colorFillAlter,
          color: token.colorText,
          fontWeight: 400,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </dt>
      <dd
        data-prototype-detail-value={prototypeLabel}
        style={{
          ...cellBaseStyle,
          gridColumn: isFullRow ? '2 / -1' : `span ${valueColumnSpan}`,
          gridRow: slot?.row,
          background: token.colorBgContainer,
          color: token.colorText,
          overflowWrap: 'anywhere',
        }}
      >
        <div style={{ minWidth: 0, width: '100%' }}>{children}</div>
      </dd>
    </>
  );
}

export default DetailGrid;
