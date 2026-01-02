// pages/gear/form/index.js
const db = wx.cloud.database();
const { FISHING_METHODS } = require('../../../utils/constants.js');

// --- 行业标准参数字典 (Expert Mode: 全场景覆盖版) ---
const STD_PARAMS = {
  // 竿长: 覆盖溪流微物(1.37m) -> 路亚 -> 矶钓(5.3m) -> 炮竿(10m+)
  ROD_LENGTH: [
    '1.37m (46)', '1.52m (50)', '1.68m (56)', '1.83m (60)', '1.98m (66)', '2.13m (70)', 
    '2.28m (76)', '2.44m (80)', '2.59m (86)', '2.74m (90)', '2.90m (96)', '3.05m (100)',
    '3.6m', '3.9m', '4.5m', '5.3m (矶钓标准)', '5.4m', '6.3m', '7.2m', '8.1m', '9.0m', '10m+', '13m+'
  ],
  
  // 竿硬度: 覆盖微物(XUL) -> 雷强/巨物(XXXH)
  ROD_POWER: [
    'XUL (极软)', 'UL (超软)', 'L (软)', 'ML (中软)', 'M (中)', 
    'MH (中硬)', 'H (硬)', 'XH (超硬)', 'XXH (暴力)', 'XXXH (巨物)'
  ],
  
  // 竿调性
  ROD_ACTION: ['S (慢调)', 'MR (中慢)', 'R (中调)', 'MF (中快)', 'F (快调)', 'XF (超快)'],
  
  // 轮速比
  REEL_RATIO: ['4.x : 1 (电绞/慢摇)', '5.x : 1 (低速)', '6.x : 1 (通用)', '7.x : 1 (高速)', '8.x : 1 (超高速)', '10.x : 1 (光速)'],
  
  // 轮刹车: 覆盖微物(3kg) -> 巨物(30kg+)
  REEL_DRAG: ['3kg', '5kg', '7kg', '9kg', '12kg', '15kg', '20kg', '25kg', '30kg+', '50kg+'],
  
  // 线号: 覆盖0.2号 -> 船钓/拖钓(20号+)
  LINE_NUM: [
    '0.2号', '0.4号', '0.6号', '0.8号', '1.0号', '1.2号', '1.5号', '2.0号', 
    '2.5号', '3.0号', '4.0号', '5.0号', '6.0号', '8.0号', '10.0号', '12.0号', '16.0号', '20.0号+'
  ],
  
  // 拟饵克重: 覆盖微物(1g) -> 深海铁板(500g+)
  LURE_WEIGHT: [
    '1g', '2.5g', '3.5g', '5g', '7g', '10g', '14g', '18g', '21g', '28g', '40g', 
    '60g', '80g', '100g', '150g', '200g', '300g', '400g', '500g+', '800g+'
  ],
  
  // ✅ 铅坠克重 (重构版): 覆盖台钓咬铅 -> 近海(300g) -> 深海(2000g)
  SINKER_WEIGHT: [
    // --- 轻量区 ---
    '0.5g (g1/g2)', '1.0g', '2.0g', '3.5g', '5g', '7g', '10g', '15g', '20g',
    // --- 中量区 (远投/底钓) ---
    '30g (8号)', '40g (10号)', '50g', '60g (15号)', '80g (20号)', '100g (25号)', 
    // --- 重量区 (近海/船钓) ---
    '120g (30号)', '150g (40号)', '200g (50号)', '250g', '300g (80号)', '400g (100号)', '500g', 
    // --- 巨物区 (深海电绞) ---
    '750g (200号)', '1000g', '1500g', '2000g+'
  ]
};

// --- 动态字段配置 ---
const FIELD_CONFIG = {
  rod: [
    { key: 'length', label: '长度 (Length)', type: 'selector', options: STD_PARAMS.ROD_LENGTH },
    { key: 'power', label: '硬度 (Power)', type: 'selector', options: STD_PARAMS.ROD_POWER },
    { key: 'action', label: '调性 (Action)', type: 'selector', options: STD_PARAMS.ROD_ACTION }
  ],
  reel: [
    { key: 'type', label: '轮型', type: 'selector', options: ['纺车轮', '水滴轮', '鼓轮', '飞蝇轮', '电动轮 (电绞)', '前打轮'] },
    { key: 'ratio', label: '速比 (Ratio)', type: 'selector', options: STD_PARAMS.REEL_RATIO },
    { key: 'drag', label: '刹车力 (Drag)', type: 'selector', options: STD_PARAMS.REEL_DRAG }
  ],
  line: [
    { key: 'material', label: '材质', type: 'selector', options: ['PE编织线', '尼龙线', '碳素线', '氟碳线', '钢丝线'] },
    { key: 'number', label: '线号 (#)', type: 'selector', options: STD_PARAMS.LINE_NUM },
    // 颜色保留手填
    { key: 'color', label: '颜色', type: 'text', placeholder: '如 墨绿/五色线/透明' }
  ],
  lure: [
    { key: 'type', label: '拟饵类型', type: 'selector', options: ['米诺 (Minnow)', '波扒 (Popper)', '亮片 (Spoon)', '软饵 (Soft)', '铅笔 (Pencil)', 'VIB', '铁板 (Jig)', '雷蛙 (Frog)', '复合亮片 (Spinner)'] },
    { key: 'weight', label: '克重 (Weight)', type: 'selector', options: STD_PARAMS.LURE_WEIGHT }
  ],
  sinker: [
    { key: 'type', label: '铅坠类型', type: 'selector', options: ['咬铅/夹铅', '中通铅/橄榄铅', '德州子弹铅', '倒钓铅', '水滴铅/梨形铅', '远投铅', '龟型铅', '船钓铁坠'] },
    { key: 'weight', label: '克重/号数', type: 'selector', options: STD_PARAMS.SINKER_WEIGHT }
  ]
};

Page({
  data: {
    isEdit: false,
    gearId: null,
    
    // 基础信息
    categoryL1: '', categoryL2: '', typeName: '',   
    
    // 表单模型
    formData: {
      brand: '',
      name: '',
      price: '',
      count: 1, 
      specs: {}, 
      tags: []   
    },

    dynamicFields: [], 
    methodOptions: FISHING_METHODS, 
  },

  onLoad(options) {
    const { id, l1, l2, name, barcode, pre_brand, pre_name, pre_model, pre_price } = options;

    if (id) {
      // 编辑模式 (保持不变)
      this.setData({ isEdit: true, gearId: id });
      this.loadGearDetail(id);
    } else {
      // 新增模式
      
      // 1. 处理预填数据 (解码)
      const initFormData = {
        brand: pre_brand ? decodeURIComponent(pre_brand) : '',
        name: pre_name ? decodeURIComponent(pre_name) : '',
        price: pre_price || '',
        count: 1,
        specs: {},
        tags: []
      };

      // 2. 如果有型号(model)，尝试自动填入 specs (假设第一个动态字段是规格)
      // 注意：这里比较粗糙，如果 l2 是 rod，FIELD_CONFIG[l2] 第一个可能是 length
      // 建议只把 API 的 model 放入 name 或 tags，或者专门加一个字段
      if (pre_model) {
        const decodedModel = decodeURIComponent(pre_model);
        // 策略：简单粗暴地拼接到名称后面，让用户自己改，或者放入 specs.spec
        // 这里演示放入 specs 的通用字段 'spec' (如果配置了的话)
        initFormData.specs = { spec: decodedModel }; 
      }

      this.setData({
        categoryL1: l1,
        categoryL2: l2,
        typeName: name,
        // 存下条码，提交时要用到
        barcode: barcode || '', 
        
        // 加载动态字段配置
        dynamicFields: FIELD_CONFIG[l2] || [{ key: 'spec', label: '规格/备注', type: 'text' }],
        
        // 应用预填数据
        formData: initFormData
      });

      wx.setNavigationBarTitle({ title: `入库: ${name}` });
    }
  },

  async loadGearDetail(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await db.collection('gear_library').doc(id).get();
      const data = res.data;
      
      this.setData({
        categoryL1: data.category_l1,
        categoryL2: data.category_l2,
        dynamicFields: FIELD_CONFIG[data.category_l2] || [{ key: 'spec', label: '规格/备注', type: 'text' }],
        formData: {
          brand: data.brand,
          name: data.name,
          price: data.price,
          count: data.count || 1, 
          specs: data.specs || {},
          tags: data.tags || []
        }
      });
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`formData.${field}`]: e.detail.value });
  },

  onCountChange(e) {
    const delta = parseInt(e.currentTarget.dataset.delta);
    let newCount = (Number(this.data.formData.count) || 1) + delta;
    if (newCount < 1) newCount = 1;
    this.setData({ 'formData.count': newCount });
  },

  onSpecInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`formData.specs.${key}`]: e.detail.value });
  },

  onPickerChange(e) {
    const key = e.currentTarget.dataset.key;
    const idx = e.detail.value;
    const options = e.currentTarget.dataset.options;
    this.setData({ [`formData.specs.${key}`]: options[idx] });
  },

  toggleTag(e) {
    const key = e.currentTarget.dataset.key;
    let tags = this.data.formData.tags || [];
    if (tags.includes(key)) tags = tags.filter(t => t !== key);
    else tags.push(key);
    this.setData({ 'formData.tags': tags });
  },

  async submit() {
    const { brand, name, price, count, specs, tags } = this.data.formData;
    // ... (校验逻辑) ...

    wx.showLoading({ title: '保存中...' });
    const payload = {
      // ... (原有字段) ...
      category_l1: this.data.categoryL1,
      category_l2: this.data.categoryL2,
      brand, name, 
      price: Number(price) || 0,
      count: Number(count) || 1,
      specs, tags,
      
      // ✅ 新增：保存条码 (如果有)
      barcode: this.data.barcode || '', 
      
      _updateTime: new Date()
    };

    try {
      if (this.data.isEdit) {
        await db.collection('gear_library').doc(this.data.gearId).update({ data: payload });
      } else {
        payload._createTime = new Date();
        await db.collection('gear_library').add({ data: payload });
      }
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack({ delta: this.data.isEdit ? 1 : 2 }); }, 1500);
    } catch (err) {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async deleteGear() {
    wx.showModal({
      title: '警报 // WARNING',
      content: '确定移除吗？此操作不可恢复。',
      confirmText: '移除',
      confirmColor: '#FF3B30',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '移除中...' });
          try {
            await db.collection('gear_library').doc(this.data.gearId).remove();
            wx.hideLoading();
            setTimeout(() => { wx.navigateBack({ delta: 1 }); }, 1500);
          } catch (err) {
            wx.hideLoading();
          }
        }
      }
    });
  }
});