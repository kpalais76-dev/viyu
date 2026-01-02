// pages/gear/setup/list/index.js
const db = wx.cloud.database();

Page({
  data: {
    setups: []
  },

  onShow() {
    this.loadSetups();
  },

  async loadSetups() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await db.collection('tactical_setups')
        .orderBy('_updateTime', 'desc')
        .get();
      this.setData({ setups: res.data });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
    }
  },

  // 跳转去编辑
  toEdit(e) {
    const id = e.currentTarget.dataset.id;
    // 跳转复用 setup/index 页面，带上 ID
    wx.navigateTo({ url: `/pages/gear/setup/index?id=${id}` });
  },

  // 删除战术
  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认拆解战术？',
      content: '删除后，历史渔获记录中的关联信息将不再更新。',
      confirmColor: '#FF3B30',
      success: async (res) => {
        if (res.confirm) {
          await db.collection('tactical_setups').doc(id).remove();
          this.loadSetups(); // 刷新
          wx.showToast({ title: '已拆解', icon: 'none' });
        }
      }
    });
  },

  // 新建
  toCreate() {
    wx.navigateTo({ url: '/pages/gear/entry/index?mode=setup' });
  }
});