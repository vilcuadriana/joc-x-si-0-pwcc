(() => {
  // DOM Elements
  const cells = document.querySelectorAll('.cell');
  const statusText = document.getElementById('status-text');
  const gameModeSelect = document.getElementById('game-mode');
  const restartBtn = document.getElementById('restart-btn');
  const resetScoreBtn = document.getElementById('reset-score-btn');
  const soundBtn = document.getElementById('sound-btn');
  const soundIcon = document.getElementById('sound-icon');
  
  const cardX = document.getElementById('card-x');
  const cardO = document.getElementById('card-o');
  const scoreXEl = document.getElementById('score-x');
  const scoreOEl = document.getElementById('score-o');
  const scoreTieEl = document.getElementById('score-tie');
  const nameOEl = document.getElementById('name-o');

  // Winning combinations
  const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Orizontale
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Verticale
    [0, 4, 8], [2, 4, 6]             // Diagonale
  ];

  // Game state
  let board = Array(9).fill(null);
  let currentPlayer = 'X';
  let isGameActive = true;
  let isAiThinking = false;
  let aiTimeoutId = null;
  let soundEnabled = localStorage.getItem('tictactoe_sound') !== 'false';
  let scores = {
    X: parseInt(localStorage.getItem('tictactoe_score_x')) || 0,
    O: parseInt(localStorage.getItem('tictactoe_score_o')) || 0,
    tie: parseInt(localStorage.getItem('tictactoe_score_tie')) || 0
  };

  // Sound Synthesizer (Web Audio API)
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  function playSound(type) {
    if (!soundEnabled) return;
    if (type === 'moveX') {
      playTone(440, 0.1, 'sine', 0.2);
    } else if (type === 'moveO') {
      playTone(330, 0.12, 'triangle', 0.2);
    } else if (type === 'win') {
      // Arpegiu triumfător
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        setTimeout(() => playTone(freq, 0.25, 'sine', 0.25), idx * 100);
      });
    } else if (type === 'tie') {
      playTone(280, 0.15, 'sawtooth', 0.1);
      setTimeout(() => playTone(240, 0.25, 'sawtooth', 0.1), 120);
    } else if (type === 'click') {
      playTone(600, 0.05, 'sine', 0.08);
    }
  }

  // Confetti system
  const confettiCanvas = document.getElementById('confetti-canvas');
  const ctx = confettiCanvas.getContext('2d');
  let confettiParticles = [];
  let confettiAnimationId = null;

  function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function triggerConfetti() {
    confettiParticles = [];
    const colors = ['#00f2fe', '#ff007f', '#f59e0b', '#10b981', '#ffffff', '#a855f7'];
    const count = 120;

    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
        y: confettiCanvas.height / 3 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 14 - 6,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        alpha: 1,
        life: 0.985
      });
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    animateConfetti();
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravitate
      p.vx *= 0.98;
      p.rotation += p.vRot;
      p.alpha *= p.life;

      if (p.alpha > 0.01 && p.y < confettiCanvas.height + 20) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // Update Score UI
  function updateScoresUI() {
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreTieEl.textContent = scores.tie;
    localStorage.setItem('tictactoe_score_x', scores.X);
    localStorage.setItem('tictactoe_score_o', scores.O);
    localStorage.setItem('tictactoe_score_tie', scores.tie);
  }

  // Update Turn Status Card Highlight
  function updateActivePlayerCard() {
    if (!isGameActive) {
      cardX.classList.remove('active');
      cardO.classList.remove('active');
      return;
    }
    if (currentPlayer === 'X') {
      cardX.classList.add('active');
      cardO.classList.remove('active');
    } else {
      cardO.classList.add('active');
      cardX.classList.remove('active');
    }
  }

  // Update UI Status Text
  function updateStatus(text, type = '') {
    statusText.innerHTML = text;
    statusText.className = 'status-box';
    if (type) statusText.classList.add(type);
  }

  // Check Game End Condition
  function checkWinnerState(b) {
    for (const combo of WINNING_COMBOS) {
      const [a, bIdx, c] = combo;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return { winner: b[a], combo };
      }
    }
    if (b.every(cell => cell !== null)) {
      return { winner: 'tie', combo: null };
    }
    return null;
  }

  // Cell Click Handler
  function handleCellClick(e) {
    const cell = e.currentTarget;
    const index = parseInt(cell.getAttribute('data-index'));

    if (board[index] !== null || !isGameActive || isAiThinking) {
      return;
    }

    makeMove(index, currentPlayer);

    const result = checkWinnerState(board);
    if (result) {
      endGame(result);
      return;
    }

    // Switch turn
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateActivePlayerCard();

    const isAiMode = gameModeSelect.value.startsWith('ai');
    if (isAiMode && currentPlayer === 'O') {
      updateStatus('🤖 Calculatorul gândește...');
      isAiThinking = true;
      if (aiTimeoutId) clearTimeout(aiTimeoutId);
      aiTimeoutId = setTimeout(() => {
        aiTimeoutId = null;
        executeAiTurn();
      }, 350);
    } else {
      updateStatus(`Rândul lui <strong>${currentPlayer}</strong>`);
    }
  }

  // Make Move
  function makeMove(index, player) {
    board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player.toLowerCase());
    cell.setAttribute('aria-label', `Celula ${index + 1}: ${player}`);
    playSound(player === 'X' ? 'moveX' : 'moveO');
  }

  // End Game
  function endGame(result) {
    isGameActive = false;
    updateActivePlayerCard();

    if (result.winner === 'tie') {
      scores.tie++;
      updateScoresUI();
      updateStatus('🤝 Este remiză!', 'tie');
      playSound('tie');
    } else {
      scores[result.winner]++;
      updateScoresUI();
      
      const winnerName = result.winner === 'X' 
        ? 'Jucător X' 
        : (gameModeSelect.value.startsWith('ai') ? 'AI (0)' : 'Jucător 0');

      updateStatus(`🎉 ${winnerName} a câștigat!`, result.winner === 'X' ? 'winner-x' : 'winner-o');

      // Highlight winning cells
      result.combo.forEach(idx => {
        cells[idx].classList.add('win');
      });

      triggerConfetti();
      playSound('win');
    }
  }

  // AI Logic
  function executeAiTurn() {
    if (!isGameActive || currentPlayer !== 'O') {
      isAiThinking = false;
      return;
    }

    const mode = gameModeSelect.value;
    let chosenIndex = null;

    if (mode === 'ai-easy') {
      chosenIndex = getRandomMove();
    } else if (mode === 'ai-medium') {
      // 50% șansă de mișcare inteligentă, 50% aleatorie
      if (Math.random() < 0.5) {
        chosenIndex = getBestMoveMinimax();
      } else {
        chosenIndex = getImmediateWinOrBlock() ?? getRandomMove();
      }
    } else {
      // Imbatabil (ai-hard)
      chosenIndex = getBestMoveMinimax();
    }

    if (chosenIndex !== null && chosenIndex >= 0) {
      makeMove(chosenIndex, 'O');

      const result = checkWinnerState(board);
      if (result) {
        endGame(result);
        isAiThinking = false;
        return;
      }

      currentPlayer = 'X';
      updateActivePlayerCard();
      updateStatus(`Rândul tău (<strong>X</strong>)`);
    }

    isAiThinking = false;
  }

  function getAvailableIndices(b = board) {
    return b
      .map((val, idx) => (val === null ? idx : null))
      .filter(idx => idx !== null);
  }

  function getRandomMove() {
    const available = getAvailableIndices();
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function getImmediateWinOrBlock() {
    const available = getAvailableIndices();

    // 1. Verifică dacă AI poate câștiga dintr-o mișcare
    for (const idx of available) {
      board[idx] = 'O';
      const win = checkWinnerState(board);
      board[idx] = null;
      if (win && win.winner === 'O') return idx;
    }

    // 2. Verifică dacă trebuie să blocheze adversarul
    for (const idx of available) {
      board[idx] = 'X';
      const win = checkWinnerState(board);
      board[idx] = null;
      if (win && win.winner === 'X') return idx;
    }

    return null;
  }

  function getBestMoveMinimax() {
    const avail = getAvailableIndices(board);
    // Dacă tabla este goală, alege centrul sau colțul rapid
    if (avail.length === 9) {
      return 4;
    }

    function checkWin(b, player) {
      return WINNING_COMBOS.some(combo => combo.every(idx => b[idx] === player));
    }

    function minimax(newBoard, player, depth) {
      const spots = getAvailableIndices(newBoard);

      if (checkWin(newBoard, 'O')) {
        return { score: 10 - depth };
      } else if (checkWin(newBoard, 'X')) {
        return { score: depth - 10 };
      } else if (spots.length === 0) {
        return { score: 0 };
      }

      const moves = [];

      for (let i = 0; i < spots.length; i++) {
        const move = {};
        move.index = spots[i];
        newBoard[spots[i]] = player;

        if (player === 'O') {
          const res = minimax(newBoard, 'X', depth + 1);
          move.score = res.score;
        } else {
          const res = minimax(newBoard, 'O', depth + 1);
          move.score = res.score;
        }

        newBoard[spots[i]] = null;
        moves.push(move);
      }

      let bestMoveIndex = 0;
      if (player === 'O') {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
          if (moves[i].score > bestScore) {
            bestScore = moves[i].score;
            bestMoveIndex = i;
          }
        }
      } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
          if (moves[i].score < bestScore) {
            bestScore = moves[i].score;
            bestMoveIndex = i;
          }
        }
      }

      return moves[bestMoveIndex];
    }

    const best = minimax(board, 'O', 0);
    return best ? best.index : getRandomMove();
  }

  // Reset Round
  function restartGame() {
    if (aiTimeoutId) {
      clearTimeout(aiTimeoutId);
      aiTimeoutId = null;
    }
    board = Array(9).fill(null);
    currentPlayer = 'X';
    isGameActive = true;
    isAiThinking = false;

    cells.forEach(cell => {
      cell.textContent = '';
      cell.className = 'cell';
      cell.removeAttribute('aria-label');
    });

    if (confettiAnimationId) {
      cancelAnimationFrame(confettiAnimationId);
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }

    updateActivePlayerCard();
    updateStatus(`Rândul lui <strong>${currentPlayer}</strong>`);
    playSound('click');
  }

  // Reset All Scores
  function resetScores() {
    scores = { X: 0, O: 0, tie: 0 };
    updateScoresUI();
    restartGame();
  }

  // Toggle Sound
  function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('tictactoe_sound', soundEnabled);
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    if (soundEnabled) {
      playSound('click');
    }
  }

  // Change Game Mode
  function handleModeChange() {
    const isAi = gameModeSelect.value.startsWith('ai');
    nameOEl.textContent = isAi ? 'AI (0)' : 'Jucător 0';
    restartGame();
  }

  // Event Listeners
  cells.forEach(cell => cell.addEventListener('click', handleCellClick));
  restartBtn.addEventListener('click', restartGame);
  resetScoreBtn.addEventListener('click', resetScores);
  soundBtn.addEventListener('click', toggleSound);
  gameModeSelect.addEventListener('change', handleModeChange);

  // Initialize
  soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
  updateScoresUI();
  updateActivePlayerCard();
  updateStatus(`Rândul lui <strong>${currentPlayer}</strong>`);
})();
