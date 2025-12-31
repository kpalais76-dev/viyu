// pages/gear/form/index.js
const db = wx.cloud.database();
const { GEAR_TYPES } = require('../../../utils/constants.js');

Page({
  data: {
    mode: 'scan', 
    editId: null,
    globalId: null,
    type: 'rod', 

    brands: ['禧玛诺', '达亿瓦', '伽玛卡兹', '阿布', '天元', '化氏', '汉鼎', '光威', '佳钓尼', '其他'],
    brandIndex: null,

    // 九大分类定义
    typeMeta: {
      rod: {
        label: '鱼竿',
        params: [
          { key: 'length', label: '全长', unit: 'm', type: 'digit', placeholder: '如 3.6' },
          { key: 'power', label: '硬度', type: 'picker', options: ['UL', 'L', 'ML', 'M', 'MH', 'H', 'XH', 'XXH', '4H', '5H', '6H', '8H+'] },
          { key: 'action', label: '调性', type: 'picker', options: ['RF', 'F', 'R', 'S', '19调', '28调', '37调', '46调'] },
          { key: 'section', label: '节数', unit: '节', type: 'number' },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit' },
          { key: 'material', label: '材质', type: 'picker', options: ['高碳', '玻纤', '纳米硼', '竹制'] }
        ]
      },
      reel: {
        label: '渔轮',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['纺车轮', '水滴轮', '鼓轮', '前打轮', '飞钓轮'] },
          { key: 'ratio', label: '速比', unit: '', type: 'digit', placeholder: '如 6.2' },
          { key: 'drag', label: '刹车', unit: 'kg', type: 'digit' },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit' },
          { key: 'bearing', label: '轴承', unit: '', type: 'text', placeholder: '11+1' },
          { key: 'capacity', label: '容线', unit: '', type: 'text', placeholder: '3号/150m' }
        ]
      },
      line: {
        label: '主线',
        params: [
          { key: 'material', label: '材质', type: 'picker', options: ['PE编织', '尼龙', '碳线', '氟碳'] },
          { key: 'number', label: '线号', unit: '号', type: 'digit' },
          { key: 'strength', label: '拉力', unit: 'lb', type: 'digit' },
          { key: 'length', label: '卷长', unit: 'm', type: 'number' },
          { key: 'color', label: '颜色', type: 'text' }
        ]
      },
      float: {
        label: '浮漂',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['立漂', '阿波', '七星漂', '助投器'] },
          { key: 'lead', label: '吃铅', unit: 'g', type: 'digit' },
          { key: 'material', label: '材质', type: 'picker', options: ['纳米', '巴尔杉木', '芦苇', '孔雀羽'] },
          { key: 'length', label: '全长', unit: 'cm', type: 'digit' }
        ]
      },
      lure: {
        label: '拟饵',
        params: [
          { key: 'category', label: '型态', type: 'picker', options: ['米诺', '波爬', '铅笔', 'VIB', '亮片', '铁板', '软虫', '雷蛙'] },
          { key: 'weight', label: '克重', unit: 'g', type: 'digit' },
          { key: 'length', label: '长度', unit: 'mm', type: 'number' },
          { key: 'buoyancy', label: '浮力', type: 'picker', options: ['浮水 (F)', '悬停 (SP)', '沉水 (S)', '快沉 (FS)'] },
          { key: 'depth', label: '潜深', unit: 'm', type: 'text' },
          { key: 'color', label: '色号', type: 'text' }
        ]
      },
      hook: {
        label: '鱼钩',
        params: [
          { key: 'shape', label: '钩型', type: 'picker', options: ['新关东', '伊势尼', '袖钩', '千又', '伊豆', '曲柄钩', '铅头钩', '三本钩'] },
          { key: 'size', label: '号数', unit: '号', type: 'text' },
          { key: 'barb', label: '倒刺', type: 'picker', options: ['有倒刺', '无倒刺'] },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit' },
          { key: 'quantity', label: '数量', unit: '枚', type: 'number' }
        ]
      },
      rig: {
        label: '线组',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['台钓主线组', '串钩', '七星漂线组', '前导线组'] },
          { key: 'length', label: '全长', unit: 'm', type: 'digit' },
          { key: 'line_size', label: '线号', unit: '号', type: 'digit' },
          { key: 'hook_size', label: '钩号', unit: '号', type: 'text' }
        ]
      },
      bait: {
        label: '饵料',
        params: [
          { key: 'category', label: '形态', type: 'picker', options: ['粉饵', '颗粒', '酒米', '玉米/麦粒', '小药'] },
          { key: 'flavor', label: '味型', type: 'picker', options: ['腥', '香', '腥香', '酒香', '薯味', '果酸', '原味'] },
          { key: 'weight', label: '净重', unit: 'g', type: 'number' },
          { key: 'target', label: '对象', type: 'text' }
        ]
      },
      accessory: {
        label: '配件',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['铅坠', '八字环', '别针', '太空豆', '漂座'] },
          { key: 'spec', label: '规格', type: 'text' },
          { key: 'quantity', label: '数量', unit: '枚', type: 'number' }
        ]
      }
    },
    
    pickers: {}, 
    formData: {
      series: '', model_sku: '', price: '', barcode: '',
      specs: {} 
    },
    shareToPublic: true,
    isFromGlobal: false
  },

  onLoad(options) {
    if (options.type) this.setData({ type: options.type });
    
    if (options.id) {
      this.setData({ mode: 'form', editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑装备' });
      this.loadGearData(options.id);
    } else if (options.globalId) {
      this.setData({ globalId: options.globalId });
      this.loadGlobalData(options.globalId);
    }
  },

  loadGearData(id) {
    wx.showLoading({ title: '读取中...' });
    db.collection('gear').doc(id).get().then(res => {
      this.fillForm(res.data, false);
      wx.hideLoading();
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
    });
  },

  loadGlobalData(id) {
    wx.showLoading({ title: '同步数据...' });
    db.collection('global_gear_library').doc(id).get().then(res => {
      this.fillForm(res.data, true);
      wx.hideLoading();
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
    });
  },

  fillForm(data, isFromGlobal) {
    const brandIdx = this.data.brands.findIndex(b => data.brand === b || (data.brand && data.brand.includes(b)));
    const specs = data.specs || {};
    let pickers = {};
    
    const meta = this.data.typeMeta[data.category];
    if (meta && meta.params) {
      meta.params.forEach(p => {
        if (p.type === 'picker' && specs[p.key]) {
          const idx = p.options.findIndex(opt => opt === specs[p.key]);
          if (idx > -1) pickers[p.key] = idx;
        }
      });
    }

    this.setData({
      mode: 'form',
      type: data.category,
      brandIndex: brandIdx > -1 ? brandIdx : null,
      pickers: pickers,
      isFromGlobal: isFromGlobal,
      shareToPublic: !isFromGlobal, 
      'formData.series': data.series,
      'formData.model_sku': data.model,
      'formData.price': data.price,
      'formData.barcode': data.barcode,
      'formData.specs': specs
    });
  },

  handleScan() {
    wx.scanCode({
      success: (res) => this.checkGlobalLib(res.result, null)
    });
  },

  handleSearch(e) {
    const keyword = e.detail.value;
    if(keyword) this.checkGlobalLib(null, keyword);
  },

  switchToManual() {
    this.setData({ mode: 'form', isFromGlobal: false });
  },

  checkGlobalLib(barcode, keyword) {
    wx.showLoading({ title: '检索中...' });
    wx.cloud.callFunction({
      name: 'gear_manager',
      data: { type: 'search_global', payload: { barcode, keyword } },
      success: (res) => {
        wx.hideLoading();
        if (res.result.found) {
          this.fillForm(res.result.data, true);
          wx.showToast({ title: '已自动识别', icon: 'success' });
        } else {
          this.setData({ mode: 'form', isFromGlobal: false, 'formData.barcode': barcode || '' });
          if(barcode) wx.showToast({ title: '未收录，请录入', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.switchToManual();
      }
    });
  },

  bindPickerChange(e) {
    const { field, isspec, options } = e.currentTarget.dataset;
    const val = options[e.detail.value];
    this.setData({ [`pickers.${field}`]: e.detail.value });

    if (isspec) {
      this.setData({ [`formData.specs.${field}`]: val });
    } else {
      if (field === 'brand') this.setData({ brandIndex: e.detail.value });
    }
  },
  
  handleInput(e) {
    const { field, isspec } = e.currentTarget.dataset;
    if (isspec) {
      this.setData({ [`formData.specs.${field}`]: e.detail.value });
    } else {
      this.setData({ [`formData.${field}`]: e.detail.value });
    }
  },

  onShareChange(e) { this.setData({ shareToPublic: e.detail.value }); },

  handleSave() {
    const { editId, type, brands, brandIndex, formData, shareToPublic } = this.data;
    
    if (brandIndex === null) return wx.showToast({ title: '请选择品牌', icon: 'none' });
    if (!formData.series) return wx.showToast({ title: '请填写系列名', icon: 'none' });

    let paramDesc = '';
    const specs = formData.specs || {};
    // 简易生成副标题逻辑
    if (specs.length) paramDesc += `${specs.length}m `;
    if (specs.power) paramDesc += `${specs.power} `;
    if (specs.ratio) paramDesc += `${specs.ratio} `;
    if (specs.size) paramDesc += `${specs.size}号 `;

    let finalBarcode = formData.barcode;
    if (shareToPublic && !finalBarcode) {
      finalBarcode = 'ZY' + Date.now().toString().slice(-6) + Math.floor(Math.random()*1000);
    }

    const gearData = {
      category: type,
      brand: brands[brandIndex],
      series: formData.series,
      model: formData.model_sku,
      price: parseFloat(formData.price) || 0,
      specs: specs,
      barcode: finalBarcode,
      name: `${formData.series} ${formData.model_sku || ''}`.trim(),
      param: paramDesc.trim()
    };

    wx.showLoading({ title: '处理中...' });

    if (editId) {
      db.collection('gear').doc(editId).update({
        data: { ...gearData, _updateTime: db.serverDate() }
      }).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '更新成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      });
    } else {
      wx.cloud.callFunction({
        name: 'gear_manager',
        data: {
          type: 'add_gear',
          payload: { gearData, shareToPublic }
        },
        success: (res) => {
          wx.hideLoading();
          if (res.result.success) {
             wx.showToast({ title: '入库成功', icon: 'success' });
             setTimeout(() => wx.navigateBack({ delta: 2 }), 1500);
          } else {
             wx.showToast({ title: '保存异常', icon: 'none' });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({ title: '云服务异常', icon: 'none' });
        }
      });
    }
  }
});