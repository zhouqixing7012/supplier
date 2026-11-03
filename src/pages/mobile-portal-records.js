// 会话演示单据，不对应真实采购记录。
const quoteLine = { material: 'Dell.R740', category: '服务器-服务器主机', quantity: '2', measure: '台', config: '双路处理器，32GB内存，企业级硬盘；含三年保修', grossUnit: '', rate: '', attachment: '', note: '' };
const head = { unit: '演示采购公司', buyer: '采购员甲', department: '商务采购组', phone: '13800000000', supplier: '协同门户演示供应商', contact: '演示联系人', centralType: '', contract: '', contractName: '', documentStatus: '审批中' };
export function createPortalInquiries() {
  return [
    { number: 'MOCK-INQ-001', title: '服务器采购询价', unit: head.unit, buyer: head.buyer, type: '服务器', created: '2026-11-01 09:00:00', end: '2026-11-20 23:59:59', status: '待处理', inquiryStatus: '询价中', way: '邀请', rate: '', attachment: '', remark: '请核对配置与交付要求', lines: [{ ...quoteLine }, { ...quoteLine, material: '服务器扩展内存', quantity: '4', measure: '条', category: '服务器备件', config: '32GB ECC内存' }] },
    { number: 'MOCK-INQ-002', title: '办公设备询价', unit: head.unit, buyer: '采购员乙', type: '电子设备', created: '2026-10-01 09:00:00', end: '2026-10-20 23:59:59', status: '已处理', inquiryStatus: '定价完成', way: '邀请', rate: '13', attachment: '', remark: '按配置要求报价', lines: [{ ...quoteLine, material: '办公显示器', category: '电子设备-显示器', quantity: '10', config: '27英寸', grossUnit: '1000', rate: '13', note: '含运费及安装' }] },
  ];
}
export function createPortalOrders() {
  return [
    { ...head, number: 'DEMO-ORDER-001', type: '服务器', created: '2026-11-01 09:00:00', end: '2026-11-15 18:00:00', status: '待处理', gross: '77364', lines: [{ material: 'DEMO-MATERIAL-001', name: 'Dell.R740', category: '服务器-服务器主机', quantity: '2', grossUnit: '38682', netUnit: '', rate: '', tax: '', net: '', gross: '77364' }] },
    { ...head, number: 'DEMO-ORDER-002', type: '服务器备件', created: '2026-10-15 17:27:38', end: '2026-10-30 18:00:00', status: '已处理', gross: '4000', lines: [{ material: 'DEMO-MATERIAL-002', name: 'IBM.X3650 M2', category: '服务器-服务器主机', quantity: '4', grossUnit: '1000', netUnit: '990.09900990099', rate: '1', tax: '39.60', net: '3960.40', gross: '4000.00' }] },
  ];
}
