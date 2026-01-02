// pages/gear/entry/index.js
const { GEAR_CATEGORIES, FISHING_METHODS } = require('../../../utils/constants.js');

Page({
  data: {
    mode: 'gear', // gear (入库) | setup (战术)
    gearGroups: GEAR_CATEGORIES,
    methods: FISHING_METHODS,
    
    // --- 扫码临时数据 ---
    showCategoryModal: false, // 是否显示分类选择弹窗
    scannedData: null,        // 存放扫码查到的结果
  },

  onLoad(options) {
    const mode = options.mode || 'gear';
    this.setData({ mode });
    wx.setNavigationBarTitle({
      title: mode === 'gear' ? '选择入库类型' : '选择战术流派'
    });
  },

  // 动作：手动点击分类 (直接跳转，无预填数据)
  onSelectType(e) {
    // 如果是扫码模式下的选择，走扫码逻辑
    if (this.data.showCategoryModal) {
      this.handleScanRedirect(e);
      return;
    }

    // 正常手动录入模式
    const { parent, type, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/gear/form/index?l1=${parent}&l2=${type}&name=${name}`
    });
  },

  // 动作：选中战术流派
  onSelectMethod(e) {
    const key = e.currentTarget.dataset.key;
    wx.navigateTo({
      url: `/pages/gear/setup/index?method=${key}`
    });
  },

  // ✅ 修复后的 onScan：增加错误弹窗
  async onScan() {
    try {
      const scanRes = await wx.scanCode();
      const barcode = scanRes.result;

      wx.showLoading({ title: '识别中...' });

      // 调用云函数
      const cloudRes = await wx.cloud.callFunction({
        name: 'gearManager',
        data: { action: 'scan_lookup', barcode: barcode }
      });

      wx.hideLoading();
      const result = cloudRes.result;

      // 如果云函数内部捕获了错误并返回了 source: 'error'
      if (result.source === 'error') {
        throw new Error(result.msg || '云函数内部错误');
      }

      if (result.found) {
        wx.showToast({ title: '已识别', icon: 'success' });
        this.setData({
          scannedData: { ...result.data, barcode },
          showCategoryModal: true
        });
      } else {
        wx.showToast({ title: '未收录，请手动添加', icon: 'none' });
        this.setData({
          scannedData: { barcode, name: '', brand: '', model: '' },
          showCategoryModal: true
        });
      }

    } catch (err) {
      wx.hideLoading();
      console.error('扫码流程报错:', err);
      
      // 🔥 核心修改：弹出具体的错误信息
      wx.showModal({
        title: '识别失败',
        content: '错误详情: ' + (err.message || JSON.stringify(err)),
        showCancel: false
      });
    }
  },

  // 辅助：扫码后用户点击了分类 -> 跳转表单并回填
  handleScanRedirect(e) {
    const { parent, type, name } = e.currentTarget.dataset;
    const data = this.data.scannedData || {};

    // 构造参数 (注意：中文和特殊字符需要 encode)
    const query = [
      `l1=${parent}`,
      `l2=${type}`,
      `name=${name}`, // 分类名称
      `barcode=${data.barcode || ''}`,
      `pre_brand=${encodeURIComponent(data.brand || '')}`,
      `pre_name=${encodeURIComponent(data.name || '')}`,
      `pre_model=${encodeURIComponent(data.model || '')}`,
      `pre_price=${data.price || ''}`
    ].join('&');

    // 关闭弹窗状态
    this.setData({ showCategoryModal: false, scannedData: null });

    // 跳转
    wx.navigateTo({ url: `/pages/gear/form/index?${query}` });
  },

  // 辅助：关闭分类弹窗
  closeModal() {
    this.setData({ showCategoryModal: false, scannedData: null });
  },

  switchMode() {
    const newMode = this.data.mode === 'gear' ? 'setup' : 'gear';
    this.setData({ mode: newMode });
    wx.setNavigationBarTitle({
      title: newMode === 'gear' ? '选择入库类型' : '选择战术流派'
    });
  }
});