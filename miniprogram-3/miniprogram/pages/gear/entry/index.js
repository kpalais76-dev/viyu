// pages/gear/entry/index.js
const app = getApp();
const { GEAR_TYPES, FISHING_METHODS } = require('../../../utils/constants.js');

Page({
  data: {
    mode: 'gear', 
    gearTypes: GEAR_TYPES, 
    methods: FISHING_METHODS,
    
    // 纯英文/数字风格的文案配置
    uiConfig: {
      gear: {
        title: 'ARSENAL',
        mainBtn: '扫码入库',
        mainDesc: 'SCAN BARCODE',
        searchHint: 'TYPE KEYWORD...'
      },
      setup: {
        title: 'TACTICS',
        mainBtn: '粘贴配置', 
        mainDesc: 'PASTE CONFIG',
        searchHint: 'SEARCH PLAN...'
      }
    }
  },

  onLoad(options) {
    const mode = options.mode || 'gear';
    this.setData({ mode });
  },

  handleMainAction() {
    if (this.data.mode === 'gear') {
      wx.scanCode({
        success: (res) => {
           wx.navigateTo({ url: `/pages/gear/form/index?mode=scan&code=${res.result}` });
        }
      });
    } else {
      this.handlePaste();
    }
  },

  handlePaste() {
    wx.getClipboardData({
      success: (res) => {
        const code = res.data;
        if (code && code.includes('#知渔')) {
            wx.showLoading({ title: 'READING...' });
            setTimeout(() => {
                wx.hideLoading();
                wx.showToast({ title: 'OK', icon: 'success' });
            }, 500);
        } else {
            wx.showToast({ title: 'NO DATA', icon: 'none' });
        }
      }
    });
  },

  handleSearch(e) {
    const keyword = e.detail.value;
    if (keyword) wx.showToast({ title: 'SEARCH: ' + keyword, icon: 'none' });
  },
  
  handleSearchBtn() {
    wx.showToast({ title: 'INPUT EMPTY', icon: 'none' });
  },

  handleSelectType(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: `/pages/gear/form/index?type=${type}` });
  },

  handleManualSetup(e) {
    const key = e.currentTarget.dataset.key;
    wx.navigateTo({ url: `/pages/gear/setup/index?method=${key}` });
  }
});