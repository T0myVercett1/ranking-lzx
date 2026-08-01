/* === 历史记录页逻辑 === */

(function () {
  'use strict';

  // === DOM 引用 ===
  const historyList = document.getElementById('history-list');
  const historyEmpty = document.getElementById('history-empty');
  const historyActions = document.getElementById('history-actions');
  const btnClearAll = document.getElementById('btn-clear-all');
  const toast = document.getElementById('toast');
  const modalOverlay = document.getElementById('modal-confirm');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  // === Toast ===
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('toast--visible');
    toastTimer = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 2000);
  }

  // === 格式化日期 ===
  function formatDate(timestamp) {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  // === 渲染历史列表 ===
  function render() {
    const history = HistoryStore.getAll();

    if (history.length === 0) {
      historyEmpty.style.display = 'block';
      historyList.innerHTML = '';
      historyActions.style.display = 'none';
      return;
    }

    historyEmpty.style.display = 'none';
    historyActions.style.display = 'block';
    historyList.innerHTML = '';

    history.forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'history-item';

      // 头部
      const header = document.createElement('div');
      header.className = 'history-item__header';

      const leftSide = document.createElement('div');

      const dateEl = document.createElement('div');
      dateEl.className = 'history-item__date';
      dateEl.textContent = formatDate(entry.timestamp);

      // 显示前三名预览
      const top3 = entry.rankings.slice(0, 3)
        .map(r => r.playName)
        .join(' · ');

      const previewEl = document.createElement('div');
      previewEl.className = 'history-item__preview';
      previewEl.textContent = `🥇 ${top3}`;

      const toggleEl = document.createElement('span');
      toggleEl.className = 'history-item__toggle';
      toggleEl.textContent = '▼';

      leftSide.appendChild(dateEl);
      leftSide.appendChild(previewEl);
      header.appendChild(leftSide);
      header.appendChild(toggleEl);

      // 详情
      const detail = document.createElement('div');
      detail.className = 'history-item__detail';

      entry.rankings.forEach((r) => {
        const row = document.createElement('div');
        row.className = 'history-detail-row';

        const rankEl = document.createElement('span');
        rankEl.className = 'history-detail-row__rank';
        rankEl.textContent = `#${r.rank}`;

        const nameEl = document.createElement('span');
        nameEl.className = 'history-detail-row__name';
        nameEl.textContent = r.playName;

        row.appendChild(rankEl);
        row.appendChild(nameEl);
        detail.appendChild(row);
      });

      // 删除按钮
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn--secondary btn--small';
      deleteBtn.textContent = '删除此记录';
      deleteBtn.style.marginTop = 'var(--space-md)';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        HistoryStore.remove(entry.id);
        render();
        showToast('已删除记录');
      });
      detail.appendChild(deleteBtn);

      // 点击展开/收起
      let isOpen = false;
      header.addEventListener('click', () => {
        isOpen = !isOpen;
        detail.classList.toggle('history-item__detail--open', isOpen);
        toggleEl.classList.toggle('history-item__toggle--open', isOpen);
      });

      item.appendChild(header);
      item.appendChild(detail);
      historyList.appendChild(item);
    });
  }

  // === 清空全部 ===
  function showModal() {
    modalOverlay.classList.add('modal-overlay--visible');
  }
  function hideModal() {
    modalOverlay.classList.remove('modal-overlay--visible');
  }

  btnClearAll.addEventListener('click', showModal);
  modalCancel.addEventListener('click', hideModal);
  modalConfirmBtn.addEventListener('click', () => {
    HistoryStore.clear();
    hideModal();
    render();
    showToast('✅ 已清空全部历史');
  });
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  // === 初始化 ===
  render();
})();
