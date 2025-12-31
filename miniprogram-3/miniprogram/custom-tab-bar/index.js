Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#4CAF50",
    list: [
      { pagePath: "/pages/home/index", text: "战绩", icon: "📊" },
      { pagePath: "/pages/gear/index", text: "装备", icon: "🧰" },
      { pagePath: "/pages/record/index", text: "开钓", isSpecial: true }, // 特殊标记
      { pagePath: "/pages/discovery/index", text: "发现", icon: "🔭" },
      { pagePath: "/pages/user/index", text: "我的", icon: "👤" }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 切换页面
      wx.switchTab({ url });
      
      // 更新选中态 (有些场景需要手动更新，虽然switchTab会触发onShow)
      // this.setData({ selected: data.index }); 
    }
  }
})