// pages/record/create/index.js
const db = wx.cloud.database();
const util = require('../../../utils/util.js');

Page({
  data: {
    currentStep: 1, // 1:准备, 2:作钓, 3:复盘

    // --- 资源数据 ---
    mySpots: [],
    mySetups: [],
    spotIndex: -1,
    setupIndex: -1,

    // --- Step 1: 环境 ---
    env: {
      weather: '', depth: '', turbidity: '', current: ''
    },
    envOptions: {
      turbidity: ['清澈', '略浑', '浑浊', '肥水', '瘦水'],
      current: ['静水', '缓流', '中流', '急流']
    },
    baitInfo: '',

    // --- Step 2: 实战 ---
    startTime: null, // 开竿时间对象
    displayTime: '00:00:00', // 计时显示(模拟)
    catches: [], // [{fishName, weight, timeStr}]
    images: [],
    
    // 中鱼弹窗
    showModal: false,
    tempCatch: { name: '', weight: '' },

    // --- Step 3: 结算 ---
    endTime: null,
    title: '',
    note: '',
    suggestion: '',
    
    // 统计
    totalCount: 0,
    totalWeight: 0,
    durationStr: '0小时0分'
  },

  onLoad() {
    this.loadResources();
    // 默认标题
    const now = new Date();
    this.setData({
      title: `${now.getMonth()+1}月${now.getDate()}日作钓记录`
    });
  },

  async loadResources() {
    try {
      const [setupRes, spotRes] = await Promise.all([
        db.collection('tactical_setups').orderBy('_updateTime', 'desc').get(),
        db.collection('fishing_spots').orderBy('_updateTime', 'desc').get()
      ]);
      this.setData({ mySetups: setupRes.data, mySpots: spotRes.data });
    } catch (e) { console.error(e); }
  },

  // --- 流程控制 ---
  nextStep() {
    if (this.data.currentStep === 1) {
      // 验证开竿数据
      if (this.data.spotIndex < 0) return wx.showToast({ title: '请先关联钓点', icon: 'none' });
      if (this.data.setupIndex < 0) return wx.showToast({ title: '请先配置战术', icon: 'none' });
      
      // 进入 Step 2: 记录开竿时间
      this.setData({ 
        currentStep: 2,
        startTime: new Date()
      });
      this.startTimer();
    } 
    else if (this.data.currentStep === 2) {
      // 进入 Step 3: 记录收竿时间，计算时长
      const end = new Date();
      const start = this.data.startTime;
      const diffMs = end - start;
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);

      this.setData({
        currentStep: 3,
        endTime: end,
        durationStr: `${hrs}小时${mins}分`
      });
    }
  },

  prevStep() {
    this.setData({ currentStep: this.data.currentStep - 1 });
  },

  // --- 计时器 (简单模拟) ---
  startTimer() {
    // 实际项目中这里可以用 setInterval 实时更新 displayTime
    // 这里为了演示，简单显示为 "作钓中"
  },

  // --- 输入处理 ---
  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },
  onEnvInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`env.${field}`]: e.detail.value });
  },
  onEnvPicker(e) {
    const field = e.currentTarget.dataset.field;
    const idx = e.detail.value;
    const options = field === 'turbidity' ? this.data.envOptions.turbidity : this.data.envOptions.current;
    this.setData({ [`env.${field}`]: options[idx] });
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  // --- 渔获操作 ---
  showCatchModal() {
    this.setData({ showModal: true, tempCatch: { name: '', weight: '' } });
  },
  closeModal() {
    this.setData({ showModal: false });
  },
  onModalInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`tempCatch.${field}`]: e.detail.value });
  },
  confirmCatch() {
    const { name, weight } = this.data.tempCatch;
    if (!name) return;
    
    const now = new Date();
    const timeStr = `${util.formatNumber(now.getHours())}:${util.formatNumber(now.getMinutes())}`;
    
    const newCatch = {
      fishName: name,
      weight: weight || 0,
      timeStr: timeStr,
      count: 1 // 默认为1尾
    };

    const list = this.data.catches;
    list.push(newCatch);
    
    // 更新统计
    this.recalcStats(list);
    
    this.setData({ catches: list, showModal: false });
  },
  removeCatch(e) {
    const idx = e.currentTarget.dataset.index;
    const list = this.data.catches;
    list.splice(idx, 1);
    this.recalcStats(list);
    this.setData({ catches: list });
  },
  recalcStats(list) {
    let c = 0, w = 0;
    list.forEach(item => {
      c += 1;
      w += Number(item.weight) || 0;
    });
    this.setData({ totalCount: c, totalWeight: w.toFixed(1) });
  },

  // 图片
  chooseImage() {
    wx.chooseMedia({
      count: 9, mediaType: ['image'],
      success: (res) => {
        this.setData({ images: this.data.images.concat(res.tempFiles.map(f => f.tempFilePath)) });
      }
    });
  },

  // --- 最终提交 ---
  async submit() {
    wx.showLoading({ title: '归档中...' });
    const d = this.data;
    const spot = d.mySpots[d.spotIndex] || { name: '未知钓点' };
    const setup = d.mySetups[d.setupIndex];

    try {
      await db.collection('fishing_records').add({
        data: {
          // 文档 2.4.1 字段映射
          title: d.title,
          
          // 时间信息
          start_time: d.startTime,
          end_time: d.endTime,
          duration_str: d.durationStr,
          date_str: util.formatTime(d.startTime).split(' ')[0],

          // 关联信息
          spot_id: spot._id,
          spot_name: spot.name,
          setup_id: setup._id,
          setup_snapshot: setup, // 战术快照

          // 环境信息
          env: d.env,
          bait_info: d.baitInfo,

          // 渔获数据
          catches: d.catches,
          total_count: d.totalCount,
          total_weight: Number(d.totalWeight),

          // 总结
          note: d.note,
          suggestion: d.suggestion,
          images: d.images,

          _createTime: new Date(),
          _updateTime: new Date()
        }
      });
      wx.hideLoading();
      wx.showToast({ title: '记录已保存', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/record/index' }), 1500);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});