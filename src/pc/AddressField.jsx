import React from 'react';
import { Cascader, Input } from 'antd-pc';
import { regionData } from '../pages/registration-regions.js';

const regionOptions = Object.entries(regionData).map(([province, cities]) => ({
  value: province,
  label: province,
  children: Object.entries(cities).map(([city, districts]) => ({
    value: city,
    label: city,
    children: districts.map((district) => ({ value: district, label: district })),
  })),
}));

export function readRegistrationAddress(value) {
  const [region, ...detail] = typeof value === 'string' ? value.split(' ') : [];
  const savedRegion = typeof value === 'string' ? region : value?.region;
  const legacyDistrict = { haidian: '海淀区', chaoyang: '朝阳区' }[savedRegion];
  let parts = legacyDistrict ? ['北京市', '北京市', legacyDistrict] : (savedRegion || '').split('/');
  if (parts.length === 2 && regionData[parts[0]]?.[parts[0]]) parts = [parts[0], ...parts];
  const [province, city, district] = parts;
  const validRegion = parts.length === 3 && regionData[province]?.[city]?.includes(district);
  return {
    region: validRegion ? parts.join('/') : undefined,
    detail: typeof value === 'string' ? (validRegion ? detail.join(' ') : value) : value?.detail || '',
  };
}

export default function AddressField({ value, onChange, ...props }) {
  const address = readRegistrationAddress(value);
  return <div className="pc-register-address">
    <Cascader {...props} className="pc-register-region" aria-label="省市区"
      classNames={{ popup: { root: 'pc-register-picker-popup pc-register-region-popup' } }}
      value={address.region?.split('/')} options={regionOptions} showSearch placeholder="请选择省 / 市 / 区县"
      displayRender={(labels) => labels.filter((label, index) => label !== labels[index - 1]).join(' / ')}
      onChange={(parts) => onChange?.({ ...address, region: parts?.join('/') || undefined })} />
    <Input aria-label="详细地址" value={address.detail} placeholder="请输入街道、门牌号等详细地址" maxLength={50}
      onChange={(event) => onChange?.({ ...address, detail: event.target.value })} />
  </div>;
}
export const addressText = (value) => typeof value === 'string' ? value : [value?.region, value?.detail?.trim()].filter(Boolean).join(' ');
export const addressRules = [{ required: true, validator: (_, value) => {
  const address = readRegistrationAddress(value);
  return address.region && address.detail?.trim() ? Promise.resolve()
    : Promise.reject(new Error(address.region ? '请输入详细地址' : '请选择省 / 市 / 区县'));
} }];
