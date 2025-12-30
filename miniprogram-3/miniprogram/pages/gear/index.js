// pages/gear/index.js
Page({
  data: {
    // --- 1. 这里直接写死默认数据，保证页面有显示 ---
    gearList: [
      { id: 1, category: 'rod', brand: '达瓦', name: '凛·风', param: '4.5m / 28调', date: '2023-10' },
      { id: 2, category: 'reel', brand: '禧玛诺', name: 'Stella', param: 'C3000XG', date: '2024-01' },
      { id: 3, category: 'rod', brand: '汉鼎', name: '一号', param: '7.2m / 巨物', date: '2023-05' }
    ],
    totalCount: 3,
    totalValue: 5600, // 假装算好的总价
    currentTab: 0
  },

  onShow() {
    // 每次进入页面，更新一下 TabBar 选中态
    this.safeSetTabBar();
    
    // 如果你想从缓存读取，可以在这里解开注释：
    // this.loadGearFromStorage(); 
  },

  // 安全设置 TabBar，防止报错
  safeSetTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 装备页在 TabBar 的索引是 1
      });
    }
  },

  // 模拟添加装备功能
  handleAddGear() {
    wx.showActionSheet({
      itemList: ['添加鱼竿 (模拟)', '添加渔轮 (模拟)'],
      success: (res) => {
        const type = res.tapIndex === 0 ? 'rod' : 'reel';
        this.addMockItem(type);
      }
    });
  },

  // 往列表里加一条假数据
  addMockItem(type) {
    const newItem = {
      id: Date.now(),
      category: type,
      brand: type === 'rod' ? '光威' : '达亿瓦',
      name: type === 'rod' ? '无法一本' : '红蝎',
      param: type === 'rod' ? '3.6m / 耐造' : '泛用轮',
      date: '刚刚'
    };

    // 更新 data，页面会自动刷新
    const newList = [newItem, ...this.data.gearList];
    this.setData({
      gearList: newList,
      totalCount: newList.length,
      totalValue: this.data.totalValue + 500
    });

    wx.showToast({ title: '已入库', icon: 'success' });
  }
});