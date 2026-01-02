// pages/spot/index/index.js
const db = wx.cloud.database();

Page({
  data: { spots: [] },
  onShow() { this.loadSpots(); },
  
  async loadSpots() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await db.collection('fishing_spots').orderBy('_createTime', 'desc').get();
      this.setData({ spots: res.data });
      wx.hideLoading();
    } catch (e) { wx.hideLoading(); }
  },

  toAdd() { wx.navigateTo({ url: '/pages/spot/form/index' }); },
  toEdit(e) { wx.navigateTo({ url: `/pages/spot/form/index?id=${e.currentTarget.dataset.id}` }); },
  
  openMap(e) {
    const item = e.currentTarget.dataset.item;
    wx.openLocation({
      latitude: item.location.latitude, longitude: item.location.longitude,
      name: item.name, address: item.address
    });
  }
});