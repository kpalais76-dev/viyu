// pages/gear/entry/index.js
const app = getApp();
// 引入最新的常量 (包含 GEAR_TYPES 和 FISHING_METHODS)
const { GEAR_TYPES, FISHING_METHODS } = require('../../../utils/constants.js');

Page({
  data: {
    mode: 'gear', // 'gear' | 'setup'
    methods: FISHING_METHODS || [], 
    
    // UI 文案配置
    uiConfig: {
      gear: {
        title: '新增装备',
        sub: '丰富你的军火库',
        rank: '热门装备榜',
        mainBtn: '扫描条形码',
        mainDesc: '支持 69 码 / 内部码',
        searchHint: '搜索品牌、型号'
      },
      setup: {
        title: '新建战术',
        sub: '一键复刻大神配置',
        rank: '热门战术榜',
        mainBtn: '粘贴口令',
        mainDesc: '解析 #知渔配置# 码',
        searchHint: '搜索方案名、标签'
      }
    }
  },

  onLoad(options) {
    const mode = options.mode || 'gear';
    this.setData({ mode });
    wx.setNavigationBarTitle({ title: mode === 'gear' ? '装备入库' : '战术组装' });
  },

  // 1. 核心大按钮点击
  handleMainAction() {
    if (this.data.mode === 'gear') {
      wx.scanCode({
        success: (res) => this.processCode(res.result)
      });
    } else {
      wx.getClipboardData({
        success: (res) => {
          const code = res.data;
          if (code && code.includes('#知渔')) {
             this.processCode(code);
          } else {
             wx.showToast({ title: '剪贴板无有效口令', icon: 'none' });
          }
        }
      });
    }
  },

  // 2. 搜索
  handleSearch(e) {
    const val = e.detail.value;
    if (val) this.processCode(val);
  },

  // 3. 处理中心
  processCode(code) {
    console.log('检索:', code);
    // 这里未来会对接云函数，目前暂未实现
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // --- 重点修改：手动录入装备 (动态化) ---
  handleManualGear() {
    // 1. 从常量中提取纯中文名称数组，如 ['鱼竿', '渔轮', ... '配件']
    const itemList = GEAR_TYPES.map(item => item.name);
    
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        // 2. 根据点击的索引，找回对应的 key (如 'rod', 'lure')
        const selectedType = GEAR_TYPES[res.tapIndex].key;
        
        // 3. 带着类型跳转到表单页
        wx.navigateTo({ url: `/pages/gear/form/index?type=${selectedType}` });
      }
    });
  },

  // 手动组装套装
  handleManualSetup(e) {
    const methodKey = e.currentTarget.dataset.key;
    wx.navigateTo({ url: `/pages/gear/setup/index?method=${methodKey}` });
  },

  goToRanking() {
    wx.switchTab({ url: '/pages/discovery/index' });
  }
});