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
    { real: '사자', spy: '지렁이' }, { real: '강아지', spy: '악어' },
    { real: '코끼리', spy: '문어' }, { real: '독수리', spy: '달팽이' },
    { real: '상어', spy: '다람쥐' }, { real: '원숭이', spy: '해파리' },
    { real: '토끼', spy: '하이에나' }, { real: '펭귄', spy: '낙타' },
    { real: '기린', spy: '두더지' }, { real: '고릴라', spy: '해마' },
  ]},
  { category: '음식', pairs: [
    { real: '피자', spy: '김치찌개' }, { real: '치킨', spy: '팥빙수' },
    { real: '라면', spy: '수박' }, { real: '떡볶이', spy: '샐러드' },
    { real: '햄버거', spy: '된장국' }, { real: '초밥', spy: '고구마' },
    { real: '케이크', spy: '순대국밥' }, { real: '짜장면', spy: '딸기' },
    { real: '삼겹살', spy: '아이스크림' }, { real: '파스타', spy: '잡채' },
  ]},
  { category: '직업', pairs: [
    { real: '의사', spy: '도배사' }, { real: '소방관', spy: '요리사' },
    { real: '선생님', spy: '잠수사' }, { real: '파일럿', spy: '농부' },
    { real: '변호사', spy: '청소부' }, { real: '작가', spy: '트럭운전사' },
    { real: '배우', spy: '어부' }, { real: '경찰관', spy: '바리스타' },
    { real: '운동선수', spy: '약사' }, { real: '건축가', spy: '미용사' },
  ]},
  { category: '나라', pairs: [
    { real: '미국', spy: '네팔' }, { real: '일본', spy: '브라질' },
    { real: '프랑스', spy: '몽골' }, { real: '독일', spy: '케냐' },
    { real: '중국', spy: '멕시코' }, { real: '호주', spy: '이란' },
    { real: '인도', spy: '덴마크' }, { real: '영국', spy: '베트남' },
  ]},
  { category: '스포츠', pairs: [
    { real: '축구', spy: '탁구' }, { real: '야구', spy: '수영' },
    { real: '농구', spy: '볼링' }, { real: '테니스', spy: '역도' },
    { real: '권투', spy: '골프' }, { real: '스키', spy: '양궁' },
    { real: '태권도', spy: '사이클' }, { real: '배구', spy: '펜싱' },
  ]},
  { category: '탈것', pairs: [
    { real: '자동차', spy: '카약' }, { real: '비행기', spy: '우마차' },
    { real: '기차', spy: '스쿠터' }, { real: '배', spy: '트랙터' },
    { real: '버스', spy: '행글라이더' }, { real: '자전거', spy: '잠수함' },
    { real: '헬리콥터', spy: '리어카' },
  ]},
  { category: '과일', pairs: [
    { real: '사과', spy: '두리안' }, { real: '바나나', spy: '석류' },
    { real: '딸기', spy: '파파야' }, { real: '포도', spy: '아보카도' },
    { real: '수박', spy: '자몽' }, { real: '복숭아', spy: '코코넛' },
    { real: '키위', spy: '감' }, { real: '오렌지', spy: '무화과' },
  ]},
  { category: '장소', pairs: [
    { real: '해변', spy: '지하철역' }, { real: '학교', spy: '동굴' },
    { real: '병원', spy: '놀이공원' }, { real: '영화관', spy: '목욕탕' },
    { real: '공항', spy: '절' }, { real: '카페', spy: '경기장' },
    { real: '편의점', spy: '등대' }, { real: '도서관', spy: '항구' },
  ]},
  { category: '날씨/자연', pairs: [
    { real: '봄', spy: '사막' }, { real: '눈보라', spy: '번개' },
    { real: '무지개', spy: '지진' }, { real: '태풍', spy: '안개' },
    { real: '폭염', spy: '우박' }, { real: '가뭄', spy: '해일' },
  ]},
  { category: '유명인', pairs: [
    { real: '이순신', spy: '피카소' }, { real: '아인슈타인', spy: '클레오파트라' },
    { real: '스티브잡스', spy: '나폴레옹' }, { real: '마이클잭슨', spy: '링컨' },
    { real: '모차르트', spy: '칭기즈칸' }, { real: '세종대왕', spy: '다윈' },
  ]},
  { category: '물건', pairs: [
    { real: '스마트폰', spy: '삽' }, { real: '안경', spy: '냄비' },
    { real: '우산', spy: '사다리' }, { real: '시계', spy: '빗자루' },
    { real: '카메라', spy: '압정' }, { real: '피아노', spy: '소화기' },
    { real: '컴퓨터', spy: '양동이' }, { real: '지갑', spy: '풍선' },
  ]},
  { category: '색깔', pairs: [
    { real: '빨간색', spy: '하늘색' }, { real: '파란색', spy: '주황색' },
    { real: '초록색', spy: '분홍색' }, { real: '노란색', spy: '보라색' },
    { real: '검은색', spy: '베이지색' }, { real: '흰색', spy: '카키색' },
  ]},
  { category: '감정', pairs: [
    { real: '기쁨', spy: '분노' }, { real: '슬픔', spy: '설렘' },
    { real: '공포', spy: '뿌듯함' }, { real: '지루함', spy: '당황' },
    { real: '그리움', spy: '짜증' }, { real: '행복', spy: '억울함' },
  ]},
  { category: '상황', pairs: [
    { real: '결혼식', spy: '장례식' }, { real: '면접', spy: '소풍' },
    { real: '시험', spy: '생일파티' }, { real: '출근', spy: '캠핑' },
    { real: '야근', spy: '낮잠' }, { real: '이사', spy: '데이트' },
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
      hints: {}, // playerId → hintText
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
    io.to(roomId).emit('playerJoined', { playerId: socket.id });
  });

  socket.on('startGame', () => {
    const room = rooms[socket.roomId];
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || !player.isHost) return;
    if (room.players.length < 2) return socket.emit('error', '최소 2명이 있어야 게임을 시작할 수 있습니다.');
    startRound(socket.roomId);
  });

  socket.on('submitHint', ({ hint }) => {
    const room = rooms[socket.roomId];
    if (!room || room.phase !== 'hintPhase') return;
    if (room.hints[socket.id]) return; // 이미 제출
    const text = String(hint).trim().slice(0, 30);
    if (!text) return;
    room.hints[socket.id] = text;
    io.to(socket.roomId).emit('hintSubmitted', {
      playerId: socket.id,
      playerName: socket.playerName,
      hint: text,
      submittedCount: Object.keys(room.hints).length,
      total: room.players.length,
    });
    if (Object.keys(room.hints).length >= room.players.length) {
      startDeliberation(socket.roomId);
    }
  });

  socket.on('vote', ({ targetId }) => {
    const room = rooms[socket.roomId];
    if (!room || room.phase !== 'voting') return;
    if (socket.id === targetId) return socket.emit('error', '자기 자신에게 투표할 수 없습니다.');
    room.votes[socket.id] = targetId;
    io.to(socket.roomId).emit('voteUpdate', { votedCount: Object.keys(room.votes).length, total: room.players.length });
    if (Object.keys(room.votes).length >= room.players.length) {
      resolveVoting(socket.roomId);
    }
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

  socket.on('roomChat', ({ text }) => {
    const room = rooms[socket.roomId];
    if (!room) return;
    io.to(socket.roomId).emit('roomChat', { playerName: socket.playerName, text });
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
  room.hints = {};
  room.phase = 'hintPhase';

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
  io.to(roomId).emit('chat', { system: true, text: `🎯 라운드 ${room.round} 시작! 각자 힌트를 한 번씩 제출하세요.` });
}

function startDeliberation(roomId) {
  const room = rooms[roomId];
  room.phase = 'deliberation';
  io.to(roomId).emit('gameState', getRoomState(roomId));
  io.to(roomId).emit('chat', { system: true, text: '💬 힌트 제출 완료! 1분간 자유롭게 토론하세요.' });

  setTimeout(() => {
    if (!rooms[roomId] || rooms[roomId].phase !== 'deliberation') return;
    startVoting(roomId);
  }, 60000);
}

function startVoting(roomId) {
  const room = rooms[roomId];
  room.phase = 'voting';
  room.votes = {};
  io.to(roomId).emit('gameState', getRoomState(roomId));
  io.to(roomId).emit('chat', { system: true, text: '🗳️ 본투표! 라이어가 누구인지 지목하세요.' });
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
    })).sort((a, b) => b.count - a.count),
  });

  if (isChameleon) {
    room.phase = 'chameleonGuess';
    io.to(roomId).emit('gameState', getRoomState(roomId));
    io.to(roomId).emit('chat', { system: true, text: `🎯 라이어 ${eliminatedPlayer?.name} 발각! 단어를 맞추면 역전!` });
    io.to(room.chameleonId).emit('guessTurn');
  } else {
    if (eliminated) {
      room.players.find(p => p.id === room.chameleonId).score += 2;
      io.to(roomId).emit('chat', { system: true, text: `🦎 라이어 생존! +2점` });
    } else {
      room.players.find(p => p.id === room.chameleonId).score += 1;
    }
    endRound(roomId);
  }
}

function endRound(roomId) {
  const room = rooms[roomId];
  const chameleon = room.players.find(p => p.id === room.chameleonId);

  // 각 플레이어에게 상대방 단어 공개
  room.players.forEach(p => {
    const pIsSpy = p.id === room.chameleonId;
    io.to(p.id).emit('roundEnd', {
      chameleonName: chameleon?.name,
      citizenWord: room.word,
      spyWord: room.spyWord,
      myRole: pIsSpy ? 'spy' : 'citizen',
      scores: room.players.map(q => ({ name: q.name, score: q.score }))
        .sort((a, b) => b.score - a.score),
      isGameOver: room.round >= room.maxRounds,
      currentRound: room.round,
      maxRounds: room.maxRounds,
    });
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
    // 라운드 사이: 즉시 로비로 설정 (방장이 직접 다음 라운드 시작)
    if (!rooms[roomId]) return;
    room.phase = 'lobby';
    io.to(roomId).emit('gameState', getRoomState(roomId));
    io.to(roomId).emit('chat', { system: true, text: `✅ 라운드 ${room.round} 종료! 방장이 다음 라운드를 시작해주세요.` });
  }
}

const PORT = process.env.PORT || 8080;

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
