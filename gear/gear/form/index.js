// pages/gear/form/index.js
const db = wx.cloud.database();
// 引入最新的常量
const { GEAR_TYPES } = require('../../../utils/constants.js');

Page({
  data: {
    mode: 'scan', // scan | form
    editId: null,
    globalId: null,
    type: 'rod', // 当前录入类型

    // 品牌库 (建议后续也提取到常量或云数据库)
    brands: ['禧玛诺', '达亿瓦', '伽玛卡兹', '阿布', '天元', '化氏', '汉鼎', '光威', '佳钓尼', '其他'],
    brandIndex: null,

    // --- 核心升级：九大分类的超全参数定义 ---
    typeMeta: {
      // 1. 鱼竿
      rod: {
        label: '鱼竿',
        params: [
          { key: 'length', label: '全长', unit: 'm', type: 'digit', placeholder: '如 3.6 / 1.98' },
          { key: 'power', label: '硬度', type: 'picker', options: ['UL', 'L', 'ML', 'M', 'MH', 'H', 'XH', 'XXH', '4H', '5H', '6H', '8H+'] },
          { key: 'action', label: '调性', type: 'picker', options: ['RF (超快)', 'F (快)', 'R (中)', 'S (慢)', '19调', '28调', '37调', '46调'] },
          { key: 'section', label: '节数', unit: '节', type: 'number', placeholder: '如 2' },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit' },
          { key: 'material', label: '材质', type: 'picker', options: ['高碳', '玻纤', '纳米硼', '竹制'] }
        ]
      },
      // 2. 渔轮
      reel: {
        label: '渔轮',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['纺车轮', '水滴轮', '鼓轮', '前打轮', '飞钓轮'] },
          { key: 'ratio', label: '速比', unit: '', type: 'digit', placeholder: '如 6.2' },
          { key: 'drag', label: '刹车', unit: 'kg', type: 'digit', placeholder: '最大卸力' },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit' },
          { key: 'bearing', label: '轴承', unit: '', type: 'text', placeholder: '如 11+1' },
          { key: 'capacity', label: '容线', unit: '', type: 'text', placeholder: '如 3号/150m' }
        ]
      },
      // 3. 主线
      line: {
        label: '主线',
        params: [
          { key: 'material', label: '材质', type: 'picker', options: ['PE编织', '尼龙', '碳线', '氟碳'] },
          { key: 'number', label: '线号', unit: '号', type: 'digit', placeholder: '如 1.5' },
          { key: 'strength', label: '拉力', unit: 'lb', type: 'digit', placeholder: '选填' },
          { key: 'length', label: '卷长', unit: 'm', type: 'number', placeholder: '如 100' },
          { key: 'color', label: '颜色', type: 'text', placeholder: '如 墨绿' }
        ]
      },
      // 4. 浮漂
      float: {
        label: '浮漂',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['立漂', '阿波', '七星漂', '助投器'] },
          { key: 'lead', label: '吃铅', unit: 'g', type: 'digit', placeholder: '核心参数' },
          { key: 'material', label: '材质', type: 'picker', options: ['纳米', '巴尔杉木', '芦苇', '孔雀羽', '塑料'] },
          { key: 'length', label: '全长', unit: 'cm', type: 'digit' }
        ]
      },
      // 5. 拟饵 (Lure) - 新增
      lure: {
        label: '拟饵',
        params: [
          { key: 'category', label: '型态', type: 'picker', options: ['米诺', '波爬', '铅笔', 'VIB', '亮片', '铁板', '软虫', '雷蛙', '复合亮片'] },
          { key: 'weight', label: '克重', unit: 'g', type: 'digit', placeholder: '如 7.5' },
          { key: 'length', label: '长度', unit: 'mm', type: 'number' },
          { key: 'buoyancy', label: '浮力', type: 'picker', options: ['浮水 (F)', '悬停 (SP)', '沉水 (S)', '快沉 (FS)'] },
          { key: 'depth', label: '潜深', unit: 'm', type: 'text', placeholder: '如 0.5-1.2' },
          { key: 'color', label: '色号', type: 'text', placeholder: '如 红头白身' }
        ]
      },
      // 6. 鱼钩 (Hook) - 新增
      hook: {
        label: '鱼钩',
        params: [
          { key: 'shape', label: '钩型', type: 'picker', options: ['新关东', '伊势尼', '袖钩', '千又', '伊豆', '曲柄钩', '铅头钩', '三本钩'] },
          { key: 'size', label: '号数', unit: '号', type: 'text', placeholder: '如 5 或 1/0' },
          { key: 'barb', label: '倒刺', type: 'picker', options: ['有倒刺', '无倒刺'] },
          { key: 'weight', label: '自重', unit: 'g', type: 'digit', placeholder: '铅头钩必填' },
          { key: 'quantity', label: '数量', unit: '枚', type: 'number', placeholder: '每包数量' }
        ]
      },
      // 7. 线组 (Rig) - 新增
      rig: {
        label: '线组',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['台钓主线组', '串钩', '七星漂线组', '前导线组'] },
          { key: 'length', label: '全长', unit: 'm', type: 'digit' },
          { key: 'line_size', label: '线号', unit: '号', type: 'digit' },
          { key: 'hook_size', label: '钩号', unit: '号', type: 'text', placeholder: '选填' }
        ]
      },
      // 8. 饵料 (Bait) - 新增
      bait: {
        label: '饵料',
        params: [
          { key: 'category', label: '形态', type: 'picker', options: ['粉饵', '颗粒', '酒米', '玉米/麦粒', '小药'] },
          { key: 'flavor', label: '味型', type: 'picker', options: ['腥', '香', '腥香', '酒香', '薯味', '果酸', '原味'] },
          { key: 'weight', label: '净重', unit: 'g', type: 'number' },
          { key: 'target', label: '对象', type: 'text', placeholder: '如 鲫/鲤' }
        ]
      },
      // 9. 配件 (Accessory) - 新增
      accessory: {
        label: '配件',
        params: [
          { key: 'category', label: '类型', type: 'picker', options: ['铅坠', '八字环', '别针', '太空豆', '漂座'] },
          { key: 'spec', label: '规格', type: 'text', placeholder: '如 小号 / 3g' },
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

  // ... 后面的逻辑代码 (onLoad, fillForm, handleSave 等) 基本可以复用
  // 只需要注意一点：onLoad 中获取 options.type 后，
  // 以前只有4种，现在有9种，typeMeta 已经覆盖了，所以代码逻辑通常不需要大改。
  // ...
});

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