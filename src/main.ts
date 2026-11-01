/**
 * 炁体围棋 - 主入口
 */

import { GoEngine } from './engine';
import { GoRenderer } from './renderer';
import { ViewMode, StoneColor } from './types';

// 初始化游戏
const engine = new GoEngine(19);
const canvas = document.getElementById('board-canvas') as HTMLCanvasElement;
const renderer = new GoRenderer(canvas, engine, 19);

// 初始渲染
renderer.render();

// 视图模式切换
const modeButtons = {
  pure: document.getElementById('btn-mode-pure'),
  number: document.getElementById('btn-mode-number'),
  qi: document.getElementById('btn-mode-qi'),
  fight: document.getElementById('btn-mode-fight')
};

function setViewMode(mode: ViewMode): void {
  renderer.setViewMode(mode);
  
  // 更新按钮状态
  Object.values(modeButtons).forEach(btn => btn?.classList.remove('active'));
  modeButtons[mode]?.classList.add('active');
}

modeButtons.pure?.addEventListener('click', () => setViewMode(ViewMode.Pure));
modeButtons.number?.addEventListener('click', () => setViewMode(ViewMode.Number));
modeButtons.qi?.addEventListener('click', () => setViewMode(ViewMode.Qi));
modeButtons.fight?.addEventListener('click', () => setViewMode(ViewMode.Fight));

// 默认激活炁视模式
setViewMode(ViewMode.Qi);

// 停一手
document.getElementById('btn-pass')?.addEventListener('click', () => {
  engine.pass();
  renderer.render();
  updateUI();
});

// 悔棋
document.getElementById('btn-undo')?.addEventListener('click', () => {
  engine.undo();
  renderer.render();
  updateUI();
});

// 重新开始
document.getElementById('btn-restart')?.addEventListener('click', () => {
  if (confirm('确定要重新开始吗？')) {
    engine.reset();
    renderer.render();
    updateUI();
  }
});

// 更新 UI
function updateUI(): void {
  const currentPlayer = engine.getCurrentPlayer();
  const captures = engine.getCaptures();
  const moveCount = engine.getMoveCount();

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

// 初始更新 UI
updateUI();

console.log('炁体围棋已启动');
