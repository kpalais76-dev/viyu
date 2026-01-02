// pages/record/index.js
const db = wx.cloud.database();

Page({
  data: {
    records: [],
    totalRecords: 0,
    maxWeight: 0
  },

  onShow() {
    this.loadRecords();
  },

  async loadRecords() {
    try {
      const res = await db.collection('fishing_records')
        .orderBy('datetime', 'desc')
        .get();
      
      const rawList = res.data;
      
      // 简单处理一下日期格式，方便展示
      const list = rawList.map(item => {
        const d = new Date(item.datetime);
        return {
          ...item,
          month: d.getMonth() + 1,
          day: d.getDate()
        };
      });

      // 计算最大单尾
      let maxW = 0;
      list.forEach(r => {
        if (r.weight > maxW) maxW = r.weight;
      });

      this.setData({
        records: list,
        totalRecords: list.length,
        maxWeight: maxW
      });

    } catch (err) {
      console.error(err);
    }
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/record/create/index' });
  }
});