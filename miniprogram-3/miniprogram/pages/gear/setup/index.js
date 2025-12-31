const db = wx.cloud.database();
const { FISHING_METHODS } = require('../../../utils/constants.js');

const SPEC_MAP = {
  length: '全长', power: '硬度', action: '调性', section: '节数', weight: '自重',
  ratio: '速比', drag: '刹车', bearing: '轴承',
  number: '线号', material: '材质', strength: '拉力', diameter: '线径',
  lead: '吃铅', price: '参考价'
};

Page({
  data: {
    editId: null,
    selectedMethod: 'traditional',
    currentMethodName: '传统钓',
    needsReel: false,
    needsFloat: true,
    rods: [], reels: [], lines: [], floats: [],
    rodIndex: -1, reelIndex: -1, lineIndex: -1, floatIndex: -1,
    setupName: '',
    desc: '',
    showPosterModal: false,
    posterUrl: '',
    userInfo: { name: '钓鱼大师', avatar: '' }
  },

  onLoad(options) {
    const methodKey = options.method || 'traditional';
    const methods = FISHING_METHODS || [];
    const methodObj = methods.find(m => m.key === methodKey);
    const methodName = methodObj ? methodObj.name : '未知钓法';
    this.setData({ selectedMethod: methodKey, currentMethodName: methodName });
    this.updateLogic(methodKey);
    this.loadInventory(() => {
      if (options.id) {
        this.setData({ editId: options.id });
        wx.setNavigationBarTitle({ title: '编辑方案' });
        this.loadSetupData(options.id);
      }
    });
  },

  updateLogic(method) {
    let needsReel = false;
    let needsFloat = true;
    if (['iso', 'sea', 'lure'].includes(method)) needsReel = true;
    if (['sea', 'lure'].includes(method)) needsFloat = false;
    this.setData({ needsReel, needsFloat });
  },

  bindPick(e) { this.setData({ [e.currentTarget.dataset.type + 'Index']: Number(e.detail.value) }); },
  handleInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }); },
  
  loadInventory(cb) {
    wx.showLoading({ title: '加载资源...' });
    const q = (c) => db.collection('gear').where({ category: c }).get();
    Promise.all([q('rod'), q('reel'), q('line'), q('float')]).then(res => {
      this.setData({ rods: res[0].data, reels: res[1].data, lines: res[2].data, floats: res[3].data });
      wx.hideLoading();
      if (cb) cb();
    }).catch(err => { wx.hideLoading(); });
  },

  loadSetupData(id) {
    db.collection('gear_setups').doc(id).get().then(res => {
      const d = res.data;
      const f = (list, item) => item ? list.findIndex(o => o._id === item._id) : -1;
      this.setData({
        setupName: d.name, desc: d.desc,
        selectedMethod: d.method_key || this.data.selectedMethod,
        currentMethodName: d.method_name || this.data.currentMethodName,
        rodIndex: f(this.data.rods, d.rod),
        reelIndex: f(this.data.reels, d.reel),
        lineIndex: f(this.data.lines, d.line),
        floatIndex: f(this.data.floats, d.float)
      });
      if(d.method_key) this.updateLogic(d.method_key);
    });
  },

  handleSave() {
    const { editId, setupName, desc, selectedMethod, currentMethodName, rods, rodIndex, reels, reelIndex, lines, lineIndex, floats, floatIndex } = this.data;
    if (!setupName) return wx.showToast({ title: '代号必填', icon: 'none' });
    if (rodIndex < 0) return wx.showToast({ title: '未选主武器', icon: 'none' });

    const getGear = (list, idx) => (list && idx > -1 ? list[idx] : null);
    const payload = {
      name: setupName, desc, method_key: selectedMethod, method_name: currentMethodName,
      rod: getGear(rods, rodIndex),
      reel: getGear(reels, reelIndex),
      line: getGear(lines, lineIndex),
      float: getGear(floats, floatIndex),
      _updateTime: db.serverDate()
    };

    wx.showLoading({ title: '同步数据...' });
    const action = editId ? db.collection('gear_setups').doc(editId).update({ data: payload }) : db.collection('gear_setups').add({ data: { ...payload, _createTime: db.serverDate() } });

    action.then((res) => {
      wx.hideLoading();
      wx.showToast({ title: '已同步', icon: 'success' });
      if (!editId) this.setData({ editId: res._id });
    }).catch(err => { wx.hideLoading(); wx.showToast({ title: '同步失败', icon: 'none' }); });
  },
  
  handleCopyCode() {
    if (!this.data.editId) return;
    wx.setClipboardData({ data: `#知渔#${this.data.editId}` });
  },

  handleGeneratePoster() {
    if (!this.data.editId) return;
    wx.showLoading({ title: '渲染蓝图...' });

    const query = wx.createSelectorQuery();
    query.select('#shareCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) { wx.hideLoading(); return; }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;

      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);

      this.drawCanvasContent(ctx, res[0].width).then((actualHeight) => {
        wx.canvasToTempFilePath({
          canvas,
          height: actualHeight, 
          destHeight: actualHeight * dpr,
          success: (fileRes) => {
            wx.hideLoading();
            this.setData({ posterUrl: fileRes.tempFilePath, showPosterModal: true });
          },
          fail: () => { wx.hideLoading(); wx.showToast({ title: '渲染失败', icon: 'none' }); }
        });
      });
    });
  },

  closePosterModal() { this.setData({ showPosterModal: false }); },

  savePosterToPhone() {
    if (!this.data.posterUrl) return;
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterUrl,
      success: () => {
        wx.showToast({ title: '已保存', icon: 'success' });
        this.closePosterModal();
      },
      fail: () => { wx.showToast({ title: '需相册权限', icon: 'none' }); }
    });
  },

  drawRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  },

  // ==========================================
  // 核心绘图逻辑 (Header优化 + 全码显示)
  // ==========================================
  drawCanvasContent(ctx, w) {
    return new Promise((resolve) => {
      const { setupName, currentMethodName, desc, userInfo, editId } = this.data;
      const MARGIN = 30; 
      const COL_GAP = 20; 
      
      // 1. 画布背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, 2000);

      let currentY = 50;

      // --- Header 优化: 错位排版 ---
      // 左侧主标题
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('ZHIYU TACTICAL.', MARGIN, currentY);
      
      // 右侧信息 (下移 24px，避免碰撞)
      currentY += 28;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#666';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`COMMANDER: ${userInfo.name.toUpperCase()}`, w - MARGIN, currentY);
      
      currentY += 15;
      // 顶部分割线
      ctx.fillStyle = '#000';
      ctx.fillRect(MARGIN, currentY, w - MARGIN * 2, 4);
      currentY += 40;

      // 3. 方案标题与标签
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000';
      ctx.font = '800 36px sans-serif';
      ctx.fillText(setupName, MARGIN, currentY);
      currentY += 40;

      const tagW = ctx.measureText(currentMethodName).width + 20;
      ctx.fillStyle = '#2962FF';
      ctx.fillRect(MARGIN, currentY - 14, tagW, 20); 
      
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(currentMethodName, MARGIN + 10, currentY);
      
      if(desc) {
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.fillText(desc, MARGIN + tagW + 10, currentY);
      }
      currentY += 40;

      // 4. 装备矩阵 (2x2 Grid)
      const cellWidth = (w - MARGIN * 2 - COL_GAP) / 2;
      
      const drawGridCell = (x, y, categoryEn, categoryCn, item) => {
        if(!item || !item.name) {
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = '#EEE';
            ctx.strokeRect(x, y, cellWidth, 100);
            ctx.setLineDash([]);
            return 100;
        }

        let cellY = y;
        ctx.fillStyle = '#999';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${categoryCn} ${categoryEn}`, x, cellY);
        cellY += 20;

        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px sans-serif';
        const name = item.name;
        if(ctx.measureText(name).width > cellWidth) {
            const shortName = name.substring(0, 8) + '...';
            ctx.fillText(shortName, x, cellY);
        } else {
            ctx.fillText(name, x, cellY);
        }
        cellY += 20;

        if (item.brand) {
            ctx.fillStyle = '#2962FF';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(item.brand.toUpperCase(), x, cellY);
            cellY += 25;
        } else {
            cellY += 5;
        }

        ctx.font = '11px sans-serif';
        if (item.specs) {
            Object.keys(item.specs).forEach(key => {
                if (item.specs[key] && SPEC_MAP[key]) {
                    ctx.fillStyle = '#888';
                    ctx.fillText(SPEC_MAP[key], x, cellY);
                    const valX = x + 35;
                    ctx.fillStyle = '#000';
                    ctx.fillText(item.specs[key], valX, cellY);
                    cellY += 16;
                }
            });
        } else if (item.param) {
            ctx.fillStyle = '#333';
            ctx.fillText(item.param, x, cellY);
            cellY += 16;
        }
        return cellY - y;
      };

      const { rods, rodIndex, reels, reelIndex, lines, lineIndex, floats, floatIndex } = this.data;
      const getGear = (list, idx) => (list && idx > -1 ? list[idx] : null);

      const row1_Y = currentY;
      const h1 = drawGridCell(MARGIN, row1_Y, 'ROD', '鱼竿', getGear(rods, rodIndex));
      const h2 = this.data.needsReel 
        ? drawGridCell(MARGIN + cellWidth + COL_GAP, row1_Y, 'REEL', '渔轮', getGear(reels, reelIndex))
        : 0;
      const row1_H = Math.max(h1, h2, 80) + 30;
      
      ctx.fillStyle = '#EEE';
      ctx.fillRect(MARGIN, row1_Y + row1_H - 15, w - MARGIN * 2, 1);
      
      const row2_Y = row1_Y + row1_H;
      const h3 = drawGridCell(MARGIN, row2_Y, 'LINE', '线组', getGear(lines, lineIndex));
      const h4 = this.data.needsFloat
        ? drawGridCell(MARGIN + cellWidth + COL_GAP, row2_Y, 'FLOAT', '浮漂', getGear(floats, floatIndex))
        : 0;
      const row2_H = Math.max(h3, h4, 80) + 20;

      const totalGridH = row1_H + row2_H;
      ctx.fillStyle = '#EEE';
      ctx.fillRect(w / 2, row1_Y, 1, totalGridH - 30);

      currentY = row2_Y + row2_H + 10;

      // 5. 底部口令区优化 (加高、换行)
      const boxH = 90; // 加高至 90px
      ctx.fillStyle = '#F5F5F5';
      this.drawRoundRect(ctx, MARGIN, currentY, w - MARGIN * 2, boxH, 8);
      
      // 第一行：标题
      ctx.textAlign = 'center';
      ctx.fillStyle = '#666';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('配置口令 / CONFIG CODE', w / 2, currentY + 30);
      
      // 第二行：完整口令 (调整字号确保显示全)
      const fullCode = `#知渔#${editId}`;
      ctx.fillStyle = '#000';
      
      // 根据长度动态调整字号
      if (fullCode.length > 30) {
        ctx.font = 'bold 12px monospace'; // 极长ID用小字
      } else {
        ctx.font = 'bold 14px monospace'; // 正常ID用中字
      }
      ctx.fillText(fullCode, w / 2, currentY + 60);

      currentY += boxH + 30;

      // 6. 底部署名
      ctx.textAlign = 'center';
      ctx.fillStyle = '#CCC';
      ctx.font = '10px sans-serif';
      ctx.fillText('Generated by ZhiYu App', w / 2, currentY);

      currentY += 40; // 最终底部余量

      resolve(currentY);
    });
  }
});