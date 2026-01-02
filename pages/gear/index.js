// pages/gear/index.js
const app = getApp();
const db = wx.cloud.database();
// 引入常量，用于解析分类名称和Icon
const { GEAR_TYPES_FLAT, GEAR_CATEGORIES } = require('../../utils/constants.js');

Page({
  data: {
    activeTab: 'core', // 默认选中核心资产
    gearList: [],
    totalValue: '0.00',
    totalCount: 0
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadData();
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    if (key === this.data.activeTab) return;
    this.setData({ activeTab: key }, () => {
      this.loadData();
    });
  },

// 加载数据
// pages/gear/index.js
// ... 保持前面的引用不变

async loadData() {
  wx.showLoading({ title: 'LOADING...', mask: true });
  
  try {
    const categoryKey = this.data.activeTab;
    
    const res = await db.collection('gear_library')
      .where({ category_l1: categoryKey })
      .orderBy('_createTime', 'desc')
      .get();

    const rawList = res.data;
    
    const list = rawList.map(item => {
      const typeDef = GEAR_TYPES_FLAT.find(t => t.key === item.category_l2) || {};
      return {
        ...item,
        icon: typeDef.icon || '📦',
        sub_type_name: typeDef.name || item.category_l2,
        desc_str: this.formatSpecs(item.specs),
        // ✅ 确保数量至少为1 (兼容旧数据)
        count: item.count || 1 
      };
    });

    // ✅ 升级统计逻辑：总数累加 count，总价累加 (price * count)
    const totalCount = list.reduce((acc, cur) => acc + cur.count, 0);
    const totalVal = list.reduce((acc, cur) => acc + ((Number(cur.price) || 0) * cur.count), 0);

    this.setData({
      gearList: list,
      totalCount: totalCount,
      totalValue: totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 }) 
    });

  } catch (err) {
    // ... 保持不变
    console.error(err);
    wx.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    wx.hideLoading();
  }
},

  // 格式化参数显示
  formatSpecs(specs) {
    if (!specs) return '';
    // 取出非空的 value 拼接
    return Object.values(specs).filter(v => v).join(' · ');
  },

  // 跳转：选择分类进行入库
  goToEntry() {
    wx.navigateTo({ url: '/pages/gear/entry/index?mode=gear' });
  },

  // 跳转：详情/编辑
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/gear/form/index?id=${id}` });
  }
});