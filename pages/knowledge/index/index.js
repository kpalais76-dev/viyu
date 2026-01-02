// pages/knowledge/index/index.js
const db = wx.cloud.database();

Page({
  data: {
    activeTab: 'method',
    list: [] // 统一用一个列表渲染
  },

  onLoad() {
    this.loadData('method');
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key, list: [] }); // 切换时先清空
    this.loadData(key);
  },

  async loadData(type) {
    wx.showLoading({ title: '获取知识...' });
    try {
      // 从云数据库查询
      const res = await db.collection('knowledge_library')
        .where({ type: type })
        .get();
      this.setData({ list: res.data });
      wx.hideLoading();
    } catch (err) {
      console.error(err);
      wx.hideLoading();
    }
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/knowledge/detail/index?id=${id}` });
  }
});