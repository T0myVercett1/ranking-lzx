/* === 后台管理页逻辑 === */

(function () {
  'use strict';

  // === DOM 引用 ===
  const playInputsContainer = document.getElementById('play-inputs');
  const formError = document.getElementById('form-error');
  const btnSave = document.getElementById('btn-save');
  const btnReset = document.getElementById('btn-reset');
  const btnAdd = document.getElementById('btn-add');
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

  // === 弹窗 ===
  function showModal() {
    modalOverlay.classList.add('modal-overlay--visible');
  }
  function hideModal() {
    modalOverlay.classList.remove('modal-overlay--visible');
  }

  // === 创建一行输入 ===
  function createInputRow(playName, index) {
    const row = document.createElement('div');
    row.className = 'play-input-row';

    const numberEl = document.createElement('span');
    numberEl.className = 'play-input-row__number';
    numberEl.textContent = index + 1;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-input';
    input.value = playName;
    input.placeholder = 'English——中文';
    input.dataset.index = index;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--small btn--accent';
    delBtn.textContent = '✕';
    delBtn.title = '删除此剧目';
    delBtn.style.cssText = 'padding:0.3rem 0.6rem;font-size:0.85rem;flex-shrink:0;';
    delBtn.addEventListener('click', () => {
      row.remove();
      renumber();
    });

    row.appendChild(numberEl);
    row.appendChild(input);
    row.appendChild(delBtn);
    return row;
  }

  // === 重新编号 ===
  function renumber() {
    const rows = playInputsContainer.querySelectorAll('.play-input-row');
    rows.forEach((row, i) => {
      row.querySelector('.play-input-row__number').textContent = i + 1;
      row.querySelector('input').dataset.index = i;
    });
  }

  // === 渲染所有输入框 ===
  function renderInputs() {
    const plays = PlayPoolStore.getAll();
    playInputsContainer.innerHTML = '';

    plays.forEach((playName, index) => {
      playInputsContainer.appendChild(createInputRow(playName, index));
    });

    formError.style.display = 'none';
  }

  // === 添加剧目 ===
  function handleAdd() {
    const currentCount = playInputsContainer.querySelectorAll('.play-input-row').length;
    const row = createInputRow('', currentCount);
    playInputsContainer.appendChild(row);
    // 聚焦新输入框
    const newInput = row.querySelector('input');
    newInput.focus();
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

    PlayPoolStore.save(plays);
    formError.style.display = 'none';
    showToast(`✅ 已保存 ${plays.length} 部剧目！下一局游戏将使用新数据`);
  }

  // === 重置 ===
  function handleReset() {
    PlayPoolStore.reset();
    renderInputs();
    showToast(`✅ 已恢复默认 ${PlayPoolStore.DEFAULTS.length} 部剧目`);
    formError.style.display = 'none';
  }

  // === 事件绑定 ===
  btnSave.addEventListener('click', handleSave);
  btnReset.addEventListener('click', showModal);
  btnAdd.addEventListener('click', handleAdd);
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
