// cloudfunctions/gear_manager/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { type, payload } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // ==================================================
  // 功能 1: 搜索公共库 (支持 69码 或 关键词)
  // ==================================================
  if (type === 'search_global') {
    const { barcode, keyword } = payload;
    let query = {};
    
    // 优先匹配条形码
    if (barcode) {
      query.barcode = barcode;
    } 
    // 其次匹配关键词 (模糊搜索)
    else if (keyword) {
      // 这里的逻辑是：品牌或名称包含关键词
      query = _.or([
        { brand: db.RegExp({ regexp: keyword, options: 'i' }) },
        { name: db.RegExp({ regexp: keyword, options: 'i' }) }
      ]);
    } else {
      return { found: false };
    }

    // 执行查询
    const res = await db.collection('global_gear_library')
      .where(query)
      .orderBy('usage_count', 'desc') // 优先显示用的人多的
      .limit(1)
      .get();
    
    if (res.data.length > 0) {
      return { found: true, data: res.data[0] };
    } else {
      return { found: false };
    }
  }

  // ==================================================
  // 功能 2: 入库操作 (核心逻辑)
  // ==================================================
  if (type === 'add_gear') {
    const { gearData, shareToPublic } = payload;
    
    // ------------------------------------------
    // A. 存入个人私有库 (100% 执行)
    // ------------------------------------------
    const privateData = {
      ...gearData,
      _openid: openid,
      usage_count: 0, 
      source: shareToPublic ? 'contribution' : 'private', // 标记来源
      _createTime: db.serverDate(),
      _updateTime: db.serverDate(),
      status: 'active'
    };
    // 清理掉可能带进来的 _id，确保生成新的私有ID
    delete privateData._id; 

    const privateRes = await db.collection('gear').add({ data: privateData });

    // ------------------------------------------
    // B. 处理公共库逻辑
    // ------------------------------------------
    // 只有当：用户同意共享 AND 有条形码 时，才操作公共库
    if (shareToPublic && gearData.barcode) {
      
      // 先查一下公共库有没有这个条码
      const countRes = await db.collection('global_gear_library')
        .where({ barcode: gearData.barcode })
        .count();

      if (countRes.total === 0) {
        // [情况 1]: 公共库没有 -> 恭喜！你是“首位贡献者”
        const publicData = {
          ...gearData,
          contributor_name: '热心钓友', // 后续可对接用户信息
          contributor_uid: openid,      // 记录你的功劳
          usage_count: 1,               // 初始只有你在用
          _createTime: db.serverDate(),
          _updateTime: db.serverDate()
        };
        delete publicData._id;

        try {
          await db.collection('global_gear_library').add({ data: publicData });
          // TODO: 这里可以给用户发积分或成就
        } catch (e) {
          console.error('公共库插入失败', e);
        }

      } else {
        // [情况 2]: 公共库已有 -> 引用数 +1
        await db.collection('global_gear_library')
          .where({ barcode: gearData.barcode })
          .update({
            data: {
              usage_count: _.inc(1) // 原子自增
            }
          });
        
        // TODO: 这里是触发“感谢信”的最佳时机
        // 逻辑：找到 contributor_uid，往 notifications 表插一条消息
      }
    }

    return { success: true, id: privateRes._id };
  }

  return { success: false, msg: 'Unknown type' };
};