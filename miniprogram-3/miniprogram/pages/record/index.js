Page({
  data: {
    // 这里可以放日期天气数据，暂时留空
  },

  // 跳转到表单页
  goToForm() {
    wx.navigateTo({
      url: '/pages/form/index'
    });
  },

  // 拍照逻辑 (预留)
  handleCamera() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success(res) {
        // 以后这里可以把图片传给表单页
        wx.navigateTo({
          url: '/pages/form/index'
        });
      }
    })
  },

  // 必须加这个，否则 TabBar 选中态会出问题
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 }) // 2 代表第3个按钮
    }
  }
})