// pages/spot/form/index.js
const db = wx.cloud.database();

Page({
  data: {
    isEdit: false,
    id: null,

    // 表单数据
    name: '',
    address: '',
    latitude: null,
    longitude: null,
    
    // 环境特征 (文档 2.3.1)
    waterType: '',
    depthRange: '',
    waterQuality: '',
    
    // 选项字典
    options: {
      waterType: ['水库', '湖泊', '河流', '黑坑/池塘', '溪流', '近海', '矶石区'],
      waterQuality: ['清澈', '一般', '浑浊', '肥水', '瘦水'],
      depthRange: ['0-1米', '1-3米', '3-5米', '5-10米', '10米+']
    },
    
    idx: { waterType: -1, waterQuality: -1, depthRange: -1 }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, id: options.id });
      this.loadDetail(options.id);
    } else {
      wx.setNavigationBarTitle({ title: '新增钓点' });
    }
  },

  // 加载详情
  async loadDetail(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await db.collection('fishing_spots').doc(id).get();
      const d = res.data;
      
      // 回填 Picker 索引
      const opt = this.data.options;
      this.setData({
        name: d.name,
        address: d.address,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        waterType: d.water_type,
        waterQuality: d.water_quality,
        depthRange: d.depth_range,
        idx: {
          waterType: opt.waterType.indexOf(d.water_type),
          waterQuality: opt.waterQuality.indexOf(d.water_quality),
          depthRange: opt.depthRange.indexOf(d.depth_range)
        }
      });
      wx.hideLoading();
    } catch (e) { wx.hideLoading(); }
  },

  // --- 核心：打开地图选点 ---
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        // 选中后自动回填
        this.setData({
          name: res.name, // 自动填名字(如: xx水库)
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        // 如果用户取消或未授权，不阻塞流程
        console.log(err);
      }
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const index = e.detail.value;
    const key = field.replace('idx.', ''); // 'waterType'
    
    this.setData({
      [field]: index, // 更新索引
      [key]: this.data.options[key][index] // 更新实际值
    });
  },

  async submit() {
    const d = this.data;
    if (!d.name) return wx.showToast({ title: '请输入钓点名称', icon: 'none' });

    wx.showLoading({ title: '保存中...' });

    const payload = {
      name: d.name,
      address: d.address,
      // GeoPoint 格式
      location: db.Geo.Point(d.longitude || 0, d.latitude || 0),
      
      // 环境特征
      water_type: d.waterType,
      water_quality: d.waterQuality,
      depth_range: d.depthRange,
      
      _updateTime: new Date()
    };

    try {
      if (d.isEdit) {
        await db.collection('fishing_spots').doc(d.id).update({ data: payload });
      } else {
        payload._createTime = new Date();
        await db.collection('fishing_spots').add({ data: payload });
      }
      
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);

    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});