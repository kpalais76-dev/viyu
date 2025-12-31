// pages/gear/index.js
const db = wx.cloud.database();
const _ = db.command;
// --- 核心修复：路径是 ../../ (两层) ---
const { GEAR_TYPES } = require('../../../utils/constants.js');

Page({
  data: {
    gearList: [],
    setupList: [], 
    currentTab: 0, // 0:我的库存, 1:战术方案
    totalValue: '0.00',
    totalCount: 0
  },

  onShow() {
    this.safeSetTabBar();
    this.refreshData();
  },

  switchTab(e) {
    const idx = Number(e.currentTarget.dataset.idx);
    this.setData({ currentTab: idx });
    this.refreshData();
  },

  refreshData() {
    if (this.data.currentTab === 0) this.fetchGearList();
    else this.fetchSetups();
  },

  // --- 拉取单品 (适配九大分类) ---
  fetchGearList() {
    db.collection('gear').orderBy('_createTime', 'desc').get()
      .then(res => {
        const rawList = res.data;
        
        // 数据清洗：注入图标和中文名
        const list = rawList.map(item => {
          // 在常量表中查找定义
          const typeDef = GEAR_TYPES.find(t => t.key === item.category) || {};
          return {
            ...item,
            _icon: typeDef.icon || '📦', // 找不到就用默认盒子
            _typeName: typeDef.name || item.category,
            _displayDesc: this.getDisplayDesc(item) // 生成副标题
          };
        });

        const totalVal = list.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        
        this.setData({ 
          gearList: list, 
          totalCount: list.length, 
          totalValue: totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
        });
      });
  },

  // 辅助函数：生成副标题 (根据不同类型显示不同参数)
  getDisplayDesc(item) {
    if (!item.specs) return item.param || ''; // 兼容旧数据
    const s = item.specs;
    
    switch (item.category) {
      case 'rod': return `${s.length || '?'}m · ${s.power || '?'}`;
      case 'reel': return `${s.ratio || '?'}速比 · ${s.drag || '?'}kg`;
      case 'line': return `${s.number || '?'}号 · ${s.material || ''}`;
      case 'lure': return `${s.category || ''} · ${s.weight || '?'}g`;
      case 'hook': return `${s.shape || ''} · ${s.size || '?'}号`;
      default: return item.param || '';
    }
  },

  // --- 拉取套装 ---
  fetchSetups() {
    db.collection('gear_setups').orderBy('_createTime', 'desc').get()
      .then(res => this.setData({ setupList: res.data }));
  },

  handleAddGear() {
    const mode = this.data.currentTab === 0 ? 'gear' : 'setup';
    wx.navigateTo({ url: `/pages/gear/entry/index?mode=${mode}` });
  },

  handleEdit(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.currentTab === 0) {
      wx.navigateTo({ url: `/pages/gear/form/index?id=${id}` });
    } else {
      wx.navigateTo({ url: `/pages/gear/setup/index?id=${id}` });
    }
  },

  handleDelete(e) {
    const { id, name } = e.currentTarget.dataset;
    const isSetup = this.data.currentTab === 1;
    const collection = isSetup ? 'gear_setups' : 'gear';
    
    wx.showModal({
      title: '确认移除',
      content: `确定要删除 ${isSetup ? '方案' : '装备'}：${name} 吗？`,
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          db.collection(collection).doc(id).remove()
            .then(() => {
              wx.hideLoading();
              this.refreshData();
              wx.showToast({ title: '已移除', icon: 'none' });
            });
        }
      }
    });
  },

  safeSetTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  }
});