// pages/gear/entry/index.js
const app = getApp();
// 修复引用路径：使用相对路径
const { FISHING_METHODS } = require('../../../utils/constants.js');

Page({
  data: {
    mode: 'gear', // 'gear' | 'setup'
    methods: FISHING_METHODS || [], 
    
    // UI 文案配置 (无图标版)
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
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 手动录入装备
  handleManualGear() {
    wx.showActionSheet({
      itemList: ['鱼竿', '渔轮', '鱼线', '浮漂'],
      success: (res) => {
        const types = ['rod', 'reel', 'line', 'float'];
        wx.navigateTo({ url: `/pages/gear/form/index?type=${types[res.tapIndex]}` });
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