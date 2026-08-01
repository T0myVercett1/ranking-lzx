/* === 结果页逻辑 === */

(function () {
  'use strict';

  // === DOM 引用 ===
  const resultList = document.getElementById('result-list');
  const btnShare = document.getElementById('btn-share');
  const btnCopy = document.getElementById('btn-copy');
  const shareModal = document.getElementById('share-modal');
  const shareClose = document.getElementById('share-close');
  const shareImageContainer = document.getElementById('share-image-container');
  const toast = document.getElementById('toast');

  // === Toast ===
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('toast--visible');
    toastTimer = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 2500);
  }

  // === 获取排名数据 ===
  function getRankingData() {
    // 从历史记录获取最近一条
    const history = HistoryStore.getAll();
    if (history.length > 0) {
      return {
        rankings: history[0].rankings,
        timestamp: history[0].timestamp
      };
    }
    return null;
  }

  // === 获取网站地址 ===
  function getSiteUrl() {
    const href = window.location.href;
    // 如果是本地文件，提示部署后可用
    if (href.startsWith('file://')) {
      return null; // QR码生成时会自动用备用方案
    }
    // 将 result.html 替换为 index.html
    return href.replace(/result\.html(\?.*)?(#.*)?$/, 'index.html');
  }

  // === 渲染排名列表 ===
  function renderRankings(data) {
    if (!data || !data.rankings || data.rankings.length === 0) {
      resultList.innerHTML = `
        <div class="text-center" style="padding: var(--space-xl);">
          <p style="font-size: var(--text-lg);">🎭 暂无排名数据</p>
          <a href="game.html" class="btn btn--primary" style="margin-top: var(--space-lg);">开始新游戏</a>
        </div>
      `;
      btnShare.style.display = 'none';
      btnCopy.style.display = 'none';
      return;
    }

    resultList.innerHTML = '';
    data.rankings.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'result-item fade-in';
      row.style.animationDelay = (index * 0.08) + 's';

      const rankEl = document.createElement('span');
      rankEl.className = 'result-item__rank';
      rankEl.textContent = item.rank;

      const nameEl = document.createElement('span');
      nameEl.className = 'result-item__name';
      nameEl.textContent = item.playName;

      row.appendChild(rankEl);
      row.appendChild(nameEl);
      resultList.appendChild(row);
    });
  }

  // === 格式化排名文本 ===
  function formatRankingText(data) {
    if (!data || !data.rankings) return '';

    const dateStr = data.timestamp
      ? new Date(data.timestamp).toLocaleString('zh-CN')
      : '';

    let text = '🎭 我的莎士比亚盲选排名\n';
    if (dateStr) {
      text += dateStr + '\n';
    }
    text += '━━━━━━━━━━━━\n';

    data.rankings.forEach((item) => {
      const medal = item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : '  ';
      text += `${medal} ${item.rank}. ${item.playName}\n`;
    });

    text += '━━━━━━━━━━━━\n';
    text += '来玩莎士比亚盲选排名游戏吧！';
    return text;
  }

  // === 复制排名文本 ===
  async function handleCopy() {
    const data = getRankingData();
    if (!data) {
      showToast('⚠ 没有可复制的排名数据');
      return;
    }

    const text = formatRankingText(data);

    try {
      await navigator.clipboard.writeText(text);
      showToast('✅ 排名已复制！可以粘贴分享给朋友');
    } catch (e) {
      // 降级方案：创建临时文本域
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('✅ 排名已复制！可以粘贴分享给朋友');
      } catch (err) {
        showToast('⚠ 复制失败，请尝试截图分享');
      }
      document.body.removeChild(textarea);
    }
  }

  // === 生成分享图片 ===
  async function handleShare() {
    const data = getRankingData();
    if (!data || !data.rankings) {
      showToast('⚠ 没有可分享的排名数据');
      return;
    }

    // 显示 loading
    shareImageContainer.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--color-ink-light);">🎨 正在生成复古卡片...</p>';
    shareModal.classList.add('modal-overlay--visible');

    try {
      const siteUrl = getSiteUrl();
      const canvas = await ShareImage.generate(data.rankings, siteUrl);
      shareImageContainer.innerHTML = '';

      // 创建 img 展示（方便长按保存）
      const dataUrl = canvas.toDataURL('image/png');
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = '莎士比亚排名卡片';
      img.style.cssText = 'max-width:100%;border-radius:4px;box-shadow:0 2px 12px rgba(0,0,0,0.15);';
      shareImageContainer.appendChild(img);

      // 提示保存方式
      const tip = document.createElement('p');
      tip.style.cssText = 'text-align:center;margin-top:0.75rem;font-size:0.85rem;color:var(--color-ink-muted);';
      tip.textContent = '💡 长按图片 → 保存到相册，即可分享给朋友';
      shareImageContainer.appendChild(tip);

    } catch (e) {
      console.error('生成分享图片失败:', e);
      shareImageContainer.innerHTML = '<p style="text-align:center;color:var(--color-danger);padding:1rem;">生成失败，请重试</p>';
    }
  }

  // === 事件绑定 ===
  btnShare.addEventListener('click', handleShare);
  btnCopy.addEventListener('click', handleCopy);

  shareClose.addEventListener('click', () => {
    shareModal.classList.remove('modal-overlay--visible');
  });
  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) shareModal.classList.remove('modal-overlay--visible');
  });

  // === 初始化 ===
  const data = getRankingData();
  renderRankings(data);
  CurrentGameStore.clear();
})();
