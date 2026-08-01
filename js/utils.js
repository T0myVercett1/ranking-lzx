/* === 通用工具函数 === */

/**
 * 将双语剧目名称渲染为 HTML
 * 格式: "Macbeth——麦克白" → 英文部分用花体，中文部分用衬线体
 * @param {string} playName - 双语剧名，格式 "English——中文"
 * @returns {string} HTML字符串
 */
function formatPlayNameHTML(playName) {
  if (!playName || !playName.includes('——')) {
    return escapeHTML(playName || '');
  }
  const idx = playName.indexOf('——');
  const en = playName.slice(0, idx);
  const zh = playName.slice(idx + 2); // 跳过 "——" 两个字符
  return `<span class="play-name-en">${escapeHTML(en)}</span><span class="play-name-zh">——${escapeHTML(zh)}</span>`;
}

/**
 * HTML 转义
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
