// utils/constants.js

// 1. 军火库九大分类定义 (GEAR_TYPES)
const GEAR_TYPES = [
  // --- 第一梯队：核心资产 ---
  { key: 'rod', name: '鱼竿', icon: '🎣' },
  { key: 'reel', name: '渔轮', icon: '⚙️' },
  { key: 'line', name: '主线', icon: '🧵' }, 
  { key: 'float', name: '浮漂', icon: '📍' },

  // --- 第二梯队：战术终端 ---
  { key: 'lure', name: '拟饵', icon: '🐟' }, 
  { key: 'hook', name: '鱼钩', icon: '🪝' },

  // --- 第三梯队：后勤与辅件 ---
  { key: 'rig', name: '线组', icon: '🕸️' },
  { key: 'bait', name: '饵料', icon: '🍬' },
  { key: 'accessory', name: '配件', icon: '🛠️' }
];

// 2. 钓法定义 (FISHING_METHODS)
const FISHING_METHODS = [
  { 
    key: 'tai', 
    name: '台钓/悬坠', 
    desc: '精准底钓与浮钓',
    slots: ['rod', 'line', 'float', 'hook', 'bait'] 
  },
  { 
    key: 'lure', 
    name: '路亚/拟钓', 
    desc: '主动攻击的艺术',
    slots: ['rod', 'reel', 'line', 'lure', 'accessory'] 
  },
  { 
    key: 'iso', 
    name: '矶钓/海钓', 
    desc: '博弈巨物的防线',
    slots: ['rod', 'reel', 'line', 'float', 'rig', 'bait', 'accessory'] 
  },
  { 
    key: 'traditional', 
    name: '传统/溪流', 
    desc: '极简的高效',
    slots: ['rod', 'rig', 'hook', 'bait']
  }
];

module.exports = {
  GEAR_TYPES,
  FISHING_METHODS
};