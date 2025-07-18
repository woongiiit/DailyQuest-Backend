const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// 환경 변수 로드
dotenv.config({ path: './config.env' });

// 라우터 import
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const questRoutes = require('./routes/quests');
const messageRoutes = require('./routes/messages');

// 미들웨어 import
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = createServer(app);

// Socket.IO 설정
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 기본 미들웨어
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공
app.use('/uploads', express.static('uploads'));

// 라우터 설정
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/messages', messageRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ 
    message: 'DailyQuest API 서버가 실행 중입니다!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('클라이언트가 연결되었습니다:', socket.id);

  // 사용자 인증
  socket.on('authenticate', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`사용자 ${userId}가 인증되었습니다.`);
  });

  // 응원 메시지 전송
  socket.on('send_encouragement', (data) => {
    const { toUserId, message } = data;
    io.to(`user_${toUserId}`).emit('receive_encouragement', {
      fromUserId: socket.userId,
      message,
      timestamp: new Date()
    });
  });

  // 퀘스트 업데이트 알림
  socket.on('quest_updated', (data) => {
    const { linkedUserId } = data;
    io.to(`user_${linkedUserId}`).emit('quest_updated', {
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('클라이언트가 연결을 해제했습니다:', socket.id);
  });
});

// 에러 핸들러
app.use(errorHandler);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
});

const PORT = process.env.PORT || 3000;

// 서버 시작
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다!`);
      console.log(`📱 API 엔드포인트: http://localhost:${PORT}/api`);
      console.log(`🔌 Socket.IO: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

startServer(); 