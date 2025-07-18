# DailyQuest 백엔드 서버

DailyQuest 앱의 백엔드 API 서버입니다.

## 🚀 주요 기능

- **사용자 인증**: JWT 기반 로그인/회원가입
- **고유 코드 시스템**: 사용자 간 연동을 위한 고유 코드
- **퀘스트 관리**: 일일 퀘스트 생성, 수정, 조회
- **실시간 통신**: Socket.IO를 통한 실시간 메시지 전송
- **사용자 연동**: 고유 코드를 통한 사용자 간 연동

## 📋 기술 스택

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** 인증
- **Socket.IO** 실시간 통신
- **bcryptjs** 비밀번호 해싱

## 🛠️ 설치 및 실행

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
`config.env` 파일을 확인하고 필요시 수정:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dailyquest
JWT_SECRET=your-super-secret-jwt-key
```

### 3. MongoDB 실행
MongoDB가 로컬에서 실행 중인지 확인하세요.

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 📚 API 문서

### 인증 (Authentication)

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "password": "password123",
  "nickname": "퀘스트러"
}
```

#### 로그인
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

#### 현재 사용자 정보 조회
```
GET /api/auth/me
Authorization: Bearer <token>
```

#### 고유 코드로 사용자 검색
```
GET /api/auth/search/:uniqueCode
Authorization: Bearer <token>
```

### 사용자 관리 (Users)

#### 사용자 연동
```
POST /api/users/link
Authorization: Bearer <token>
Content-Type: application/json

{
  "uniqueCode": "ABC123"
}
```

#### 사용자 연동 해제
```
DELETE /api/users/unlink
Authorization: Bearer <token>
```

#### 연동된 사용자 정보 조회
```
GET /api/users/linked
Authorization: Bearer <token>
```

### 퀘스트 관리 (Quests)

#### 오늘의 퀘스트 조회
```
GET /api/quests/today
Authorization: Bearer <token>
```

#### 특정 날짜 퀘스트 조회
```
GET /api/quests/:date
Authorization: Bearer <token>
```

#### 퀘스트 업데이트
```
PUT /api/quests/:date
Authorization: Bearer <token>
Content-Type: application/json

{
  "quests": [
    {
      "id": "1",
      "title": "04시30분 기상하기",
      "completed": true
    }
  ],
  "encouragementMessage": "화이팅!"
}
```

#### 연동된 사용자의 퀘스트 조회
```
GET /api/quests/linked/:date
Authorization: Bearer <token>
```

#### 퀘스트 완료 상태 토글
```
PATCH /api/quests/:date/toggle/:questId
Authorization: Bearer <token>
```

### 메시지 관리 (Messages)

#### 응원 메시지 전송
```
POST /api/messages/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "toUserId": "user_id",
  "message": "화이팅!",
  "questDate": "2024-01-15"
}
```

#### 특정 날짜 메시지 조회
```
GET /api/messages/:questDate
Authorization: Bearer <token>
```

#### 메시지 읽음 처리
```
PATCH /api/messages/:messageId/read
Authorization: Bearer <token>
```

## 🔌 Socket.IO 이벤트

### 클라이언트 → 서버
- `authenticate`: 사용자 인증
- `send_encouragement`: 응원 메시지 전송
- `quest_updated`: 퀘스트 업데이트 알림

### 서버 → 클라이언트
- `receive_encouragement`: 응원 메시지 수신
- `quest_updated`: 퀘스트 업데이트 알림

## 📁 프로젝트 구조

```
backend/
├── config/
│   └── database.js          # 데이터베이스 연결
├── middleware/
│   ├── auth.js              # JWT 인증 미들웨어
│   └── errorHandler.js      # 에러 핸들러
├── models/
│   ├── User.js              # 사용자 모델
│   ├── Quest.js             # 퀘스트 모델
│   └── Message.js           # 메시지 모델
├── routes/
│   ├── auth.js              # 인증 라우터
│   ├── users.js             # 사용자 관리 라우터
│   ├── quests.js            # 퀘스트 관리 라우터
│   └── messages.js          # 메시지 관리 라우터
├── server.js                # 메인 서버 파일
├── package.json
└── README.md
```

## 🔧 환경 변수

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `PORT` | 서버 포트 | 3000 |
| `MONGODB_URI` | MongoDB 연결 URI | mongodb://localhost:27017/dailyquest |
| `JWT_SECRET` | JWT 시크릿 키 | - |
| `JWT_EXPIRES_IN` | JWT 만료 시간 | 7d |
| `CORS_ORIGIN` | CORS 허용 도메인 | http://localhost:3000 |

## 🚀 배포

### Heroku 배포
1. Heroku CLI 설치
2. Heroku 앱 생성
3. MongoDB Atlas 연결
4. 환경 변수 설정
5. 배포

### Docker 배포
```bash
# Docker 이미지 빌드
docker build -t dailyquest-backend .

# 컨테이너 실행
docker run -p 3000:3000 dailyquest-backend
```

## 📝 라이선스

MIT License 