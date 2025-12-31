const FISHING_METHODS = {
  taidiao: {
    id: 'taidiao',
    name: '台钓·平衡',
    desc: '一钩一漂，方寸之间',
    fields: [
      { key: 'rod_length', label: '竿长', type: 'select', options: ['3.6m', '3.9m', '4.5m', '5.4m', '6.3m', '7.2m'] },
      { key: 'line_group', label: '线组', type: 'input', placeholder: '例: 1.5主+0.8子' },
      { key: 'float_lead', label: '吃铅', type: 'number', unit: 'g', placeholder: '浮漂吃铅量' },
      { key: 'tuning', label: '调钓', type: 'input', placeholder: '例: 调4钓2' }
    ],
    tags: ["顿口", "顶漂", "截口", "黑漂", "走水"]
  },
  lure: {
    id: 'lure',
    name: '路亚·匹配',
    desc: '拟饵触底，竿尖传导',
    fields: [
      { key: 'rod_power', label: '硬度', type: 'select', options: ['UL (马口)', 'L', 'ML', 'M', 'MH', 'H', 'XH (雷强)'] },
      { key: 'reel_ratio', label: '速比', type: 'select', options: ['5.x (慢)', '6.x (泛用)', '7.x (快)', '8.x (超快)'] },
      { key: 'lure_type', label: '拟饵', type: 'input', placeholder: '例: 米诺/亮片' },
      { key: 'lure_weight', label: '饵重', type: 'number', unit: 'g', placeholder: '用于物理校验' },
      { key: 'leader_line', label: '前导', type: 'input', placeholder: '例: 2号碳线' }
    ],
    tags: ["匀收", "小抽", "跳底", "停顿", "泛搜"]
  },
  iso: {
    id: 'iso',
    name: '矶钓·流体',
    desc: '乘流而下，全层搜索',
    fields: [
      { key: 'float_b', label: '阿波', type: 'select', options: ['00', '0', 'G2', 'B', '2B', '3B', '5B', '1.0'] },
      { key: 'tide_level', label: '潮位', type: 'select', options: ['涨潮三分', '涨潮七分', '满潮', '落潮三分', '落潮七分', '干潮'] },
      { key: 'depth', label: '钓棚', type: 'input', placeholder: '例: 1.5庹 / 3米' }
    ],
    tags: ["全层", "半游动", "张线", "晃饵", "打窝"]
  },
  traditional: {
    id: 'traditional',
    name: '传统·长竿',
    desc: '长竿短线，七星伴月',
    fields: [
      { key: 'hook_type', label: '钩型', type: 'select', options: ['朝天钩', '睡钩'] },
      { key: 'star_float', label: '星漂', type: 'input', placeholder: '例: 6粒大号' },
      { key: 'straw_hole', label: '草洞', type: 'select', options: ['明水', '草边', '草洞'] }
    ],
    tags: ["逗钓", "提竿", "拖底"]
  }
};

module.exports = FISHING_METHODS;