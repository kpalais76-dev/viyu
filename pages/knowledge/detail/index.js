// pages/knowledge/detail/index.js
const db = wx.cloud.database();

Page({
  data: {
    info: {},
    // 智能分析结果
    analysis: {
      hasGear: false, // 是否有适配装备
      gearCount: 0,
      hasSpot: false, // 是否有适配钓点
      spotCount: 0
    }
  },

  async onLoad(options) {
    const { id } = options;
    await this.loadDetail(id);
  },

  async loadDetail(id) {
    wx.showLoading();
    const res = await db.collection('knowledge_library').doc(id).get();
    const data = res.data;
    
    this.setData({ info: data });
    wx.setNavigationBarTitle({ title: data.title });

    // ✅ 如果是钓法，进行智能联动检查
    if (data.type === 'method') {
      this.checkUserResources(data);
    }
    wx.hideLoading();
  },

  // 🧠 核心：检查用户的资产，判断是否具备作钓条件
  async checkUserResources(methodData) {
    // 1. 检查装备库：比如台钓需要竿(rod)
    // 这里简单逻辑：只要用户库存里有该钓法需要的核心装备类型即可
    const gearRes = await db.collection('gear_library').count(); // 简化：实际应查具体类型
    
    // 2. 检查钓点库：比如台钓适配 "静水"
    // 我们查用户的钓点里，有没有 water_type 符合当前钓法 tags 的
    const tags = methodData.tags || [];
    // 这是一个简单的模糊匹配逻辑
    const spotRes = await db.collection('fishing_spots').where({
      // 只要水域类型包含在钓法标签里 (例如 "水库" 在 tags 列表里)
      // 实际开发可以使用正则或更复杂的查询
      water_type: db.RegExp({ regexp: tags.join('|'), options: 'i' })
    }).count();

    this.setData({
      'analysis.hasGear': gearRes.total > 0,
      'analysis.gearCount': gearRes.total,
      'analysis.hasSpot': spotRes.total > 0,
      'analysis.spotCount': spotRes.total
    });
  },

  // 🚀 一键生成战术 (智能联动)
  goSetup() {
    // 跳转到组装页，告诉它：我要组装 "tai" (台钓) 类型的战术
    wx.navigateTo({
      url: `/pages/gear/setup/index?method=${this.data.info.key}`
    });
  }
});