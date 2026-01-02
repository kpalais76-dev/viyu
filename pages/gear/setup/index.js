// pages/gear/setup/index.js
const db = wx.cloud.database();
const { FISHING_METHODS, GEAR_TYPES_FLAT } = require('../../../utils/constants.js');

Page({
  data: {
    isEdit: false,
    setupId: null,

    methodKey: '',
    methodInfo: {},
    setupName: '',
    slotsData: {}, // { rod: {...}, reel: {...} }

    showSelector: false,
    selectorTitle: '',
    selectorList: [],
    currentSlotKey: ''
  },

  async onLoad(options) {
    // 场景A: 编辑模式 (带id)
    if (options.id) {
      this.setData({ isEdit: true, setupId: options.id });
      await this.loadSetupDetail(options.id);
    } 
    // 场景B: 新建模式 (带method)
    else if (options.method) {
      this.initNewSetup(options.method);
    }
  },

  // 初始化新建
  initNewSetup(methodKey) {
    const targetMethod = FISHING_METHODS.find(m => m.key === methodKey);
    const initialSlots = {};
    targetMethod.slots.forEach(key => initialSlots[key] = null);

    this.setData({
      methodKey: methodKey,
      methodInfo: targetMethod,
      slotsData: initialSlots
    });
    wx.setNavigationBarTitle({ title: `部署: ${targetMethod.name}` });
  },

  // ✅ 加载详情 (核心升级)
  async loadSetupDetail(id) {
    wx.showLoading({ title: '读取战术...' });
    try {
      const res = await db.collection('tactical_setups').doc(id).get();
      const data = res.data;
      
      // 找到对应的钓法定义，为了获取中文名
      const targetMethod = FISHING_METHODS.find(m => m.key === data.method_key);

      this.setData({
        methodKey: data.method_key,
        methodInfo: targetMethod, // 恢复钓法信息
        setupName: data.name,
        slotsData: data.slots // 回填槽位
      });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // ... (onNameInput, onSlotTap, onSelectGear, closeSelector 保持不变，请保留原来的代码) ...
  onNameInput(e) { this.setData({ setupName: e.detail.value }); },
  
  async onSlotTap(e) {
    const slotKey = e.currentTarget.dataset.slot;
    const typeDef = GEAR_TYPES_FLAT.find(t => t.key === slotKey);
    const typeName = typeDef ? typeDef.name : slotKey;

    this.setData({ 
      currentSlotKey: slotKey, selectorTitle: `选择 ${typeName}`,
      showSelector: true, selectorList: [] 
    });
    
    // 查库存
    const res = await db.collection('gear_library').where({ category_l2: slotKey }).orderBy('_createTime', 'desc').get();
    this.setData({ selectorList: res.data });
  },

  onSelectGear(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ [`slotsData.${this.data.currentSlotKey}`]: item, showSelector: false });
  },

  closeSelector() { this.setData({ showSelector: false }); },

  // 保存 (支持更新)
  async saveSetup() {
    const { setupName, methodKey, slotsData, isEdit, setupId } = this.data;
    if (!setupName) return wx.showToast({ title: '请输入名称', icon: 'none' });

    wx.showLoading({ title: '保存中...' });
    const payload = {
      name: setupName,
      method_key: methodKey,
      slots: slotsData,
      _updateTime: new Date()
    };

    try {
      if (isEdit) {
        // 更新模式
        await db.collection('tactical_setups').doc(setupId).update({ data: payload });
      } else {
        // 新建模式
        payload._createTime = new Date();
        await db.collection('tactical_setups').add({ data: payload });
      }

      wx.hideLoading();
      wx.showToast({ title: '部署完成', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1500); // 返回上一页 (列表页)

    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});