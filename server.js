const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

// ─── 키워드 ───
const KEYWORDS = [
  { category: '동물', pairs: [
    { real: '사자', spy: '호랑이' }, { real: '강아지', spy: '고양이' },
    { real: '코끼리', spy: '하마' }, { real: '독수리', spy: '매' },
    { real: '상어', spy: '고래' }, { real: '원숭이', spy: '고릴라' },
    { real: '토끼', spy: '다람쥐' }, { real: '펭귄', spy: '북극곰' },
  ]},
  { category: '음식', pairs: [
    { real: '피자', spy: '파스타' }, { real: '치킨', spy: '삼겹살' },
    { real: '라면', spy: '우동' }, { real: '떡볶이', spy: '순대' },
    { real: '햄버거', spy: '핫도그' }, { real: '초밥', spy: '회' },
    { real: '케이크', spy: '마카롱' }, { real: '짜장면', spy: '짬뽕' },
  ]},
  { category: '직업', pairs: [
    { real: '의사', spy: '간호사' }, { real: '소방관', spy: '경찰관' },
    { real: '선생님', spy: '교수' }, { real: '요리사', spy: '제빵사' },
    { real: '파일럿', spy: '승무원' }, { real: '변호사', spy: '판사' },
    { real: '작가', spy: '기자' }, { real: '배우', spy: '가수' },
  ]},
  { category: '나라', pairs: [
    { real: '미국', spy: '캐나다' }, { real: '일본', spy: '중국' },
    { real: '프랑스', spy: '이탈리아' }, { real: '브라질', spy: '아르헨티나' },
    { real: '독일', spy: '영국' }, { real: '호주', spy: '뉴질랜드' },
    { real: '스페인', spy: '포르투갈' }, { real: '러시아', spy: '우크라이나' },
  ]},
  { category: '스포츠', pairs: [
    { real: '축구', spy: '럭비' }, { real: '야구', spy: '소프트볼' },
    { real: '농구', spy: '배구' }, { real: '테니스', spy: '배드민턴' },
    { real: '수영', spy: '다이빙' }, { real: '권투', spy: '태권도' },
    { real: '스키', spy: '스노보드' }, { real: '골프', spy: '볼링' },
  ]},
  { category: '탈것', pairs: [
    { real: '자동차', spy: '오토바이' }, { real: '비행기', spy: '헬리콥터' },
    { real: '기차', spy: '지하철' }, { real: '배', spy: '요트' },
    { real: '버스', spy: '택시' }, { real: '자전거', spy: '킥보드' },
  ]},
  { category: '과일', pairs: [
    { real: '사과', spy: '배' }, { real: '바나나', spy: '망고' },
    { real: '딸기', spy: '체리' }, { real: '포도', spy: '블루베리' },
    { real: '수박', spy: '멜론' }, { real: '오렌지', spy: '귤' },
    { real: '복숭아', spy: '자두' }, { real: '키위', spy: '파인애플' },
  ]},
  { category: '장소', pairs: [
    { real: '해변', spy: '수영장' }, { real: '학교', spy: '도서관' },
    { real: '병원', spy: '약국' }, { real: '영화관', spy: '공연장' },
    { real: '공항', spy: '기차역' }, { real: '놀이공원', spy: '동물원' },
    { real: '편의점', spy: '마트' }, { real: '카페', spy: '식당' },
  ]},
  { category: '계절/날씨', pairs: [
    { real: '봄', spy: '가을' }, { real: '여름', spy: '장마' },
    { real: '겨울', spy: '눈보라' }, { real: '태풍', spy: '폭풍' },
    { real: '무지개', spy: '소나기' }, { real: '폭염', spy: '한파' },
  ]},
  { category: '유명인', pairs: [
    { real: '이순신', spy: '세종대왕' }, { real: '아인슈타인', spy: '뉴턴' },
    { real: '스티브잡스', spy: '빌게이츠' }, { real: '마이클잭슨', spy: '비틀즈' },
    { real: '모차르트', spy: '베토벤' }, { real: '피카소', spy: '다빈치' },
  ]},
  { category: '물건', pairs: [
    { real: '스마트폰', spy: '태블릿' }, { real: '안경', spy: '선글라스' },
    { real: '우산', spy: '우비' }, { real: '시계', spy: '반지' },
    { real: '가방', spy: '지갑' }, { real: '카메라', spy: '망원경' },
    { real: '피아노', spy: '기타' },
  ]},
  { category: '색깔', pairs: [
    { real: '빨간색', spy: '주황색' }, { real: '파란색', spy: '하늘색' },
    { real: '초록색', spy: '민트색' }, { real: '노란색', spy: '베이지색' },
    { real: '보라색', spy: '분홍색' }, { real: '검은색', spy: '회색' },
  ]},
];

// ─── 방 상태 ───
const rooms = {};

function pickKeyword(usedWords = []) {
  let cat, pair, attempts = 0;
  do {
    cat = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
    pair = cat.pairs[Math.floor(Math.random() * cat.pairs.length)];
    attempts++;
  } while (usedWords.includes(pair.real) && attempts < 30);
  return { category: cat.category, real: pair.real, spy: pair.spy };
}

function getRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return null;
  return {
    players: room.players.map(p => ({
      id: p.id, name: p.name, score: p.score, isHost: p.isHost,
    })),
    phase: room.phase,
    round: room.round,
    maxRounds: room.maxRounds,
    votes: room.votes,
    category: room.phase !== 'lobby' ? room.category : null,
  };
}

// ─── 소켓 ───
io.on('connection', (socket) => {

  socket.on('createRoom', ({ playerName }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomId] = {
      id: roomId,
      players: [{ id: socket.id, name: playerName, score: 0, isHost: true }],
      phase: 'lobby',
      round: 0,
      maxRounds: 3,
      category: null,
      word: null,
      spyWord: null,
      chameleonId: null,
      votes: {},
      usedWords: [],
    };
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = playerName;
    socket.emit('roomCreated', { roomId });
    io.to(roomId).emit('gameState', getRoomState(roomId));
  });

  socket.on('joinRoom', ({ roomId, playerName }) => {
    const room = rooms[roomId];
    if (!room) return socket.emit('error', '방을 찾을 수 없습니다.');
    if (room.players.length >= 10) return socket.emit('error', '방이 꽉 찼습니다. (최대 10명)');
    if (room.phase !== 'lobby') return socket.emit('error', '게임이 이미 시작되었습니다.');
    if (room.players.find(p => p.name === playerName)) return socket.emit('error', '이미 사용 중인 닉네임입니다.');

    room.players.push({ id: socket.id, name: playerName, score: 0, isHost: false });
    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = playerName;
    socket.emit('joinedRoom', { roomId });
    io.to(roomId).emit('gameState', getRoomState(roomId));
    io.to(roomId).emit('chat', { system: true, text: `🎮 ${playerName}님이 입장했습니다!` });
  });

  socket.on('startGame', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) return;
    if (room.players.length < 2) return socket.emit('error', '최소 2명이 있어야 게임을 시작할 수 있습니다.');
    startRound(socket.roomId);
  });

  socket.on('vote', ({ targetId }) => {
    const room = rooms[socket.roomId];
    if (!room || room.phase !== 'voting') return;
    if (socket.id === targetId) return socket.emit('error', '자기 자신에게 투표할 수 없습니다.');
    room.votes[socket.id] = targetId;
    io.to(socket.roomId).emit('voteUpdate', { votedCount: Object.keys(room.votes).length, total: room.players.length });
    if (Object.keys(room.votes).length >= room.players.length) resolveVoting(socket.roomId);
  });

  socket.on('chameleonGuess', ({ guess }) => {
    const room = rooms[socket.roomId];
    if (!room || room.phase !== 'chameleonGuess') return;
    if (socket.id !== room.chameleonId) return;

    const correct = guess.trim() === room.word;
    io.to(socket.roomId).emit('chameleonGuessResult', {
      guess: guess.trim(),
      correct,
      actualWord: room.word,
      chameleonName: room.players.find(p => p.id === room.chameleonId)?.name,
    });

    if (correct) {
      room.players.find(p => p.id === room.chameleonId).score += 3;
    } else {
      room.players.filter(p => p.id !== room.chameleonId).forEach(p => p.score += 1);
    }
    endRound(socket.roomId);
  });

  socket.on('chat', ({ text }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    io.to(socket.roomId).emit('chat', { playerName: socket.playerName, text });
  });

  socket.on('signal', ({ to, signal }) => {
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  socket.on('leaveRoom', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    socket.leave(socket.roomId);
    io.to(socket.roomId).emit('chat', { system: true, text: `👋 ${socket.playerName}님이 퇴장했습니다.` });
    if (room.players.length === 0) { delete rooms[socket.roomId]; socket.roomId = null; return; }
    if (!room.players.find(p => p.isHost)) {
      room.players[0].isHost = true;
      io.to(room.players[0].id).emit('chat', { system: true, text: '👑 방장이 되었습니다!' });
    }
    io.to(socket.roomId).emit('gameState', getRoomState(socket.roomId));
    socket.roomId = null;
  });

  socket.on('setMaxRounds', ({ maxRounds }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) return;
    room.maxRounds = maxRounds;
  });

  socket.on('disconnect', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    io.to(socket.roomId).emit('chat', { system: true, text: `👋 ${socket.playerName}님이 퇴장했습니다.` });
    if (room.players.length === 0) { delete rooms[socket.roomId]; return; }
    if (!room.players.find(p => p.isHost)) {
      room.players[0].isHost = true;
      io.to(room.players[0].id).emit('chat', { system: true, text: '👑 방장이 되었습니다!' });
    }
    io.to(socket.roomId).emit('gameState', getRoomState(socket.roomId));
  });
});

// ─── 라운드 ───
function startRound(roomId) {
  const room = rooms[roomId];
  room.round++;
  const { category, real, spy } = pickKeyword(room.usedWords);
  room.usedWords.push(real);
  room.category = category;
  room.word = real;
  room.spyWord = spy;
  room.votes = {};
  room.phase = 'discussion';

  const playerIds = room.players.map(p => p.id);
  room.chameleonId = playerIds[Math.floor(Math.random() * playerIds.length)];

  room.players.forEach(p => {
    const isSpy = p.id === room.chameleonId;
    io.to(p.id).emit('roundStart', {
      round: room.round, maxRounds: room.maxRounds, category,
      isSpy, myWord: isSpy ? spy : real,
    });
  });

  io.to(roomId).emit('gameState', getRoomState(roomId));
  io.to(roomId).emit('chat', { system: true, text: `🎯 라운드 ${room.round} 시작!` });

  setTimeout(() => {
    if (rooms[roomId] && rooms[roomId].phase === 'discussion') startVoting(roomId);
  }, 60000);
}

function startVoting(roomId) {
  const room = rooms[roomId];
  room.phase = 'voting';
  room.votes = {};
  io.to(roomId).emit('gameState', getRoomState(roomId));
  io.to(roomId).emit('chat', { system: true, text: '🗳️ 투표 시작! 라이엇이 누구라고 생각하세요?' });
}

function resolveVoting(roomId) {
  const room = rooms[roomId];
  const voteCounts = {};
  Object.values(room.votes).forEach(id => { voteCounts[id] = (voteCounts[id] || 0) + 1; });
  const maxVotes = Math.max(...Object.values(voteCounts));
  const topVoted = Object.entries(voteCounts).filter(([, v]) => v === maxVotes).map(([k]) => k);

  const eliminated = topVoted.length === 1 ? topVoted[0] : null;
  const eliminatedPlayer = eliminated ? room.players.find(p => p.id === eliminated) : null;
  const isChameleon = eliminated === room.chameleonId;

  io.to(roomId).emit('voteResult', {
    eliminated: eliminatedPlayer?.name || '없음 (동점)',
    isChameleon,
    votes: Object.entries(voteCounts).map(([id, count]) => ({
      name: room.players.find(p => p.id === id)?.name,
      count,
    })),
  });

  if (isChameleon) {
    room.phase = 'chameleonGuess';
    io.to(roomId).emit('gameState', getRoomState(roomId));
    io.to(roomId).emit('chat', { system: true, text: `🎯 라이엇 ${eliminatedPlayer?.name} 발각! 단어를 맞추면 역전!` });
    io.to(room.chameleonId).emit('guessTurn');
  } else {
    if (eliminated) {
      room.players.find(p => p.id === room.chameleonId).score += 2;
      io.to(roomId).emit('chat', { system: true, text: `🦎 라이엇 생존! +2점` });
    } else {
      room.players.find(p => p.id === room.chameleonId).score += 1;
    }
    endRound(roomId);
  }
}

function endRound(roomId) {
  const room = rooms[roomId];
  const chameleon = room.players.find(p => p.id === room.chameleonId);

  io.to(roomId).emit('roundEnd', {
    chameleonName: chameleon?.name,
    word: room.word,
    scores: room.players.map(p => ({ name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score),
    isGameOver: room.round >= room.maxRounds,
  });

  if (room.round >= room.maxRounds) {
    setTimeout(() => {
      if (!rooms[roomId]) return;
      room.phase = 'gameover';
      io.to(roomId).emit('gameOver', {
        scores: room.players.map(p => ({ name: p.name, score: p.score }))
          .sort((a, b) => b.score - a.score),
      });
      // 점수 초기화 후 로비 복귀
      setTimeout(() => {
        if (!rooms[roomId]) return;
        room.phase = 'lobby';
        room.round = 0;
        room.usedWords = [];
        room.players.forEach(p => { p.score = 0; });
        io.to(roomId).emit('gameState', getRoomState(roomId));
      }, 8000);
    }, 3000);
  } else {
    // 라운드 사이: 대기실로 복귀, 방장이 다음 라운드 시작
    setTimeout(() => {
      if (!rooms[roomId]) return;
      room.phase = 'lobby';
      io.to(roomId).emit('gameState', getRoomState(roomId));
      io.to(roomId).emit('chat', { system: true, text: `✅ 라운드 ${room.round} 종료! 방장이 다음 라운드를 시작해주세요.` });
    }, 5000);
  }
}

const PORT = process.env.PORT || 3000;

let publicUrl = null;

// 클라이언트가 서버 주소를 알 수 있도록 API 제공
app.get('/api/server-url', (req, res) => {
  res.json({ url: publicUrl || `http://localhost:${PORT}` });
});

server.listen(PORT, async () => {
  console.log(`🎮 Party Game 서버 실행 중: http://localhost:${PORT}`);

  // 배포 환경(Railway 등)에서는 PUBLIC_URL 환경변수 사용
  if (process.env.PUBLIC_URL) {
    publicUrl = process.env.PUBLIC_URL;
    console.log(`   ✅ 배포 URL: ${publicUrl}`);
    return;
  }

  // 로컬 개발 환경에서는 localtunnel로 외부 접속 URL 생성
  console.log(`   🌐 외부 터널 연결 중...`);
  try {
    const localtunnel = require('localtunnel');
    const tunnel = await localtunnel({ port: PORT });
    publicUrl = tunnel.url;
    console.log(`   ✅ 외부 접속 URL: ${publicUrl}  ← 친구들에게 공유!`);
    tunnel.on('close', () => { publicUrl = null; console.log('터널 종료됨'); });
    tunnel.on('error', (err) => { console.error('터널 오류:', err.message); });
  } catch (e) {
    console.warn(`   ⚠️  터널 연결 실패: ${e.message}`);
  }
});
