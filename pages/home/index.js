// pages/home/index.js
const app = getApp();
const db = wx.cloud.database();

Page({
  data: {
    mySetups: [] // 战术列表
  },

  onShow() {
    this.loadSetups();
  },

  async loadSetups() {
    try {
      const res = await db.collection('tactical_setups')
        .orderBy('_updateTime', 'desc')
        .get();
      
      const rawList = res.data;

      // ✅ 核心修复：直接在 JS 里把数量算好，不依赖 WXS
      const list = rawList.map(item => {
        let count = 0;
        if (item.slots) {
          // JS 的 Object.keys 非常稳定，不会报错
          count = Object.keys(item.slots).filter(key => item.slots[key] !== null).length;
        }
        return {
          ...item,
          slotCount: count // 新增字段
        };
      });

      this.setData({ mySetups: list });
    } catch (err) {
      console.error(err);
    }
  },

  // 记录渔获
  onRecord() {
    wx.navigateTo({ url: '/pages/record/create/index' });
  },

  // 管理战术 (修复后的正确入口)
  onManageGear() {
    wx.navigateTo({ url: '/pages/gear/setup/list/index' });
  },

  // 新建战术
  onNewSetup() {
    wx.navigateTo({ url: '/pages/gear/entry/index?mode=setup' });
  },

  // 我的钓点
  goToSpots() {
    wx.navigateTo({ url: '/pages/spot/index/index' });
  },

  goToKnowledge() {
    wx.navigateTo({ url: '/pages/knowledge/index/index' });
  }

});