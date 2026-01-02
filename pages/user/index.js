// pages/user/index.js
const db = wx.cloud.database();

Page({
  data: {
    userInfo: null, // 用户信息
    isMember: false, // 是否会员 (文档 2.6.1)
    
    // 生涯统计 (文档 2.5.1)
    stats: {
      totalRecords: 0,
      totalFish: 0,
      maxWeight: 0,
      days: 0
    }
  },

  onShow() {
    this.loadStats();
    // 模拟检查登录态
    const user = wx.getStorageSync('userInfo');
    if (user) {
      this.setData({ userInfo: user });
    }
  },

  // 加载生涯数据
  async loadStats() {
    // 实际应使用聚合查询(aggregate)，这里用简易查询演示
    try {
      const res = await db.collection('fishing_records').get();
      const list = res.data;
      
      let fishCount = 0;
      let maxW = 0;
      
      list.forEach(r => {
        fishCount += (r.total_count || 0);
        if (r.total_weight > maxW) maxW = r.total_weight;
      });

      this.setData({
        'stats.totalRecords': list.length,
        'stats.totalFish': fishCount,
        'stats.maxWeight': maxW.toFixed(1)
      });
    } catch (e) {
      console.error(e);
    }
  },

  // 模拟登录 (实际需调用 wx.getUserProfile)
  login() {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        this.setData({ userInfo: res.userInfo });
        wx.setStorageSync('userInfo', res.userInfo);
      },
      fail: () => {
        // 模拟一个假用户方便测试
        const mockUser = { nickName: '知渔指挥官', avatarUrl: '' };
        this.setData({ userInfo: mockUser });
        wx.setStorageSync('userInfo', mockUser);
      }
    });
  },

  // 核心功能入口
  onSBT() {
    if (!this.data.isMember) return wx.showToast({ title: '会员专属功能', icon: 'none' });
    wx.showToast({ title: 'SBT 码生成中...', icon: 'none' });
  },

  onAnalyze() {
    wx.showToast({ title: '数据分析模块开发中', icon: 'none' });
  },

  onBackup() {
    wx.showModal({ title: '云备份', content: '您的数据已自动同步至知渔云端。', showCancel: false });
  }
});