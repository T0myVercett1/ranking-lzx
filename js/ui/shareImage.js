/* === 分享图片生成 === */

const ShareImage = {
  /**
   * 生成排名卡片图片
   * @param {{ rank: number, playName: string }[]} rankings - 排名结果
   * @param {string} [siteUrl] - 网站地址（可选）
   * @returns {Promise<HTMLCanvasElement>}
   */
  async generate(rankings, siteUrl) {
    const WIDTH = 600;
    const PADDING = 35;
    const LINE_SPACING = 42;
    // 动态高度：顶部(490) + 排名行数 × 行距
    const HEIGHT = 490 + rankings.length * LINE_SPACING;

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');

    // === 背景（羊皮纸色） ===
    ctx.fillStyle = '#f4e4c1';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 添加纹理（模拟纸纹）
    this._drawTexture(ctx, WIDTH, HEIGHT);

    // === 外框 ===
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 3;
    ctx.strokeRect(PADDING, PADDING, WIDTH - 2 * PADDING, HEIGHT - 2 * PADDING);

    // 内框（双线）
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING + 8, PADDING + 8, WIDTH - 2 * (PADDING + 8), HEIGHT - 2 * (PADDING + 8));

    // === 顶部装饰 ===
    const topY = PADDING + 35;
    ctx.fillStyle = '#b8860b';
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.fillText('❦', WIDTH / 2, topY);

    // === 标题 ===
    ctx.fillStyle = '#2c1810';
    ctx.font = 'bold 36px "Noto Serif SC", "SimSun", "宋体", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.fillText('莎士比亚盲选排名', WIDTH / 2, topY + 40);

    // 副标题
    ctx.fillStyle = '#5c3a28';
    ctx.font = '16px "Noto Serif SC", "SimSun", "宋体", serif';
    ctx.fillText('The Bard\'s Blind Ranking', WIDTH / 2, topY + 65);

    // === 分隔线 ===
    const dividerY = topY + 85;
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING + 40, dividerY);
    ctx.lineTo(WIDTH - PADDING - 40, dividerY);
    ctx.stroke();

    // === 排名列表 ===
    const listStartY = dividerY + 40;

    rankings.forEach((item, index) => {
      const y = listStartY + index * LINE_SPACING;

      // 排名奖牌
      const medalColors = ['#b8860b', '#a0a0a0', '#cd853f']; // 金银铜
      const medalColor = index < 3 ? medalColors[index] : '#8b7355';

      // 序号背景圆
      const cx = PADDING + 55;
      const cy = y - 4;
      const radius = index === 0 ? 18 : 15;

      ctx.fillStyle = medalColor;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 序号文字
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${index === 0 ? 16 : 14}px "Georgia", serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(item.rank), cx, cy + 5);

      // 剧目名称（双语渲染：英文花体 + 中文衬线）
      const playName = item.playName;
      const nameX = cx + radius + 18;
      const nameY = y + 6;

      if (playName && playName.includes('——')) {
        const idx = playName.indexOf('——');
        const enPart = playName.slice(0, idx);
        const zhPart = '——' + playName.slice(idx + 2);

        // 英文花体部分
        ctx.fillStyle = '#2c1810';
        ctx.font = 'italic 16px "Tangerine", "Cormorant Garamond", "Georgia", cursive, serif';
        ctx.textAlign = 'left';
        const enWidth = ctx.measureText(enPart).width;
        ctx.fillText(enPart, nameX, nameY);

        // 中文部分（稍小字号）
        ctx.fillStyle = '#3a2215';
        ctx.font = '15px "Noto Serif SC", "SimSun", "宋体", serif';
        ctx.fillText(zhPart, nameX + enWidth + 4, nameY + 1);
      } else {
        // 非双语格式，正常绘制
        ctx.fillStyle = '#2c1810';
        ctx.font = '18px "Noto Serif SC", "SimSun", "宋体", serif';
        ctx.textAlign = 'left';
        ctx.fillText(playName, nameX, nameY);
      }

      // 虚线分隔
      if (index < rankings.length - 1) {
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx + radius + 18, y + 22);
        ctx.lineTo(WIDTH - PADDING - 40, y + 22);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // === 底部区域 ===
    const bottomY = listStartY + rankings.length * LINE_SPACING + 25;

    // 分隔线
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(PADDING + 40, bottomY);
    ctx.lineTo(WIDTH - PADDING - 40, bottomY);
    ctx.stroke();

    // 装饰符号
    ctx.fillStyle = '#b8860b';
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.fillText('❦', WIDTH / 2, bottomY + 24);

    // === QR码区域 ===
    const qrSectionY = bottomY + 45;

    // 尝试生成QR码
    let qrGenerated = false;
    if (typeof QRCode !== 'undefined' && siteUrl) {
      try {
        const qrSize = 100;
        const qrCanvas = await this._generateQRCode(siteUrl, qrSize);
        if (qrCanvas) {
          const qrX = WIDTH / 2 - qrSize / 2;
          ctx.drawImage(qrCanvas, qrX, qrSectionY + 8, qrSize, qrSize);
          qrGenerated = true;

          // 扫码提示
          ctx.fillStyle = '#5c3a28';
          ctx.font = '13px "Noto Serif SC", "SimSun", "宋体", serif';
          ctx.textAlign = 'center';
          ctx.fillText('扫码开始你的莎士比亚盲选之旅', WIDTH / 2, qrSectionY + qrSize + 24);
        }
      } catch (e) {
        console.warn('QR码生成失败:', e);
      }
    }

    if (!qrGenerated) {
      // 备用：不显示QR，改用文字引导
      ctx.fillStyle = '#8b7355';
      ctx.font = '14px "Noto Serif SC", "SimSun", "宋体", serif';
      ctx.textAlign = 'center';
      ctx.fillText('莎士比亚戏剧 · 盲选排名游戏', WIDTH / 2, qrSectionY + 25);
      ctx.fillText('与好友一起挑战你的戏剧品味吧！', WIDTH / 2, qrSectionY + 50);
    }

    // === 底部 ===
    ctx.fillStyle = '#8b7355';
    ctx.font = 'italic 13px "Georgia", "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('「世界是一个舞台，所有的男男女女不过是一些演员」', WIDTH / 2, HEIGHT - PADDING - 15);

    return canvas;
  },

  /**
   * 画纸纹理
   */
  _drawTexture(ctx, width, height) {
    // 简单的噪点纹理模拟纸张
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 8;
      data[i] += noise;     // R
      data[i + 1] += noise; // G
      data[i + 2] += noise; // B
    }
    ctx.putImageData(imageData, 0, 0);
  },

  /**
   * 生成二维码 Canvas
   * @param {string} text
   * @param {number} size
   * @returns {Promise<HTMLCanvasElement|null>}
   */
  _generateQRCode(text, size) {
    return new Promise((resolve) => {
      try {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        document.body.appendChild(container);

        const qr = new QRCode(container, {
          text: text,
          width: size,
          height: size,
          colorDark: '#2c1810',
          colorLight: '#f4e4c1',
          correctLevel: QRCode.CorrectLevel.M
        });

        // 等渲染完成
        setTimeout(() => {
          const qrCanvas = container.querySelector('canvas');
          if (qrCanvas) {
            // 克隆 canvas 避免引用被移除的元素
            const clone = document.createElement('canvas');
            clone.width = qrCanvas.width;
            clone.height = qrCanvas.height;
            clone.getContext('2d').drawImage(qrCanvas, 0, 0);
            document.body.removeChild(container);
            resolve(clone);
          } else {
            document.body.removeChild(container);
            resolve(null);
          }
        }, 500);
      } catch (e) {
        resolve(null);
      }
    });
  }
};
