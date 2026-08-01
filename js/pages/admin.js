/* === 后台管理页逻辑 === */

(function () {
  'use strict';

  // === DOM 引用 ===
  const playInputsContainer = document.getElementById('play-inputs');
  const formError = document.getElementById('form-error');
  const btnSave = document.getElementById('btn-save');
  const btnReset = document.getElementById('btn-reset');
  const toast = document.getElementById('toast');
  const modalOverlay = document.getElementById('modal-confirm');
  const modalCancel = document.getElementById('modal-cancel');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');

  // === Toast 提示 ===
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('toast--visible');
    toastTimer = setTimeout(() => {
      toast.classList.remove('toast--visible');
    }, 2000);
  }

  // === 弹窗 ===
  function showModal() {
    modalOverlay.classList.add('modal-overlay--visible');
  }
  function hideModal() {
    modalOverlay.classList.remove('modal-overlay--visible');
  }

  // === 渲染输入框 ===
  function renderInputs() {
    const plays = PlayPoolStore.getAll();
    playInputsContainer.innerHTML = '';

    plays.forEach((playName, index) => {
      const row = document.createElement('div');
      row.className = 'play-input-row';

      const numberEl = document.createElement('span');
      numberEl.className = 'play-input-row__number';
      numberEl.textContent = index + 1;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
      input.value = playName;
      input.placeholder = `第 ${index + 1} 部剧目`;
      input.dataset.index = index;

      row.appendChild(numberEl);
      row.appendChild(input);
      playInputsContainer.appendChild(row);
    });

    formError.style.display = 'none';
  }

  // === 收集当前输入 ===
  function collectInputs() {
    const inputs = playInputsContainer.querySelectorAll('input');
    return Array.from(inputs).map(input => input.value.trim());
  }

  // === 保存 ===
  function handleSave() {
    const plays = collectInputs();
    const result = PlayPoolStore.validate(plays);

    if (!result.valid) {
      formError.textContent = result.errors.join('；');
      formError.style.display = 'block';
      return;
    }

    // 去除首尾空格后保存
    PlayPoolStore.save(plays);
    formError.style.display = 'none';
    showToast('✅ 剧目池已保存！下一局游戏将使用新数据');
  }

  // === 重置 ===
  function handleReset() {
    const result = PlayPoolStore.reset();
    showToast('✅ 已恢复默认剧目池');

    // 更新输入框
    const inputs = playInputsContainer.querySelectorAll('input');
    inputs.forEach((input, i) => {
      input.value = result[i];
    });
    formError.style.display = 'none';
  }

  // === 事件绑定 ===
  btnSave.addEventListener('click', handleSave);
  btnReset.addEventListener('click', showModal);
  modalCancel.addEventListener('click', hideModal);
  modalConfirmBtn.addEventListener('click', () => {
    handleReset();
    hideModal();
  });

  // 点击遮罩关闭弹窗
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  // === 初始化 ===
  renderInputs();
})();
