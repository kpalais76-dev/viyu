// pages/form/index.js
const db = wx.cloud.database();
const DataWarehouse = require('../../utils/data-warehouse.js'); // 引入清洗工具

Page({
  data: {
    // --- 1. 基础数据源 (来自数据库) ---
    speciesList: [], // 鱼种字典
    speciesIndex: 0,
    
    myRods: [],      // 我的鱼竿
    rodIndex: 0,
    
    // --- 2. 表单字段 ---
    formData: {
      weight: '',
      length: '',
      line_group: '', // 线组
      method: 'taidiao', // 默认台钓
      tags: [] // 选中的标签
    },

    // --- 3. 页面状态 ---
    locationText: "定位中...",
    weatherText: "获取中...",
    
    // 技法标签池 (固定选项，也可做成数据库动态获取)
    tagOptions: ["黑漂", "顿口", "顶漂", "截口", "正口", "底钓", "浮钓", "拖拽"]
  },

  onLoad() {
    this.initEnvironment(); // 初始化环境
    this.loadDictionaries(); // 加载字典和装备
  },

  // --- A. 初始化环境 (位置/天气) ---
  initEnvironment() {
    // 1. 获取位置
    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        // 实际开发这里调用地图API转成中文地址，暂时用经纬度代替或写死
        this.setData({ locationText: `经度${res.longitude.toFixed(2)}, 纬度${res.latitude.toFixed(2)}` });
      },
      fail: () => {
        this.setData({ locationText: "未知钓点" });
      }
    });
    // 2. 模拟天气 (实际可调用和风天气API)
    this.setData({ weatherText: "25℃ / 1012hPa" });
  },

  // --- B. 加载数据库字典 ---
  async loadDictionaries() {
    wx.showLoading({ title: '准备物资...' });

    try {
      // 1. 拉取鱼种
      const speciesRes = await db.collection('species_dict').get();
      // 2. 拉取我的鱼竿 (Category = rod)
      const gearRes = await db.collection('gear').where({ category: 'rod' }).get();
      
      this.setData({
        speciesList: speciesRes.data, // 存入 data 供 picker 使用
        myRods: gearRes.data
      });
      wx.hideLoading();

    } catch (err) {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: '数据加载失败', icon: 'none' });
    }
  },

  // --- C. 表单交互 ---
  // 切换鱼种
  bindSpeciesChange(e) {
    this.setData({ speciesIndex: e.detail.value });
  },
  // 切换装备
  bindRodChange(e) {
    this.setData({ rodIndex: e.detail.value });
  },
  // 输入通用字段
  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`formData.${field}`]: e.detail.value });
  },
  // 切换标签 (多选)
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    let tags = this.data.formData.tags;
    if (tags.includes(tag)) {
      tags = tags.filter(t => t !== tag); // 反选
    } else {
      tags.push(tag); // 选中
    }
    this.setData({ 'formData.tags': tags });
  },

  // --- D. 核心：保存提交 ---
  handleSave() {
    const { speciesList, speciesIndex, myRods, rodIndex, formData, locationText, weatherText } = this.data;

    // 1. 校验必填
    if (!formData.weight) {
      return wx.showToast({ title: '记得填重量哦', icon: 'none' });
    }

    wx.showLoading({ title: '存入战绩...' });

    // 2. 组装原始数据 (Raw Data)
    const rawData = {
      species: speciesList[speciesIndex]?.name || "未知鱼种",
      weight: formData.weight,
      length: formData.length,
      
      // 装备快照：直接存名称，防止以后删了装备导致记录失效
      gear_rod: myRods[rodIndex]?.name || "手线",
      gear_line: formData.line_group,
      method: formData.method,
      
      location: locationText,
      // 这里简单解析一下天气字符串
      weather_temp: 25, // 暂时写死，后续接API
      weather_pressure: 1012,
      
      tags: formData.tags,
      mode: 'manual' // 标记为手动录入
    };

    // 3. 召唤数据清洗器 (DataWarehouse) !!!
    const cleanData = DataWarehouse.wash(rawData);

    // 4. 存入云数据库
    db.collection('fishing_logs').add({
      data: cleanData
    }).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '记录成功！', icon: 'success' });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }).catch(err => {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    });
  }
});