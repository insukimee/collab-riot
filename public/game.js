/* ══════════════════════════════════════════════════
   시민의 심문 — 클라이언트
══════════════════════════════════════════════════ */

const socket = io();

let myId = null, myRoomId = null, myName = null;
let isHost = false, isSpy = false, myWord = null, myVote = null;
let gameState = null, micOn = false, localStream = null, peers = {};
let timerInterval = null, selectedRounds = 3;

const AVATARS = ['🐉','⚔️','🛡️','🏹','🔮','🗡️','💜','🌟','🔥','🌀','💫','⚡'];

const HOST_LINES = {
  lobby:      '안녕, 시민! 준비됐어? 💥',
  waiting:    '다들 모이는 중... 기다려봐! 🎉',
  roundStart: '라운드 시작! 라이엇를 찾아봐! 🔍',
  yourTurn:   '어이! 지금 네 차례라고!! 빨리해! ⚡',
  waiting2:   '흠... 저 녀석들 중에 누가 라이엇지? 🤔',
  discussion: '자자! 목소리 높여봐! 보이스챗 GO! 🎙️',
  voting:     '투표 시간! 틀리면 안 되는데... 두근두근 💓',
  spyCaught:  '오호? 라이엇 잡혔다! 근데 아직 역전 찬스! 😈',
  spyWin:     '라이엇가 이겼어! 역시 내 취향이야 😂',
  spyLose:    '라이엇 탈락! 시민들 승리! 🎊',
  gameOver:   '수고했어 시민들! 또 하자고~! 🚀',
};

function setHostLine(key) {
  const el = document.getElementById('hostDialogue');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => {
    el.textContent = HOST_LINES[key] || HOST_LINES.lobby;
    el.style.opacity = '1';
  }, 200);
}

/* ─── 파티클 배경 ─── */
(function initParticles() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -Math.random() * 0.5 - 0.1,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '#C89B3C' : '#0bc4e3',
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, createParticle);
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5) particles[i] = { ...createParticle(), x: Math.random() * W, y: H + 5 };
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  init();
  tick();
})();

/* ─── 화면 전환 ─── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

/* ─── 로비 ─── */
// 초대 링크로 접속 시 방 코드 자동 입력
(function() {
  const params = new URLSearchParams(location.search);
  const joinCode = params.get('join');
  if (joinCode) {
    document.getElementById('joinInput').classList.remove('hidden');
    document.getElementById('roomCodeInput').value = joinCode.toUpperCase();
  }
})();

function showJoinInput() {
  document.getElementById('joinInput').classList.toggle('hidden');
}

function createRoom() {
  const name = document.getElementById('playerName').value.trim();
  if (!name) return flashInput('playerName', '닉네임을 입력해주세요!');
  myName = name;
  socket.emit('createRoom', { playerName: name });
}

function joinRoom() {
  const name = document.getElementById('playerName').value.trim();
  const code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
  if (!name) return flashInput('playerName', '닉네임 입력!');
  if (code.length !== 6) return flashInput('roomCodeInput', '6자리 코드!');
  myName = name;
  socket.emit('joinRoom', { roomId: code, playerName: name });
}

function flashInput(id, msg) {
  const el = document.getElementById(id);
  el.style.borderColor = '#e84057';
  el.placeholder = msg;
  setTimeout(() => { el.style.borderColor = ''; el.placeholder = ''; }, 1500);
}

function selectRound(n, btn) {
  selectedRounds = n;
  document.querySelectorAll('.round-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

socket.on('roomCreated', ({ roomId }) => {
  myRoomId = roomId;
  myId = socket.id;
  document.getElementById('roomCodeDisplay').textContent = roomId;
  showScreen('room');
  setHostLine('waiting');
  updateInvitePanel();
  initVoiceChat();
});

socket.on('joinedRoom', ({ roomId }) => {
  myRoomId = roomId;
  myId = socket.id;
  document.getElementById('roomCodeDisplay').textContent = roomId;
  showScreen('room');
  updateInvitePanel();
  initVoiceChat();
});

function copyRoomCode() {
  navigator.clipboard.writeText(myRoomId).then(() => {
    const btn = document.querySelector('.invite-copy-btn.secondary');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '✅ 복사됨';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

function copyInviteLink() {
  const url = `${serverBaseUrl}?join=${myRoomId}`;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.querySelector('.invite-copy-btn:not(.secondary)');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '✅ 복사됨';
    setTimeout(() => btn.textContent = orig, 1500);
  });
}

// 구버전 호환
function shareInviteLink() { copyInviteLink(); }

let serverBaseUrl = location.origin;

// 서버의 실제 네트워크 IP를 가져옴
fetch('/api/server-url')
  .then(r => r.json())
  .then(({ url }) => { serverBaseUrl = url; })
  .catch(() => {});

function updateInvitePanel() {
  const urlEl = document.getElementById('inviteUrl');
  if (urlEl && myRoomId) {
    urlEl.textContent = `${serverBaseUrl}?join=${myRoomId}`;
  }
}

function updateJoinStatus(players) {
  const MAX = 10;
  const count = players.length;
  const countEl = document.getElementById('joinStatusCount');
  const dotsEl = document.getElementById('joinStatusDots');
  if (!countEl || !dotsEl) return;

  countEl.textContent = `${count}명 입장`;
  dotsEl.innerHTML = Array.from({ length: MAX }, (_, i) => {
    if (i < count) {
      const p = players[i];
      const initials = p.name.charAt(0);
      return `<div class="join-dot filled" title="${p.name}">${initials}</div>`;
    }
    return `<div class="join-dot empty">·</div>`;
  }).join('');
}

function startGame() {
  socket.emit('startGame');
}

/* ─── 게임 상태 ─── */
socket.on('gameState', (state) => {
  gameState = state;
  const me = state.players.find(p => p.id === socket.id);
  if (me) isHost = me.isHost;

  if (state.phase === 'lobby') {
    renderLobby(state);
    // 결과 오버레이가 열려있으면 화면 전환 안 함 (방장이 직접 시작할 때까지 대기)
    const overlay = document.getElementById('resultOverlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      // 방장에게 다음 라운드 시작 버튼 표시
      const hostBtn = document.getElementById('revealNextBtn');
      if (hostBtn) hostBtn.style.display = isHost ? 'block' : 'none';
      return;
    }
    showScreen('room');
  } else {
    renderGameHUD(state);
    if (!document.getElementById('screen-game').classList.contains('active')) {
      showScreen('game');
    }
    if (state.phase === 'discussion') startDiscussionUI();
    else if (state.phase === 'voting')    startVotingUI(state);
    else if (state.phase === 'chameleonGuess') startGuessUI();
  }
});

function renderLobby(state) {
  const list = document.getElementById('playersList');
  list.innerHTML = state.players.map((p, i) => `
    <div class="player-card ${p.isHost ? 'is-host' : ''}">
      ${p.isHost ? '<span class="host-crown">HOST</span>' : ''}
      <div class="player-avatar">${AVATARS[i % AVATARS.length]}</div>
      <div class="player-name">${p.name}</div>
    </div>
  `).join('');

  document.getElementById('playerCountBadge').textContent = `${state.players.length} / 10`;
  updateJoinStatus(state.players);
  updateInvitePanel();

  const me = state.players.find(p => p.id === socket.id);
  if (me?.isHost) {
    document.getElementById('hostControls').classList.remove('hidden');
    document.getElementById('guestWait').classList.add('hidden');
  } else {
    document.getElementById('hostControls').classList.add('hidden');
    document.getElementById('guestWait').classList.remove('hidden');
  }

  renderVoiceChips(state.players, 'voiceChips');
}

function renderGameHUD(state) {
  document.getElementById('hudRound').textContent = `ROUND ${state.round} / ${state.maxRounds}`;
  const phaseMap = { discussion: '자유 토론', voting: '투표', chameleonGuess: '라이엇 역맞추기' };
  document.getElementById('hudPhase').textContent = phaseMap[state.phase] || '';
  renderScores(state.players);
  renderVoiceChips(state.players, 'voiceChipsMini');
}

function renderScores(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  document.getElementById('scoreList').innerHTML = sorted.map((p, i) => `
    <div class="score-entry">
      <span>${['🥇','🥈','🥉'][i] || (i+1)+'.'} ${p.name}</span>
      <span class="pts">${p.score}점</span>
    </div>
  `).join('');
}

function renderVoiceChips(players, containerId) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = players.map(p =>
    `<div class="voice-chip ${containerId.includes('Mini') ? 'mini' : ''}" id="vc-${containerId}-${p.id}">
      🎙️ ${p.name}
    </div>`
  ).join('');
}

function renderClues(clues) {
  document.getElementById('clueList').innerHTML = clues.map((c, i) => `
    <div class="clue-item">
      <span class="clue-order">${i + 1}</span>
      <span class="clue-author">${c.playerName}</span>
      <span class="clue-text">${c.clue}</span>
    </div>
  `).join('');
}

/* ─── 라운드 시작 ─── */
socket.on('roundStart', ({ round, maxRounds, category, isSpy: ic, myWord: word }) => {
  isSpy = ic;
  myWord = word;
  myVote = null;

  ['phaseDiscussion','phaseVoting','phaseGuess','resultOverlay'].forEach(id =>
    document.getElementById(id).classList.add('hidden'));

  // 역할 카드
  const roleCard = document.getElementById('myRoleCard');
  roleCard.className = `role-card ${ic ? 'spy' : 'normal'}`;
  roleCard.classList.remove('hidden');
  roleCard.innerHTML = `
    <div class="role-inner">
      <div class="role-icon">${ic ? '🕵️' : '🏙️'}</div>
      <div class="role-info">
        <div class="role-type">${ic ? '⚠️ 당신은 라이엇!' : '✅ 시민'}</div>
        <div class="role-word">${word}</div>
        <div class="role-hint">${ic
          ? '⚠️ 이건 가짜 단어! 진짜 단어를 대화에서 유추하세요.'
          : '이 단어로 힌트를 주며 라이엇을 찾아내세요!'
        }</div>
      </div>
    </div>
    <div class="role-bg-text">${ic ? 'RIOT' : word}</div>
  `;

  showScreen('game');
  setHostLine('roundStart');

  // 3초 후 바로 토론 단계 표시
  setTimeout(() => {
    startDiscussionUI();
  }, 3000);
});

/* ─── 토론 ─── */
function startDiscussionUI() {
  ['phaseVoting','phaseGuess'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('phaseDiscussion').classList.remove('hidden');
  setHostLine('discussion');

  // 참여자 단어 카드 (내 단어만 표시, 남의 단어는 비밀)
  const pCards = document.getElementById('playerWordCards');
  if (pCards) {
    pCards.innerHTML = `
      <div class="my-word-badge">
        내 단어: <strong>${myWord}</strong>
      </div>
    `;
  }

  let sec = 60;
  const circle = document.getElementById('timerCircle');
  const num = document.getElementById('timerNum');
  const circumference = 339.3;

  clearInterval(timerInterval);
  circle.style.strokeDashoffset = '0';
  num.textContent = sec;

  timerInterval = setInterval(() => {
    sec--;
    num.textContent = Math.max(0, sec);
    circle.style.strokeDashoffset = `${circumference * (1 - sec / 60)}`;
    if (sec <= 10) circle.style.stroke = '#e84057';
    if (sec <= 0) clearInterval(timerInterval);
  }, 1000);
}

/* ─── 투표 ─── */
function startVotingUI(state) {
  clearInterval(timerInterval);
  ['phaseDiscussion','phaseGuess'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('phaseVoting').classList.remove('hidden');
  document.getElementById('voteStatus').classList.add('hidden');
  setHostLine('voting');

  const src = state || gameState;
  const others = (src?.players || []).filter(p => p.id !== socket.id);
  document.getElementById('voteGrid').innerHTML = others.map((p, i) => `
    <button class="vote-btn" onclick="castVote('${p.id}', this)">
      ${AVATARS[(src.players.indexOf(p)) % AVATARS.length]} ${p.name}
    </button>
  `).join('');
}

function castVote(targetId, btn) {
  if (myVote) return;
  myVote = targetId;
  document.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  socket.emit('vote', { targetId });
  document.getElementById('voteStatus').classList.remove('hidden');
}

socket.on('voteUpdate', ({ votedCount, total }) => {
  document.getElementById('voteCount').textContent = `집계 중... ${votedCount} / ${total}`;
});

/* ─── 투표 결과 ─── */
socket.on('voteResult', ({ eliminated, isChameleon: ic, votes }) => {
  const overlay = document.getElementById('resultOverlay');
  const content = document.getElementById('resultContent');
  const rows = votes.map(v => `
    <div class="result-score-row">
      <span class="rs-name">${v.name}</span>
      <span class="rs-pts">${v.count}표</span>
    </div>
  `).join('');
  content.innerHTML = `
    <div style="font-size:3rem;margin-bottom:.5rem">${ic ? '🎯' : '😅'}</div>
    <h2>${ic ? 'SPY 발각!' : 'SPY 생존!'}</h2>
    <p style="color:var(--text);margin:.75rem 0">지목: <strong style="color:var(--text-b)">${eliminated}</strong></p>
    ${rows}
  `;
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('hidden'), 3500);

  if (ic) setHostLine('spyCaught');
});

/* ─── 라이엇 역맞추기 ─── */
function startGuessUI() {
  ['phaseDiscussion','phaseVoting'].forEach(id => document.getElementById(id).classList.add('hidden'));
  document.getElementById('phaseGuess').classList.remove('hidden');

  if (isSpy) {
    document.getElementById('guessInput').classList.remove('hidden');
    document.getElementById('guessWait').classList.add('hidden');
    document.getElementById('guessHint').innerHTML =
      `카테고리: <span class="gold">${gameState?.category || ''}</span> — 단어를 맞추면 <span class="gold">3점!</span>`;
    document.getElementById('guessWord').focus();
  } else {
    document.getElementById('guessInput').classList.add('hidden');
    document.getElementById('guessWait').classList.remove('hidden');
  }
}

socket.on('guessTurn', startGuessUI);

function submitGuess() {
  const guess = document.getElementById('guessWord').value.trim();
  if (!guess) return;
  socket.emit('chameleonGuess', { guess });
  document.getElementById('guessInput').classList.add('hidden');
  document.getElementById('guessWait').classList.remove('hidden');
}

socket.on('chameleonGuessResult', ({ guess, correct, actualWord, chameleonName }) => {
  const overlay = document.getElementById('resultOverlay');
  document.getElementById('resultContent').innerHTML = `
    <div style="font-size:3rem;margin-bottom:.5rem">${correct ? '🎉' : '💀'}</div>
    <h2>${correct ? '역전! 라이엇 승리!' : '탈락! 시민 승리!'}</h2>
    <p style="margin:.75rem 0;color:var(--text)">라이엇: <strong style="color:var(--text-b)">${chameleonName}</strong></p>
    <p>추측: <strong>${guess}</strong><br>
    정답: <strong style="color:var(--gold)">${actualWord}</strong></p>
  `;
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('hidden'), 4500);
  setHostLine(correct ? 'spyWin' : 'spyLose');
});

/* ─── 라운드 종료 ─── */
socket.on('roundEnd', ({ chameleonName, citizenWord, spyWord, myRole, scores, isGameOver, currentRound, maxRounds }) => {
  setTimeout(() => {
    const overlay = document.getElementById('resultOverlay');
    const amSpy = myRole === 'spy';
    const revealMsg = amSpy
      ? `<p style="color:#ff6b6b;font-weight:700;margin:.25rem 0 0">나는 라이엇이었다!</p><p style="color:var(--text);font-size:.85rem;margin:.25rem 0 .5rem">시민들의 단어는 <strong style="color:var(--gold)">${citizenWord}</strong> 였습니다</p>`
      : `<p style="color:#4ecdc4;font-weight:700;margin:.25rem 0 0">나는 시민이었다!</p><p style="color:var(--text);font-size:.85rem;margin:.25rem 0 .5rem">라이엇의 단어는 <strong style="color:#ff6b6b">${spyWord}</strong> 였습니다</p>`;

    document.getElementById('resultContent').innerHTML = `
      <h2 style="color:var(--gold)">라운드 ${currentRound} / ${maxRounds} 종료</h2>
      <div style="background:rgba(255,255,255,.05);border:1px solid rgba(200,155,60,.3);border-radius:10px;padding:.75rem 1rem;margin:.75rem 0 1rem">
        <div style="display:flex;justify-content:center;gap:2rem;margin-bottom:.5rem">
          <div style="text-align:center">
            <div style="font-size:.7rem;letter-spacing:1.5px;color:#4ecdc4;margin-bottom:.2rem">시민 단어</div>
            <div style="font-size:1.2rem;font-weight:700;color:var(--gold)">${citizenWord}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:.7rem;letter-spacing:1.5px;color:#ff6b6b;margin-bottom:.2rem">라이엇 단어</div>
            <div style="font-size:1.2rem;font-weight:700;color:#ff6b6b">${spyWord}</div>
          </div>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,.1);padding-top:.5rem;text-align:center">
          <span style="font-size:.8rem;color:var(--text)">라이엇: </span>
          <strong style="color:#ff6b6b">${chameleonName}</strong>
        </div>
      </div>
      <div style="background:rgba(${amSpy ? '255,107,107' : '78,205,196'},.1);border:1px solid rgba(${amSpy ? '255,107,107' : '78,205,196'},.3);border-radius:8px;padding:.6rem 1rem;margin-bottom:1rem">
        ${revealMsg}
      </div>
      <h3 style="margin-bottom:.75rem;font-size:.85rem;letter-spacing:2px;color:var(--gold)">SCOREBOARD</h3>
      ${scores.map((s, i) => `
        <div class="result-score-row">
          <span class="rs-rank">${['🥇','🥈','🥉'][i]||i+1+'.'}</span>
          <span class="rs-name">${s.name}</span>
          <span class="rs-pts">${s.score}점</span>
        </div>
      `).join('')}
      ${isGameOver ? '' : `
        <div id="revealNextBtn" style="display:none;margin-top:1rem">
          <button onclick="hostStartNext()" style="background:var(--gold);color:#0a0e1a;border:none;padding:.7rem 2rem;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;letter-spacing:1px">
            다음 라운드 시작 ▶
          </button>
        </div>
        <p id="revealWaitMsg" style="color:var(--text);margin-top:1rem;font-size:.82rem">방장이 다음 라운드를 시작할 때까지 대기 중...</p>
      `}
    `;
    overlay.classList.remove('hidden');
    // 방장이면 버튼 즉시 표시
    const hostBtn = document.getElementById('revealNextBtn');
    if (hostBtn) hostBtn.style.display = isHost ? 'block' : 'none';
    const waitMsg = document.getElementById('revealWaitMsg');
    if (waitMsg) waitMsg.style.display = isHost ? 'none' : 'block';
  }, 600);
});

/* ─── 게임 오버 ─── */
socket.on('gameOver', ({ scores }) => {
  const medals = ['🥇','🥈','🥉'];
  document.getElementById('finalScores').innerHTML = scores.map((s, i) => `
    <div class="final-row">
      <span class="final-medal">${medals[i] || (i+1)+'.'}</span>
      <span class="final-name">${s.name}</span>
      <span class="final-pts">${s.score}점</span>
    </div>
  `).join('');
  setHostLine('gameOver');
  showScreen('gameover');
});

function hostStartNext() {
  document.getElementById('resultOverlay').classList.add('hidden');
  showScreen('room');
  socket.emit('startGame');
}

function leaveRoom() {
  if (!confirm('방을 나가시겠어요?')) return;
  socket.emit('leaveRoom');
  showScreen('lobby');
}

function backToLobby() {
  document.getElementById('screen-lobby').classList.add('active');
  document.querySelectorAll('.screen').forEach(s => { if (s.id !== 'screen-lobby') s.classList.remove('active'); });
}

/* ─── 채팅 ─── */
socket.on('chat', ({ system, playerName, text }) => {
  const box = document.getElementById('chatBox');
  if (!box) return;
  const div = document.createElement('div');
  div.className = 'chat-msg' + (system ? ' system' : '');
  div.innerHTML = system ? text : `<span class="author">${playerName}</span> ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
});

function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  socket.emit('chat', { text });
  input.value = '';
}

/* ─── 에러 ─── */
socket.on('error', msg => alert(msg));
socket.on('connect', () => { myId = socket.id; });

/* ─── 보이스챗 WebRTC ─── */
async function initVoiceChat() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStream.getAudioTracks()[0].enabled = false;
  } catch (e) {
    console.warn('마이크 접근 실패:', e);
  }
}

function toggleMic() {
  micOn = !micOn;
  if (localStream) {
    localStream.getAudioTracks().forEach(t => t.enabled = micOn);
    if (micOn && gameState) {
      gameState.players.forEach(p => {
        if (p.id !== socket.id && !peers[p.id]) createPeer(p.id, true);
      });
    }
  }

  const label = micOn ? '🔇 OFF' : '🎙️ ON';
  const muteClass = micOn ? 'muted' : '';
  ['micBtnRoom','micBtnGame'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.textContent = label;
    btn.className = btn.className.replace(/\bmuted\b/, '').trim() + (micOn ? ' muted' : '');
  });
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  ]
};

function createPeer(targetId, initiator) {
  if (!localStream) return;
  if (peers[targetId]) return;
  const peer = new SimplePeer({ initiator, stream: localStream, trickle: true, config: ICE_SERVERS });
  peer.on('signal', sig => socket.emit('signal', { to: targetId, signal: sig }));
  peer.on('stream', remoteStream => {
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.play();
    monitorSpeaking(targetId, remoteStream);
  });
  peer.on('error', () => delete peers[targetId]);
  peer.on('close', () => delete peers[targetId]);
  peers[targetId] = peer;
}

socket.on('signal', ({ from, signal }) => {
  if (peers[from]) {
    peers[from].signal(signal);
  } else {
    createPeer(from, false);
    setTimeout(() => { if (peers[from]) peers[from].signal(signal); }, 200);
  }
});

// 새 플레이어 입장 시 마이크 켜져 있으면 자동 연결
socket.on('playerJoined', ({ playerId }) => {
  if (micOn && localStream && playerId !== socket.id && !peers[playerId]) {
    setTimeout(() => createPeer(playerId, true), 500);
  }
});

function monitorSpeaking(playerId, stream) {
  try {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    ctx.createMediaStreamSource(stream).connect(analyser);
    analyser.fftSize = 512;
    const data = new Uint8Array(analyser.frequencyBinCount);
    function check() {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      ['voiceChips','voiceChipsMini'].forEach(cid => {
        const chip = document.getElementById(`vc-${cid}-${playerId}`);
        if (chip) chip.classList.toggle('speaking', avg > 15);
      });
      requestAnimationFrame(check);
    }
    check();
  } catch (e) {}
}
