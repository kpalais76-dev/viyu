// pages/gear/form/index.js
const db = wx.cloud.database();

Page({
  data: {
    mode: 'scan',
    editId: null,
    globalId: null,
    type: 'rod',

    // 品牌库
    brands: ['禧玛诺', '达亿瓦', '阿布', '伽玛卡兹', '天元', '化氏', '钓鱼王', '汉鼎', '光威', '佳钓尼', '美人鱼', '本汀', '宝飞龙', '其他'],
    brandIndex: null,

    // 专业参数定义
    typeMeta: {
      rod: {
        label: '鱼竿',
        params: [
          { key: 'length', label: '全长', unit: 'm', type: 'digit', placeholder: '如 3.6 / 2.08' },
          { key: 'power', label: '硬度', unit: '', type: 'picker', options: ['UL', 'L', 'ML', 'M', 'MH', 'H', 'XH', '3H', '4H', '5H', '6H', '8H+'] },
          { key: 'action', label: '调性', unit: '', type: 'picker', options: ['RF (超快)', 'F (快)', 'R (中)', 'S (慢)', '19调', '28调', '37调'] },
          { key: 'section', label: '节数', unit: '节', type: 'number', placeholder: '如 2' },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit', placeholder: '选填' }
        ]
      },
      reel: {
        label: '渔轮',
        params: [
          { key: 'ratio', label: '速比', unit: '', type: 'digit', placeholder: '如 6.2' },
          { key: 'drag', label: '刹车力', unit: 'kg', type: 'digit', placeholder: 'Max Drag' },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit', placeholder: '选填' },
          { key: 'bearing', label: '轴承', unit: '', type: 'text', placeholder: '如 11+1' }
        ]
      },
      line: {
        label: '鱼线',
        params: [
          { key: 'number', label: '线号', unit: '号', type: 'digit', placeholder: '如 1.5' },
          { key: 'material', label: '材质', unit: '', type: 'picker', options: ['PE (编织)', '尼龙', '碳线', '氟碳'] },
          { key: 'strength', label: '拉力', unit: 'lb/kg', type: 'text', placeholder: '选填' },
          { key: 'diameter', label: '线径', unit: 'mm', type: 'digit', placeholder: '选填' }
        ]
      },
      float: {
        label: '浮漂',
        params: [
          { key: 'lead', label: '吃铅', unit: 'g', type: 'digit', placeholder: '核心参数' },
          { key: 'material', label: '材质', unit: '', type: 'picker', options: ['纳米', '巴尔杉木', '芦苇', '孔雀羽'] },
          { key: 'length', label: '全长', unit: 'cm', type: 'digit', placeholder: '选填' }
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
    
    // 编辑模式
    if (options.id) {
      this.setData({ mode: 'form', editId: options.id });
      wx.setNavigationBarTitle({ title: '编辑装备' });
      // 这里的函数调用必须对应下方的函数定义
      this.loadGearData(options.id);
    }
    // 引用公共库模式
    else if (options.globalId) {
      this.setData({ globalId: options.globalId });
      this.loadGlobalData(options.globalId);
    }
  },

  // --- 关键修复：确保这两个函数在 Page 对象内部 ---
  
  loadGearData(id) {
    wx.showLoading({ title: '读取中...' });
    db.collection('gear').doc(id).get().then(res => {
      const data = res.data;
      this.fillForm(data, false);
      wx.hideLoading();
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: '读取失败', icon: 'none' });
    });
  },

  loadGlobalData(id) {
    wx.showLoading({ title: '同步数据...' });
    db.collection('global_gear_library').doc(id).get().then(res => {
      const data = res.data;
      this.fillForm(data, true);
      wx.hideLoading();
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: '同步失败', icon: 'none' });
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

  // --- 交互逻辑 ---

  handleScan() {
    wx.scanCode({
      success: (res) => {
        this.checkGlobalLib(res.result, null);
      }
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
          const data = res.result.data;
          this.fillForm(data, true);
          wx.showToast({ title: '已自动识别', icon: 'success' });
        } else {
          this.setData({ mode: 'form', isFromGlobal: false, 'formData.barcode': barcode || '' });
          if(barcode) wx.showToast({ title: '未收录，请录入', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error(err);
        this.switchToManual();
      }
    });
  },

  bindPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const isSpec = e.currentTarget.dataset.isspec;
    const options = e.currentTarget.dataset.options;
    const val = options[e.detail.value];

    this.setData({ [`pickers.${field}`]: e.detail.value });

    if (isSpec) {
      this.setData({ [`formData.specs.${field}`]: val });
    } else {
      if (field === 'brand') this.setData({ brandIndex: e.detail.value });
    }
  },
  
  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    const isSpec = e.currentTarget.dataset.isspec;
    if (isSpec) {
      this.setData({ [`formData.specs.${field}`]: e.detail.value });
    } else {
      this.setData({ [`formData.${field}`]: e.detail.value });
    }
  },

  onShareChange(e) { this.setData({ shareToPublic: e.detail.value }); },

  // --- 保存逻辑 ---
  handleSave() {
    const { editId, type, brands, brandIndex, formData, shareToPublic, typeMeta } = this.data;
    
    if (brandIndex === null) return wx.showToast({ title: '请选择品牌', icon: 'none' });
    if (!formData.series) return wx.showToast({ title: '请填写系列名', icon: 'none' });

    let paramDesc = '';
    const specs = formData.specs || {};
    if (type === 'rod') paramDesc = `${specs.length || '?'}m | ${specs.power || '?'}`;
    else if (type === 'reel') paramDesc = `${specs.ratio || '?'}速比 | ${specs.drag || '?'}kg`;
    else if (type === 'line') paramDesc = `${specs.number || '?'}号 | ${specs.material || ''}`;
    else paramDesc = `吃铅${specs.lead || '?'}g`;

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
      param: paramDesc
    };

    wx.showLoading({ title: '处理中...' });

    if (editId) {
      db.collection('gear').doc(editId).update({
        data: {
          ...gearData,
          _updateTime: db.serverDate()
        }
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
          payload: {
            gearData: gearData,
            shareToPublic: shareToPublic
          }
        },
        success: (res) => {
          wx.hideLoading();
          if (res.result.success) {
             wx.showToast({ title: '入库成功', icon: 'success' });
             setTimeout(() => wx.navigateBack({ delta: 2 }), 1500);
          } else {
             console.error(res.result);
             wx.showToast({ title: '保存异常', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('云函数调用失败', err);
          wx.hideLoading();
          wx.showToast({ title: '云服务异常', icon: 'none' });
        }
      });
    }
  }
});