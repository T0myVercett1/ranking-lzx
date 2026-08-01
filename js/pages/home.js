/* === 首页逻辑 === */

(function () {
  'use strict';

  // 确保剧目池有默认数据
  const pool = PlayPoolStore.getAll();
  if (!pool || pool.length !== 10) {
    PlayPoolStore.reset();
  }

  console.log('🎭 The Bard\'s Blind Ranking — 已就绪');
  console.log('   当前剧目池:', pool.join(', '));
})();
