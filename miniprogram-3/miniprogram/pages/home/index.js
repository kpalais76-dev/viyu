// 以 pages/gear/index.js (Tab 2, 索引为1) 为例
Page({
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0 // 这里填对应的索引：Home=0, Gear=1, Record=2, Discovery=3, User=4
      })
    }
  }
})