// miniprogram/utils/data-warehouse.js

const DataWarehouse = {
  /**
   * 核心功能：将前端的原始表单数据，清洗为符合“五维分析”的宽表数据
   * @param {Object} rawData 前端收集到的原始对象
   */
  wash(rawData) {
    const now = new Date();
    
    return {
      // 1. 基础业务数据
      species_name: rawData.species,
      weight: parseFloat(rawData.weight) || 0,
      length: parseFloat(rawData.length) || 0,
      image_url: rawData.image || "",
      
      // 2. 装备快照 (Snapshot)
      // 为什么存快照？因为你的装备以后可能卖了，但历史记录里的装备不能变
      gear_rod: rawData.gear_rod || "未知",
      gear_reel: rawData.gear_reel || "未知",
      gear_line: rawData.gear_line || "未知",
      method: rawData.method || "taidiao", // taidiao / lure / iso

      // 3. 时间维度拆解 (Time Atomization)
      // 把时间拆碎，Excel 透视表才能拖拽分析“周六鱼情” vs “周一鱼情”
      record_time: now,
      dt_year: now.getFullYear(),
      dt_month: now.getMonth() + 1,
      dt_day: now.getDate(),
      dt_hour: now.getHours(),
      dt_week: now.getDay(), // 0-6
      dt_is_weekend: (now.getDay() === 0 || now.getDay() === 6),

      // 4. 环境数据清洗
      location_name: rawData.location || "未知地点",
      // 如果有气象数据，确保转为数字
      env_temp: parseFloat(rawData.weather_temp) || 0,
      env_pressure: parseFloat(rawData.weather_pressure) || 0,

      // 5. 技法标签扁平化 (Tag Flattening)
      // 将数组 ["黑漂", "底钓"] 转换成独立的开关，方便 SQL 查询
      tech_is_bottom: (rawData.tags || []).includes("底钓"),
      tech_is_float: (rawData.tags || []).includes("浮钓"),
      signal_black_drift: (rawData.tags || []).includes("黑漂"),
      signal_fast_drop: (rawData.tags || []).includes("顿口"),
      
      // 元数据
      _createTime: new Date(), // 这里先用本地时间，存入云端时会自动覆盖
      entry_mode: rawData.mode || 'instant' // 'instant' 或 'batch'
    };
  }
};

module.exports = DataWarehouse;