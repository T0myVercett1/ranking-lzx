/* === 游戏页面逻辑 === */

(function () {
  'use strict';

  // === DOM 引用 ===
  const revealInitial = document.getElementById('reveal-initial');
  const revealPlay = document.getElementById('reveal-play');
  const revealComplete = document.getElementById('reveal-complete');
  const currentPlayNameEl = document.getElementById('current-play-name');
  const rankSlots = document.getElementById('rank-slots');
  const nextPlayArea = document.getElementById('next-play-area');
  const progressFill = document.getElementById('progress-fill');
  const roundNum = document.getElementById('round-num');
  const roundTotal = document.getElementById('round-total');
  const footerPlaced = document.getElementById('footer-placed');
  const footerTotal = document.getElementById('footer-total');
  const toast = document.getElementById('toast');
  const btnStartRound = document.getElementById('btn-start-round');
  const btnNextPlay = document.getElementById('btn-next-play');
  const btnSkip = document.getElementById('btn-skip');
  const btnBack = document.getElementById('btn-back');

  // === 配置 ===
  const SELECT_COUNT = 10; // 每局从池中随机抽取的数量

  // === 状态 ===
  let engine = null;
  let isWaitingForPlacement = false; // 是否正在等待玩家选择排名

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

  // === 初始化游戏 ===
  function initGame() {
    let pool = PlayPoolStore.getAll();

    // 检测旧格式数据，自动迁移
    if (pool.length > 0 && !pool[0].includes('——')) {
      PlayPoolStore.reset();
      pool = PlayPoolStore.getAll();
    }

    // 校验剧目池
    const validation = PlayPoolStore.validate(pool);
    if (!validation.valid) {
      alert('剧目池不合法，请先去后台管理页面设置。\n\n' + validation.errors.join('\n'));
      window.location.href = 'admin.html';
      return;
    }

    // 尝试恢复进行中的游戏
    const savedGame = CurrentGameStore.load();
    if (savedGame) {
      const shouldRestore = confirm(
        '检测到未完成的游戏，是否继续上次的进度？\n\n' +
        '（点击"取消"将开始全新游戏）'
      );
      if (shouldRestore) {
        engine = GameEngine.fromJSON(savedGame);
      }
    }

    // 如果没有恢复，创建新游戏 → 从池中随机抽取 SELECT_COUNT 部
    if (!engine) {
      const selectCount = Math.min(SELECT_COUNT, pool.length);
      // Fisher-Yates 洗牌后取前 selectCount 部
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const selected = shuffled.slice(0, selectCount);
      engine = new GameEngine(selected);
      CurrentGameStore.clear();
    }

    // 渲染排名槽位
    renderRankSlots();

    // 根据游戏状态决定显示什么
    if (engine.isComplete()) {
      showCompleteState();
    } else if (engine.currentIndex > 0) {
      // 恢复进行中的游戏 — 显示当前待揭示的剧目
      showPlayState();
    } else {
      showInitialState();
    }

    updateProgress();
  }

  // === 渲染排名槽位 ===
  function renderRankSlots() {
    rankSlots.innerHTML = '';

    engine.rankings.forEach((slot) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'rank-slot';
      slotEl.dataset.rank = slot.rank;

      const numberEl = document.createElement('span');
      numberEl.className = 'rank-slot__number';
      numberEl.textContent = slot.rank;

      const nameEl = document.createElement('span');
      nameEl.className = 'rank-slot__name';

      if (slot.playName) {
        nameEl.innerHTML = formatPlayNameHTML(slot.playName);
        slotEl.classList.add('rank-slot--filled');
      } else {
        nameEl.textContent = '—— 等待选择 ——';
        nameEl.classList.add('rank-slot__name--empty');
      }

      slotEl.appendChild(numberEl);
      slotEl.appendChild(nameEl);
      rankSlots.appendChild(slotEl);
    });
  }

  // === 更新排名槽位状态 ===
  function updateSlotStates() {
    const slotEls = rankSlots.querySelectorAll('.rank-slot');
    const remainingSlots = engine.getRemainingSlots();
    const filledSlots = engine.getFilledSlots();

    slotEls.forEach((slotEl) => {
      const rank = parseInt(slotEl.dataset.rank);
      const slotData = engine.rankings[rank - 1];
      const nameEl = slotEl.querySelector('.rank-slot__name');

      // 清除旧状态
      slotEl.className = 'rank-slot';
      slotEl.onclick = null;

      if (slotData.playName) {
        // 已填充
        slotEl.classList.add('rank-slot--filled');
        nameEl.innerHTML = formatPlayNameHTML(slotData.playName);
        nameEl.classList.remove('rank-slot__name--empty');
      } else if (isWaitingForPlacement) {
        // 可点击选择
        slotEl.classList.add('rank-slot--available');
        nameEl.textContent = '—— 点击放置此处 ——';
        nameEl.classList.add('rank-slot__name--empty');
        slotEl.onclick = () => handlePlacePlay(rank);
      } else {
        // 不可选择
        slotEl.classList.add('rank-slot--disabled');
        nameEl.textContent = '—— 等待选择 ——';
        nameEl.classList.add('rank-slot__name--empty');
      }
    });
  }

  // === 显示初始状态 ===
  function showInitialState() {
    revealInitial.style.display = 'block';
    revealPlay.style.display = 'none';
    revealComplete.style.display = 'none';
    nextPlayArea.style.display = 'none';
    isWaitingForPlacement = false;

    updateSlotStates();
  }

  // === 显示剧目揭示状态 ===
  function showPlayState() {
    revealInitial.style.display = 'none';
    revealPlay.style.display = 'block';
    revealComplete.style.display = 'none';
    isWaitingForPlacement = true;

    const playName = engine.revealNext();
    if (playName) {
      // 触发淡入动画
      currentPlayNameEl.classList.remove('fade-in');
      void currentPlayNameEl.offsetWidth; // 强制回流
      currentPlayNameEl.classList.add('fade-in');
      currentPlayNameEl.innerHTML = formatPlayNameHTML(playName);
    }

    nextPlayArea.style.display = 'none';
    updateSlotStates();
  }

  // === 显示完成状态 ===
  function showCompleteState() {
    revealInitial.style.display = 'none';
    revealPlay.style.display = 'none';
    revealComplete.style.display = 'block';
    nextPlayArea.style.display = 'none';
    isWaitingForPlacement = false;

    updateSlotStates();

    // 保存到历史
    const result = engine.getResult();
    if (result) {
      HistoryStore.add({
        rankings: result,
        playPool: engine.playPool,
        timestamp: engine.gameStartTime
      });
    }

    // 清除进行中的游戏
    CurrentGameStore.clear();
  }

  // === 处理放置 ===
  function handlePlacePlay(rankNumber) {
    if (!isWaitingForPlacement) return;

    const playName = engine.revealNext();
    const result = engine.placePlay(rankNumber);

    if (!result.success) {
      showToast('⚠ ' + result.error);
      return;
    }

    // 更新被填充的槽位
    const filledSlotEl = rankSlots.querySelector(`[data-rank="${rankNumber}"]`);
    if (filledSlotEl) {
      const nameEl = filledSlotEl.querySelector('.rank-slot__name');
      filledSlotEl.className = 'rank-slot rank-slot--filled rank-slot--just-filled';
      nameEl.innerHTML = formatPlayNameHTML(playName);
      nameEl.classList.remove('rank-slot__name--empty');
    }

    // 更新其他槽位状态
    updateSlotStates();

    // 保存进度
    CurrentGameStore.save(engine.toJSON());

    // 更新进度显示
    updateProgress();

    // 检查是否完成
    if (engine.isComplete()) {
      // 短暂延迟后显示完成状态
      setTimeout(() => {
        showCompleteState();
        updateProgress();
      }, 500);
    } else {
      // 自动揭示下一部（无需玩家手动点击）
      isWaitingForPlacement = false;
      updateSlotStates();
      setTimeout(() => {
        showPlayState();
        updateProgress();
      }, 600);
    }
  }

  // === 更新进度 ===
  function updateProgress() {
    const { placed, total } = engine.getProgress();
    const pct = Math.round((placed / total) * 100);
    progressFill.style.width = pct + '%';
    roundTotal.textContent = total;
    roundNum.textContent = Math.min(placed + 1, total);
    footerPlaced.textContent = placed;
    footerTotal.textContent = total;

    if (engine.isComplete()) {
      roundNum.textContent = total;
    }
  }

  // === 事件绑定 ===
  btnStartRound.addEventListener('click', () => {
    showPlayState();
    updateProgress();
    CurrentGameStore.save(engine.toJSON());
  });

  btnSkip.addEventListener('click', () => {
    if (!isWaitingForPlacement) return;
    const result = engine.skip();
    if (!result.success) {
      showToast('⚠ ' + result.error);
      return;
    }
    CurrentGameStore.save(engine.toJSON());
    updateProgress();
    isWaitingForPlacement = false;
    updateSlotStates();
    if (engine.isComplete()) {
      setTimeout(() => {
        showCompleteState();
        updateProgress();
      }, 400);
    } else {
      setTimeout(() => {
        showPlayState();
        updateProgress();
      }, 400);
    }
  });

  btnNextPlay.addEventListener('click', () => {
    showPlayState();
    updateProgress();
    CurrentGameStore.save(engine.toJSON());
  });

  // 离开页面提醒
  window.addEventListener('beforeunload', (e) => {
    if (engine && !engine.isComplete() && engine.currentIndex > 0) {
      CurrentGameStore.save(engine.toJSON());
      // 浏览器会显示默认提示
      e.preventDefault();
    }
  });

  // 返回首页时也保存进度
  btnBack.addEventListener('click', () => {
    if (engine && !engine.isComplete() && engine.currentIndex > 0) {
      CurrentGameStore.save(engine.toJSON());
    }
  });

  // === 启动 ===
  initGame();
})();
