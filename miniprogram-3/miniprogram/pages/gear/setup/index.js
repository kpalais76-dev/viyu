// pages/gear/entry/index.js
const app = getApp();
const { GEAR_TYPES, FISHING_METHODS } = require('../../../utils/constants.js');

Page({
  data: {
    mode: 'gear', 
    gearGroups: [],
    methods: FISHING_METHODS,
    
    // 动态配置文案
    uiConfig: {
      gear: {
        title: 'ARSENAL',
        mainBtn: 'SCAN BARCODE',
        mainDesc: '扫码入库',
        searchHint: '搜索全网装备 (品牌/型号)'
      },
      setup: {
        title: 'TACTICS',
        mainBtn: 'PASTE CONFIG', // 战术模式下，左边大按钮是“粘贴配置”
        mainDesc: '解析剪贴板',
        searchHint: '搜索热门战术方案'
      }
    }
  },

  onLoad(options) {
    const mode = options.mode || 'gear';
    this.setData({ mode });
    
    // 初始化分组数据
    if (mode === 'gear') {
      this.initGearGroups();
    }
  },

  initGearGroups() {
    // 0: Core (竿轮线漂) -> 2x2
    // 1: Terminal (拟饵鱼钩) -> 3x3
    // 2: Logistics (线组饵料配件) -> 3x3
    const groups = [
      { title: 'CORE ASSETS', en: '核心资产', list: GEAR_TYPES.slice(0, 4) }, 
      { title: 'TERMINAL', en: '战术终端', list: GEAR_TYPES.slice(4, 6) },
      { title: 'LOGISTICS', en: '后勤辅件', list: GEAR_TYPES.slice(6, 9) }
    ];
    this.setData({ gearGroups: groups });
  },

  // 左侧大按钮
  handleMainAction() {
    if (this.data.mode === 'gear') {
      // 装备模式：扫码
      wx.scanCode({
        success: (res) => {
           wx.navigateTo({ url: `/pages/gear/form/index?mode=scan&code=${res.result}` });
        }
      });
    } else {
      // 战术模式：粘贴 (因为战术模式没东西可扫)
      this.handlePaste();
    }
  },

  // 右侧小按钮：导入知渔码 (通用)
  handlePaste() {
    wx.getClipboardData({
      success: (res) => {
        const code = res.data;
        if (code && code.includes('#知渔')) {
            wx.showLoading({ title: '解析口令...' });
            // 模拟解析延迟
            setTimeout(() => {
                wx.hideLoading();
                wx.showToast({ title: '解析成功', icon: 'success' });
                // TODO: 这里跳转到 setup 详情页并回填数据
            }, 500);
        } else {
            wx.showToast({ title: '剪贴板无有效口令', icon: 'none' });
        }
      }
    });
  },

  // 搜索
  handleSearch(e) {
    const keyword = e.detail.value;
    if (!keyword) return;
    
    console.log('Searching for:', keyword);
    
    // 模拟搜索反馈
    wx.showLoading({ title: 'Searching...' });
    setTimeout(() => {
        wx.hideLoading();
        // 这里可以改成 wx.navigateTo({ url: `/pages/search/index?q=${keyword}` });
        wx.showToast({ title: '暂无结果', icon: 'none' });
    }, 800);
  },

  // 点击分类
  handleSelectType(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: `/pages/gear/form/index?type=${type}` });
  },

  // 点击钓法
  handleManualSetup(e) {
    const key = e.currentTarget.dataset.key;
    wx.navigateTo({ url: `/pages/gear/setup/index?method=${key}` });
  }
});