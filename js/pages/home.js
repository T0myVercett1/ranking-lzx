/* === 首页逻辑 === */

(function () {
  'use strict';

  // 检测是否为旧格式数据（纯中文无「——」分隔符），自动迁移
  const pool = PlayPoolStore.getAll();
  const isOldFormat = pool && pool.length > 0 && !pool[0].includes('——');

  if (!pool || pool.length === 0 || isOldFormat) {
    PlayPoolStore.reset();
  }

  console.log('🎭 The Bard\'s Blind Ranking — 已就绪');
  console.log('   当前剧目池:', PlayPoolStore.getAll().join(', '));
})();
