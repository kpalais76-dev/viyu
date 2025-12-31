// pages/gear/index.js
const db = wx.cloud.database();
const _ = db.command;
// 🟩 这里的层级是正确的 (gear -> pages -> miniprogram -> utils)
const { GEAR_TYPES } = require('../../utils/constants.js');

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
    // 每次显示都强制刷新当前 Tab 的数据
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

  // --- 拉取单品 (计算总资产) ---
  fetchGearList() {
    db.collection('gear').orderBy('_createTime', 'desc').get()
      .then(res => {
        const list = res.data;
        const totalVal = list.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
        
        this.setData({ 
          gearList: list, 
          totalCount: list.length, 
          totalValue: totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
        });
      });
  },

  // --- 拉取套装 ---
  fetchSetups() {
    db.collection('gear_setups').orderBy('_createTime', 'desc').get()
      .then(res => this.setData({ setupList: res.data }));
  },

  // --- 核心修复：统一分流入口 ---
  handleAddGear() {
    // 关键逻辑：
    // 如果在 Tab 0，模式为 'gear' (去扫码/搜装备)
    // 如果在 Tab 1，模式为 'setup' (去粘贴口令/选钓法)
    const mode = this.data.currentTab === 0 ? 'gear' : 'setup';
    
    // 统一跳转到 Entry 中转页
    wx.navigateTo({ url: `/pages/gear/entry/index?mode=${mode}` });
  },

  // --- 统一编辑 ---
  handleEdit(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.currentTab === 0) {
      wx.navigateTo({ url: `/pages/gear/form/index?id=${id}` });
    } else {
      // 编辑套装时，setup页面会自动加载原有数据
      wx.navigateTo({ url: `/pages/gear/setup/index?id=${id}` });
    }
  },

  // --- 统一删除 ---
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
              this.refreshData(); // 刷新列表
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