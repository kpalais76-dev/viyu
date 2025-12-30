// index.js

// --- 1. 钓法配置常量 (The Knowledge Base) ---
// 这就是你的 EAV 模型中的 "Schema" 定义
const FISHING_METHODS = {
  taidiao: {
    id: 'taidiao',
    name: '台钓·平衡',
    desc: '一钩一漂，方寸之间',
    // 动态字段定义 (Attributes)
    fields: [
      { key: 'rod_length', label: '竿长', type: 'select', options: ['3.6m', '3.9m', '4.5m', '5.4m', '6.3m', '7.2m'] },
      { key: 'line_group', label: '线组', type: 'input', placeholder: '例: 1.5主+0.8子' },
      { key: 'float_lead', label: '吃铅', type: 'number', unit: 'g', placeholder: '浮漂吃铅量' },
      { key: 'tuning', label: '调钓', type: 'input', placeholder: '例: 调4钓2' }
    ],
    // 技法标签
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
      { key: 'lure_weight', label: '饵重', type: 'number', unit: 'g', placeholder: '用于物理校验' }, // 增加此字段用于物理校验
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

Page({
  data: {
    // 页面状态
    methodKeys: ['taidiao', 'lure', 'iso', 'traditional'], // 所有的 Key
    currentMethod: 'taidiao', // 当前选中的钓法 Key
    currentMethodInfo: {},    // 当前钓法的静态信息 (name, desc)
    
    // EAV 动态数据
    dynamicFormFields: [], // 渲染用的配置数组 (Attributes)
    formData: {},          // 用户填写的实际数据 (Values)
    selectedTags: [],      // 用户选中的标签
    
    // 物理警告
    warningMsg: "" 
  },

  onLoad() {
    // 初始化默认钓法
    this.switchMethod('taidiao');
  },

  // --- 2. 核心切换逻辑 (Switch Method) ---
  switchMethod(methodKey) {
    if (typeof methodKey !== 'string') {
      // 如果是通过点击事件触发，取 dataset
      methodKey = methodKey.currentTarget.dataset.key;
    }

    const config = FISHING_METHODS[methodKey];

    this.setData({
      currentMethod: methodKey,
      currentMethodInfo: { name: config.name, desc: config.desc },
      // 重置表单配置
      dynamicFormFields: config.fields,
      availableTags: config.tags,
      // 清空旧数据
      formData: {},
      selectedTags: [],
      warningMsg: ""
    });

    wx.vibrateShort({ type: 'light' }); // 切换时的触感反馈
  },

  // --- 3. 通用输入处理 (Dynamic Input Handler) ---
  handleFieldChange(e) {
    const key = e.currentTarget.dataset.key;
    const val = e.detail.value;
    
    // 如果是 select (picker)，需要把 index 转换成具体的值
    const fieldConfig = this.data.dynamicFormFields.find(f => f.key === key);
    let finalVal = val;
    if (fieldConfig.type === 'select') {
      finalVal = fieldConfig.options[val];
    }

    // 更新 formData (局部更新)
    this.setData({
      [`formData.${key}`]: finalVal
    });

    // 实时触发物理校验
    this.validateGear(this.data.currentMethod, this.data.formData);
  },

  handleTagToggle(e) {
    const tag = e.currentTarget.dataset.tag;
    const { selectedTags } = this.data;
    const index = selectedTags.indexOf(tag);

    if (index > -1) {
      selectedTags.splice(index, 1); // 反选
    } else {
      selectedTags.push(tag); // 选中
    }
    this.setData({ selectedTags });
  },

  // --- 4. 模拟物理校验 (Physics Logic) ---
  validateGear(method, gearData) {
    let warning = "";

    // 逻辑 A: 路亚竿饵匹配校验
    if (method === 'lure') {
      const power = gearData.rod_power; // 比如 "UL (马口)"
      const weight = parseFloat(gearData.lure_weight); // 比如 15

      // 简单判断逻辑：UL 杆不建议抛 > 10g，XH 杆不建议抛 < 5g
      if (power && power.startsWith('UL') && weight > 10) {
        warning = "⚠️ 警告：马口竿(UL)抛投过重饵料(>10g)，存在断竿风险！";
      } else if (power && power.startsWith('XH') && weight < 5) {
        warning = "💡 提示：雷强竿(XH)抛投微物，可能无法抛出距离。";
      }
    }

    // 逻辑 B: 台钓线组平衡校验 (示例)
    if (method === 'taidiao') {
       // 这里可以写正则解析 "1.5+0.8" 这种字符串
       // 简单模拟：如果只填了主线没填子线
       if (gearData.line_group && !gearData.line_group.includes('+')) {
         warning = "💡 提示：建议记录完整线组，格式如 '2.0+1.0'";
       }
    }

    this.setData({ warningMsg: warning });
    
    // 如果有严重警告，震动提醒
    if (warning.startsWith('⚠️')) {
      wx.vibrateLong(); 
    }
  }
});