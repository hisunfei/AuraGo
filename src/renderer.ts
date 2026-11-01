/**
 * 炁体围棋 - 渲染器
 * 负责绘制棋盘、棋子、气的可视化
 */

import { StoneColor, Position, ViewMode, RenderConfig, LibertyInfo, LibertyOwner } from './types';
import { GoEngine } from './engine';

export class GoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private engine: GoEngine;
  private config: RenderConfig;
  private viewMode: ViewMode;
  private hoverPosition: Position | null;
  private selectedGroup: number | null;

  constructor(canvas: HTMLCanvasElement, engine: GoEngine, boardSize: number = 19) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
    this.viewMode = ViewMode.Qi;
    this.hoverPosition = null;
    this.selectedGroup = null;

    // 计算配置
    const maxSize = Math.min(window.innerWidth - 100, window.innerHeight - 300, 700);
    const cellSize = Math.floor(maxSize / (boardSize + 1));
    
    this.config = {
      boardSize,
      cellSize,
      padding: cellSize,
      stoneRadius: cellSize * 0.45
    };

    // 设置 canvas 尺寸
    const canvasSize = cellSize * (boardSize - 1) + padding * 2;
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;

    this.setupEventListeners();
  }

  private get padding(): number {
    return this.config.padding;
  }

  // 设置事件监听
  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  // 获取鼠标位置对应的棋盘坐标
  private getBoardPosition(e: MouseEvent): Position | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const boardX = Math.round((x - this.padding) / this.config.cellSize);
    const boardY = Math.round((y - this.padding) / this.config.cellSize);

    if (boardX >= 0 && boardX < this.config.boardSize && boardY >= 0 && boardY < this.config.boardSize) {
      return { x: boardX, y: boardY };
    }

    return null;
  }

  // 处理鼠标移动
  private handleMouseMove(e: MouseEvent): void {
    this.hoverPosition = this.getBoardPosition(e);
    this.render();
  }

  // 处理鼠标离开
  private handleMouseLeave(): void {
    this.hoverPosition = null;
    this.render();
  }

  // 处理点击
  private handleClick(e: MouseEvent): void {
    const pos = this.getBoardPosition(e);
    if (!pos) return;

    const currentPlayer = this.engine.getCurrentPlayer();
    if (this.engine.canPlaceStone(pos, currentPlayer)) {
      this.engine.placeStone(pos);
      this.render();
      this.updateUI();
    }
  }

  // 设置视图模式
  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    this.render();
  }

  // 更新 UI
  private updateUI(): void {
    const currentPlayer = this.engine.getCurrentPlayer();
    const captures = this.engine.getCaptures();
    const moveCount = this.engine.getMoveCount();

    const playerText = document.getElementById('current-player-text');
    const playerIndicator = document.querySelector('.player-indicator');
    const blackCaptures = document.getElementById('black-captures');
    const whiteCaptures = document.getElementById('white-captures');
    const moveNumber = document.getElementById('move-number');

    if (playerText) {
      playerText.textContent = currentPlayer === StoneColor.Black ? '黑方走棋' : '白方走棋';
    }

    if (playerIndicator) {
      playerIndicator.className = `player-indicator ${currentPlayer === StoneColor.Black ? 'black' : 'white'}`;
    }

    if (blackCaptures) blackCaptures.textContent = captures.black.toString();
    if (whiteCaptures) whiteCaptures.textContent = captures.white.toString();
    if (moveNumber) moveNumber.textContent = moveCount.toString();
  }

  // 渲染
  render(): void {
    this.drawBoard();
    this.drawLiberties();
    this.drawStones();
    this.drawHover();
  }

  // 绘制棋盘
  private drawBoard(): void {
    const { cellSize, boardSize } = this.config;
    const ctx = this.ctx;

    // 背景（木纹色）
    ctx.fillStyle = '#dcb35c';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 网格线
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    for (let i = 0; i < boardSize; i++) {
      // 横线
      ctx.beginPath();
      ctx.moveTo(this.padding, this.padding + i * cellSize);
      ctx.lineTo(this.padding + (boardSize - 1) * cellSize, this.padding + i * cellSize);
      ctx.stroke();

      // 竖线
      ctx.beginPath();
      ctx.moveTo(this.padding + i * cellSize, this.padding);
      ctx.lineTo(this.padding + i * cellSize, this.padding + (boardSize - 1) * cellSize);
      ctx.stroke();
    }

    // 星位
    const starPoints = this.getStarPoints();
    ctx.fillStyle = '#000';
    for (const point of starPoints) {
      ctx.beginPath();
      ctx.arc(
        this.padding + point.x * cellSize,
        this.padding + point.y * cellSize,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // 获取星位
  private getStarPoints(): Position[] {
    const size = this.config.boardSize;
    const points: Position[] = [];

    if (size === 19) {
      const coords = [3, 9, 15];
      for (const x of coords) {
        for (const y of coords) {
          points.push({ x, y });
        }
      }
    } else if (size === 13) {
      points.push({ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 6, y: 6 }, { x: 3, y: 9 }, { x: 9, y: 9 });
    } else if (size === 9) {
      points.push({ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 4 }, { x: 2, y: 6 }, { x: 6, y: 6 });
    }

    return points;
  }

  // 绘制棋子
  private drawStones(): void {
    const board = this.engine.getBoard();
    const { cellSize } = this.config;

    for (let y = 0; y < this.config.boardSize; y++) {
      for (let x = 0; x < this.config.boardSize; x++) {
        const color = board[y][x];
        if (color === StoneColor.Empty) continue;

        const px = this.padding + x * cellSize;
        const py = this.padding + y * cellSize;

        this.drawStone(px, py, color);
      }
    }
  }

  // 绘制单个棋子
  private drawStone(x: number, y: number, color: StoneColor): void {
    const ctx = this.ctx;
    const radius = this.config.stoneRadius;

    // 阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // 棋子
    const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, 0, x, y, radius);
    
    if (color === StoneColor.Black) {
      gradient.addColorStop(0, '#555');
      gradient.addColorStop(1, '#000');
    } else {
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, '#ccc');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 边框
    ctx.strokeStyle = color === StoneColor.Black ? '#000' : '#999';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 绘制气
  private drawLiberties(): void {
    if (this.viewMode === ViewMode.Pure) return;

    const libertyInfo = this.engine.getLibertyInfo();
    const { cellSize } = this.config;

    for (const info of libertyInfo) {
      const px = this.padding + info.position.x * cellSize;
      const py = this.padding + info.position.y * cellSize;

      this.drawLiberty(px, py, info);
    }
  }

  // 绘制单个气
  private drawLiberty(x: number, y: number, info: LibertyInfo): void {
    const ctx = this.ctx;
    const size = this.config.cellSize * 0.8;

    // 根据归属设置颜色
    let fillColor: string;
    let alpha = 0.2;

    switch (info.owner) {
      case LibertyOwner.Black:
        fillColor = `rgba(0, 0, 0, ${alpha})`;
        break;
      case LibertyOwner.White:
        fillColor = `rgba(255, 255, 255, ${alpha})`;
        break;
      case LibertyOwner.Shared:
        fillColor = `rgba(128, 128, 128, ${alpha})`;
        break;
      default:
        return;
    }

    // 绘制气格
    ctx.fillStyle = fillColor;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);

    // 如果是白棋的气，加边框
    if (info.owner === LibertyOwner.White) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }

    // 绘制数字（数字模式或炁视模式）
    if (this.viewMode === ViewMode.Number || this.viewMode === ViewMode.Qi) {
      ctx.fillStyle = info.owner === LibertyOwner.White ? '#000' : '#fff';
      ctx.font = `bold ${this.config.cellSize * 0.4}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.libertyCount.toString(), x, y);
    }
  }

  // 绘制悬停效果
  private drawHover(): void {
    if (!this.hoverPosition) return;

    const { cellSize } = this.config;
    const px = this.padding + this.hoverPosition.x * cellSize;
    const py = this.padding + this.hoverPosition.y * cellSize;

    const currentPlayer = this.engine.getCurrentPlayer();
    const canPlace = this.engine.canPlaceStone(this.hoverPosition, currentPlayer);

    if (canPlace) {
      // 绘制半透明预览棋子
      const ctx = this.ctx;
      const radius = this.config.stoneRadius;

      ctx.globalAlpha = 0.5;
      this.drawStone(px, py, currentPlayer);
      ctx.globalAlpha = 1.0;
    }
  }
}
