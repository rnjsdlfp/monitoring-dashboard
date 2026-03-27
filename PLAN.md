# Jireh's Projects Monitoring Dashboard - 구현 계획

> **목적**: 이미 개발한 여러 프로젝트들의 Server / Schedule / DB 상태를 한 곳에서 모니터링하는 통합 대시보드 웹앱
> **구현 대상 서버**: AWS Lightsail (IP 주소로 포트 없이 접속)
> **DB 없음**: 모든 데이터는 JSON 파일로 저장

---

## 기술 스택 (Tech Stack)

| 영역 | 기술 | 이유 |
|------|------|------|
| Frontend | React 18 + Vite | 빠른 개발, 모던 UI |
| Styling | Tailwind CSS v3 | 다크모드 쉬움, 클래스 기반 |
| Backend | Node.js + Express | 가볍고 간단, JSON 파일 처리 용이 |
| 데이터 저장 | JSON 파일 (fs 모듈) | DB 없이 단순하게 |
| 프로세스 관리 | PM2 | 서버 재시작 자동화 |
| 웹서버 | Nginx | 포트 없이 80번으로 접속, 리버스 프록시 |
| 패키지 관리 | npm | |

---

## 최종 폴더 구조

```
/home/ubuntu/app/project-dashboard/
├── client/                          # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # 왼쪽 메뉴바
│   │   │   ├── StatusLight.jsx      # 신호등 컴포넌트 (초록/노랑/빨강)
│   │   │   ├── ProjectRow.jsx       # 테이블 행 1개
│   │   │   ├── ProjectAccordion.jsx # 행 클릭 시 펼쳐지는 상세 정보
│   │   │   ├── AddEditModal.jsx     # 프로젝트 추가/수정 팝업
│   │   │   └── ThemeToggle.jsx      # 다크/라이트 모드 토글 버튼
│   │   ├── pages/
│   │   │   ├── ProjectsPage.jsx     # /projects 메인 화면
│   │   │   └── SettingsPage.jsx     # /settings 화면
│   │   ├── context/
│   │   │   └── ThemeContext.jsx     # 다크모드 전역 상태
│   │   ├── App.jsx                  # 라우팅, 레이아웃
│   │   ├── main.jsx                 # React 진입점
│   │   └── index.css                # Tailwind 기본 import
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                          # Express 백엔드
│   ├── routes/
│   │   ├── projects.js              # CRUD API
│   │   ├── heartbeat.js             # Schedule heartbeat 수신 API
│   │   └── settings.js              # Settings 저장/조회 API
│   ├── services/
│   │   ├── monitorService.js        # 5분마다 Server/DB 상태 체크 + 즉시발송 트리거
│   │   ├── telegramService.js       # Telegram 메세지 발송 공통 모듈
│   │   └── dailyReportService.js    # 매일 KST 09:00 Daily Report 발송
│   ├── data/
│   │   ├── projects.json            # 프로젝트 목록 + 상태 저장
│   │   ├── heartbeats.json          # Schedule heartbeat 기록
│   │   ├── settings.json            # Telegram 설정 + Reporting On/Off
│   │   └── eventLog.json            # 즉시발송/Daily Report 용 이벤트 누적 기록
│   ├── app.js                       # Express 앱 메인
│   └── package.json
│
├── PLAN.md
├── MONITORINGMETHOD.md
└── PROGRESS.md                      # 구현 진행 기록
```

---

## 데이터 구조 (JSON Schema)

### `server/data/projects.json`
```json
[
  {
    "id": "uuid-v4-string",
    "no": 1,
    "name": "프로젝트 이름",
    "description": "프로젝트 설명",
    "outputFormat": "웹사이트 / API / 봇 등",
    "serverLocation": "AWS Lightsail ap-northeast-2",
    "url": "https://example.com",
    "healthEndpoint": "https://example.com/health",
    "hasSchedule": true,
    "scheduleIntervalHours": 24,
    "hasDb": true,
    "techStack": ["Node.js", "MySQL", "React"],
    "status": {
      "server": "green",
      "schedule": "green",
      "db": "green",
      "lastUpdated": "2026-03-27T10:00:00.000Z"
    },
    "createdAt": "2026-03-27T10:00:00.000Z"
  }
]
```

**필드 설명:**
- `id`: UUID v4 형식의 고유 식별자
- `no`: 화면에 표시되는 순서 번호 (1부터 시작, 오름차순)
- `hasSchedule`: 이 프로젝트에 스케쥴 작업이 있는지 여부. false이면 Schedule 신호등 표시 안 함
- `scheduleIntervalHours`: heartbeat가 몇 시간마다 와야 하는지 (기본값: 24)
- `hasDb`: 이 프로젝트에 DB가 있는지 여부. false이면 DB 신호등 표시 안 함
- `healthEndpoint`: DB 상태 확인용 /health URL. 비어있으면 DB 체크 생략
- `status.server/schedule/db`: "green" | "yellow" | "red" | "na" 중 하나

### `server/data/heartbeats.json`
```json
{
  "uuid-of-project": {
    "lastReceived": "2026-03-27T10:00:00.000Z",
    "lastStatus": "success",
    "jobName": "daily-report"
  }
}
```

### `server/data/settings.json`
```json
{
  "telegram": {
    "botToken": "",
    "chatId": ""
  },
  "reporting": {
    "immediateAlert": {
      "enabled": true
    },
    "dailyReport": {
      "enabled": true,
      "sendHourKST": 9
    }
  }
}
```

**필드 설명:**
- `telegram.botToken`: Telegram BotFather에서 발급받은 bot token (예: `123456789:ABCdef...`)
- `telegram.chatId`: 메세지를 받을 채널 또는 채팅방 ID (예: `-1001234567890`)
- `reporting.immediateAlert.enabled`: 즉시발송 On/Off (true/false)
- `reporting.dailyReport.enabled`: Daily Report On/Off (true/false)
- `reporting.dailyReport.sendHourKST`: Daily Report 발송 시각 (KST 기준 시(hour), 기본값 9 = 오전 9시)

### `server/data/eventLog.json`
```json
[
  {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "projectId": "uuid-of-project",
    "projectName": "My App",
    "type": "server_error",
    "status": "red",
    "message": "서버 응답 없음 (timeout)",
    "resolved": false,
    "resolvedAt": null
  }
]
```

**필드 설명:**
- `type`: `"server_error"` | `"db_error"` | `"schedule_error"` | `"server_recovered"` | `"db_recovered"` | `"schedule_recovered"` | `"schedule_success"`
- `resolved`: 오류가 이후 체크에서 복구됐는지 여부
- `resolvedAt`: 복구 감지된 시각 (null이면 아직 오류 중)
- 이 파일은 Daily Report 발송 후 직전 24시간치 항목을 삭제하고, 나머지는 유지
- 파일 크기 제한: 최대 1000개 항목. 초과 시 오래된 항목부터 제거

---

## API 명세

### Projects CRUD

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/projects | 전체 프로젝트 목록 반환 |
| POST | /api/projects | 새 프로젝트 추가 |
| PUT | /api/projects/:id | 프로젝트 수정 |
| DELETE | /api/projects/:id | 프로젝트 삭제 |

### Monitoring

| Method | URL | 설명 |
|--------|-----|------|
| POST | /api/heartbeat | 각 프로젝트 cron job에서 heartbeat 수신 |
| POST | /api/monitor/run | 수동으로 모니터링 즉시 실행 (Settings 화면용) |

### Settings

| Method | URL | 설명 |
|--------|-----|------|
| GET | /api/settings | 현재 settings.json 내용 반환 |
| PUT | /api/settings | settings.json 전체 업데이트 |
| POST | /api/settings/test-telegram | 저장된 설정으로 Telegram 테스트 메세지 발송 |

#### GET /api/settings 응답 예시
```json
{
  "telegram": { "botToken": "123:abc...", "chatId": "-100123..." },
  "reporting": {
    "immediateAlert": { "enabled": true },
    "dailyReport": { "enabled": true, "sendHourKST": 9 }
  }
}
```

#### PUT /api/settings 요청 body
- GET 응답과 동일한 구조 전체를 body로 전송
- settings.json 전체를 덮어씀

#### POST /api/settings/test-telegram 응답
```json
{ "success": true, "message": "테스트 메세지가 발송됐습니다." }
// 또는
{ "success": false, "error": "Invalid token" }
```

### POST /api/heartbeat 요청 body
```json
{
  "project": "uuid-of-project",
  "job": "job이름",
  "status": "success"
}
```

### GET /api/projects 응답 예시
```json
[
  {
    "id": "abc-123",
    "no": 1,
    "name": "My App",
    ...
    "status": {
      "server": "green",
      "schedule": "yellow",
      "db": "green",
      "lastUpdated": "2026-03-27T10:00:00.000Z"
    }
  }
]
```

---

## 디자인 시스템

### 색상 팔레트

| 용도 | 다크모드 | 라이트모드 |
|------|---------|-----------|
| 배경 (메인) | `#0F172A` | `#F8FAFC` |
| 배경 (사이드바) | `#1E293B` | `#FFFFFF` |
| 배경 (카드/테이블) | `#1E293B` | `#FFFFFF` |
| 테두리 | `#334155` | `#E2E8F0` |
| 텍스트 (기본) | `#F1F5F9` | `#0F172A` |
| 텍스트 (보조) | `#94A3B8` | `#64748B` |
| 강조색 (파랑) | `#3B82F6` | `#2563EB` |
| 테이블 행 hover | `#263348` | `#F1F5F9` |

### 신호등 색상

| 상태 | 색상 코드 | Tailwind 클래스 |
|------|----------|----------------|
| 정상 (green) | `#22C55E` | `bg-green-500` |
| 경고 (yellow) | `#EAB308` | `bg-yellow-500` |
| 오류 (red) | `#EF4444` | `bg-red-500` |
| N/A | `#475569` | `bg-slate-600` |

신호등은 지름 12px 원형 dot으로 표시. 깜빡임(pulse) 애니메이션: green만 적용.

### 폰트
- Google Fonts: `Inter` (weights: 400, 500, 600, 700)
- index.html `<head>`에 import

---

## Phase 0: 로컬 개발 환경 준비

**작업 디렉토리**: `/home/ubuntu/app/project-dashboard` (서버 기준) 또는 로컬 PC에서 개발 후 배포

**필요 소프트웨어 확인 (서버에서 실행)**
```bash
node --version    # v18 이상이어야 함
npm --version     # v9 이상이어야 함
pm2 --version     # 없으면 아래 명령어로 설치
```

PM2 설치 (없을 경우):
```bash
sudo npm install -g pm2
```

**성공 기준**: `node --version`이 v18.x.x 이상 출력

---

## Phase 1: 백엔드 기초 구조 생성

**작업 파일**: `server/` 디렉토리 전체 신규 생성

### 1-1. server/package.json 생성
```json
{
  "name": "dashboard-server",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.0",
    "node-fetch": "^2.7.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 1-2. 의존성 설치
```bash
cd server && npm install
```

### 1-3. server/data/projects.json 초기 파일 생성
```json
[]
```

### 1-4. server/data/heartbeats.json 초기 파일 생성
```json
{}
```

### 1-4-1. server/data/settings.json 초기 파일 생성
```json
{
  "telegram": { "botToken": "", "chatId": "" },
  "reporting": {
    "immediateAlert": { "enabled": false },
    "dailyReport": { "enabled": false, "sendHourKST": 9 }
  }
}
```

### 1-4-2. server/data/eventLog.json 초기 파일 생성
```json
[]
```

### 1-5. server/app.js 작성

아래 기능을 포함해야 함:
- Express 앱 생성
- CORS 허용 (개발 중 프론트엔드 3000포트에서 요청 받기 위함)
- JSON body parser (`express.json()`)
- `/api/projects` 라우트 연결 (routes/projects.js)
- `/api/heartbeat` 라우트 연결 (routes/heartbeat.js)
- `/api/settings` 라우트 연결 (routes/settings.js)
- 프론트엔드 빌드 정적 파일 서빙: `express.static('../client/dist')`
- SPA 폴백: `*` 경로를 `client/dist/index.html`로 처리
- 포트: `process.env.PORT || 4000`
- 앱 시작 시 `monitorService.start()` 와 `dailyReportService.start()` 호출

```javascript
// server/app.js 전체 구조 예시
const express = require('express');
const cors = require('cors');
const path = require('path');
const projectsRouter = require('./routes/projects');
const heartbeatRouter = require('./routes/heartbeat');
const settingsRouter = require('./routes/settings');
const monitorService = require('./services/monitorService');
const dailyReportService = require('./services/dailyReportService');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api', heartbeatRouter);
app.use('/api/settings', settingsRouter);

// 프론트엔드 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  monitorService.start();
  dailyReportService.start();
});

module.exports = app;
```

**성공 기준**: `node app.js` 실행 시 "Server running on port 4000" 출력, 에러 없음

---

## Phase 2: 백엔드 API 구현

### 2-1. server/routes/projects.js

아래 5개 엔드포인트를 구현:

#### GET / (GET /api/projects)
- `server/data/projects.json` 파일을 읽어서 배열 반환
- 파일이 없으면 빈 배열 `[]` 반환
- `no` 기준 오름차순 정렬 후 반환

#### POST / (POST /api/projects)
- Request body: `{ name, description, outputFormat, serverLocation, url, healthEndpoint, hasSchedule, scheduleIntervalHours, hasDb, techStack }`
- `id`: `uuid.v4()` 로 생성
- `no`: 현재 배열 길이 + 1
- `status`: `{ server: "green", schedule: "green", db: "green", lastUpdated: new Date().toISOString() }` 로 초기화
- `createdAt`: `new Date().toISOString()`
- JSON 파일에 append 후 생성된 프로젝트 반환

#### PUT /:id (PUT /api/projects/:id)
- Request body: 수정할 필드들 (name, description, outputFormat, serverLocation, url, healthEndpoint, hasSchedule, scheduleIntervalHours, hasDb, techStack)
- `status`, `id`, `no`, `createdAt` 은 body에서 무시하고 기존 값 유지
- 해당 id의 프로젝트 찾아서 필드 업데이트 후 저장

#### DELETE /:id (DELETE /api/projects/:id)
- 해당 id의 프로젝트 삭제
- 삭제 후 남은 프로젝트들의 `no`를 1부터 재정렬
- 204 No Content 반환

#### POST /api/monitor/run (수동 모니터링 트리거)
- `monitorService.runOnce()` 호출
- 완료 후 업데이트된 전체 프로젝트 목록 반환

**파일 읽기/쓰기 헬퍼 함수** (projects.js 상단에 정의):
```javascript
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '../data/projects.json');

function readProjects() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeProjects(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
```

### 2-2. server/routes/heartbeat.js

#### POST /heartbeat (POST /api/heartbeat)
- Request body: `{ project: "uuid", job: "job이름", status: "success" | "failed" }`
- `server/data/heartbeats.json` 파일 읽기
- 해당 project id에 아래 내용 업데이트:
  ```json
  {
    "lastReceived": "ISO8601 현재시각",
    "lastStatus": "success",
    "jobName": "job이름"
  }
  ```
- heartbeats.json 저장
- projects.json 에서 해당 프로젝트의 `status.schedule` 업데이트:
  - `status === "success"` → `"green"`
  - `status === "failed"` → `"red"`
  - `status.lastUpdated` = 현재시각
- 200 OK `{ message: "heartbeat received" }` 반환

**성공 기준**:
```bash
curl -X POST http://localhost:4000/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"project":"test-id","job":"test","status":"success"}'
```
응답: `{ "message": "heartbeat received" }`

---

## Phase 3: 모니터링 서비스 구현

**파일**: `server/services/monitorService.js`

### 역할
- 5분(300,000ms)마다 모든 프로젝트의 Server와 DB 상태를 체크
- 결과를 `projects.json`의 각 프로젝트 `status` 필드에 업데이트

### checkServer(url) 함수
```
- node-fetch 로 GET 요청, timeout 5000ms
- 응답시간 측정 (Date.now() 사용)
- 200~399 응답 + 2000ms 이하 → "green"
- 200~399 응답 + 2000ms 초과 → "yellow"
- 응답 없음 / 4xx 이상 / timeout → "red"
```

### checkDb(healthEndpoint) 함수
```
- healthEndpoint가 비어있거나 null이면 "na" 반환
- GET 요청, timeout 5000ms
- 응답 JSON의 "db" 필드가 "ok" → "green"
- 응답 JSON의 "db" 필드가 있지만 "ok"가 아님 → "yellow"
- 응답 없음 / JSON 파싱 실패 / "db" 필드 없음 → "red"
```

### checkSchedule(project) 함수
```
- project.hasSchedule === false → "na" 반환
- heartbeats.json 에서 해당 project.id 조회
- heartbeat 기록 없음 → "yellow" (아직 받은 적 없음)
- lastReceived 로부터 지금까지 경과 시간 계산
- 경과 < project.scheduleIntervalHours * 1.5 * 3600000ms → "green"
- 경과 >= project.scheduleIntervalHours * 1.5 * 3600000ms → "yellow"
- 경과 >= 24 * 3600000ms (24시간) → "red"
```

### runOnce() 함수
```
- projects.json 읽기
- 각 프로젝트에 대해 Promise.all로 병렬 체크:
  1. checkServer(project.url)
  2. checkDb(project.healthEndpoint)
  3. checkSchedule(project)
- 결과를 project.status에 업데이트
- project.status.lastUpdated = new Date().toISOString()
- projects.json 저장
```

### start() 함수
```
- runOnce() 즉시 1회 실행
- setInterval(runOnce, 5 * 60 * 1000) 으로 5분마다 반복
```

### monitorService 의 즉시발송 연동 (추가 구현)

`runOnce()` 함수 안에서 상태 변화 감지 후 Telegram 즉시발송을 트리거:

```
각 프로젝트 체크 후:
1. 이전 status와 새 status를 비교
2. 변화가 있을 때만 이벤트 기록 및 알림:
   - 이전 green/yellow → 새 red: "오류 발생" 이벤트 → eventLog.json 추가 + 즉시발송
   - 이전 red → 새 green: "복구" 이벤트 → eventLog.json 추가 + 즉시발송
   - 이전 yellow → 새 yellow: 이벤트 기록 없음 (중복 방지)
3. schedule success 이벤트(heartbeat 수신 시)는 heartbeat.js에서 eventLog에 기록
```

이전 status는 이미 projects.json에 저장된 값이므로, 파일을 읽은 직후 메모리에 보존한 뒤 새 status와 비교.

**eventLog에 추가하는 헬퍼 함수** (monitorService.js 안에 정의):
```javascript
function appendEventLog(entry) {
  // eventLog.json 읽기
  // entry 추가
  // 1000개 초과 시 앞에서부터 제거
  // 저장
}
```

**성공 기준**: 서버 시작 후 5분 내로 projects.json의 status 필드들이 업데이트됨

---

## Phase 3-A: Telegram 서비스 구현

**파일**: `server/services/telegramService.js`

### 역할
- Telegram Bot API를 통해 메세지를 발송하는 공통 모듈
- 다른 서비스(monitorService, dailyReportService)에서 require해서 사용

### 필요 패키지
추가 설치 없음. `node-fetch`(이미 설치됨)로 Telegram Bot API 호출.

### sendMessage(text) 함수
```
- settings.json 에서 botToken, chatId 읽기
- botToken 또는 chatId 가 비어있으면 console.log("Telegram 설정 없음, 발송 생략") 후 return
- Telegram Bot API URL: https://api.telegram.org/bot{TOKEN}/sendMessage
- POST 요청 body:
  {
    "chat_id": chatId,
    "text": text,
    "parse_mode": "HTML"
  }
- 성공: true 반환
- 실패: console.error 출력 후 false 반환 (에러가 앱 전체에 영향 주지 않도록)
```

### sendImmediateAlert(projectName, type, status, message) 함수
```
- settings.json 에서 reporting.immediateAlert.enabled 확인
- enabled === false 이면 return (발송 안 함)
- 메세지 포맷:

🚨 <b>[즉시알림] 오류 발생</b>

📌 프로젝트: {projectName}
🔴 항목: {type}  (Server / Schedule / DB)
⚠️ 상태: {message}
🕐 시각: {KST 현재시각 YYYY.MM.DD HH:MM:SS}

- 복구된 경우 (status가 "green"으로 변경 시):
✅ <b>[즉시알림] 복구됨</b>

📌 프로젝트: {projectName}
🟢 항목: {type}
🕐 복구시각: {KST 현재시각}
```

### KST 시각 변환 헬퍼
```javascript
function toKST(date) {
  // UTC Date 객체를 받아서 KST(UTC+9) 기준 "YYYY.MM.DD HH:MM:SS" 문자열 반환
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().replace('T', ' ').replace('Z', '').slice(0, 19)
    .replace(/-/g, '.');
}
```

**성공 기준**:
```bash
# settings.json에 유효한 botToken과 chatId 입력 후 서버에서 테스트
node -e "require('./services/telegramService').sendMessage('테스트 메세지')"
```
→ Telegram 채널에 메세지 수신

---

## Phase 3-B: Daily Report 서비스 구현

**파일**: `server/services/dailyReportService.js`

### 역할
- 매일 KST 기준 `settings.json의 sendHourKST` 시각에 Daily Report를 Telegram으로 발송
- `setInterval`로 1분마다 현재 KST 시각을 체크하여 발송 시각이 되면 실행

### start() 함수
```
- 1분(60,000ms)마다 아래 체크 실행:
  1. settings.json 읽기
  2. reporting.dailyReport.enabled === false 이면 skip
  3. 현재 KST 시각의 hour와 minute 확인
  4. hour === sendHourKST AND minute === 0 이면 sendDailyReport() 실행
  5. 같은 날 중복 발송 방지: lastSentDate (모듈 내 변수) 가 오늘 날짜와 같으면 skip
```

### sendDailyReport() 함수

**수집할 데이터** (직전 24시간 기준):

1. **projects.json** 에서 현재 각 프로젝트 상태 스냅샷
2. **eventLog.json** 에서 직전 24시간 내 이벤트 필터링:
   - 오류 발생 건수 (server_error, db_error, schedule_error 타입)
   - 복구 건수 (server_recovered, db_recovered, schedule_recovered 타입)
   - 스케쥴 성공 횟수 (schedule_success 타입)

**메세지 포맷**:
```
📊 <b>Daily Report</b>
🗓 {KST 기준 어제 날짜} 00:00 ~ 오늘 {sendHourKST}:00

━━━━━━━━━━━━━━━━━━
📌 <b>프로젝트 현황</b>
━━━━━━━━━━━━━━━━━━
{프로젝트별 1줄씩}
• {프로젝트명}: Server {신호} / Schedule {신호} / DB {신호}
  └ 오류: {n}건 | 복구: {n}건 | 스케쥴 성공: {n}회

━━━━━━━━━━━━━━━━━━
📋 <b>전체 요약</b>
━━━━━━━━━━━━━━━━━━
• 총 오류 발생: {n}건
• 총 복구: {n}건
• 총 스케쥴 성공: {n}회
• 현재 오류 상태 프로젝트: {n}개

신호등 표기: 🟢 정상 / 🟡 경고 / 🔴 오류 / ⚫ N/A
```

**발송 후 처리**:
- eventLog.json 에서 직전 24시간치 항목 삭제 (더 오래된 항목은 유지)
- lastSentDate = 오늘 KST 날짜 (YYYY-MM-DD 문자열)

**성공 기준**: settings.json의 `sendHourKST`를 현재 KST 시각+1분으로 임시 설정 후 대기하면 Telegram에 리포트 수신

---

## Phase 3-C: Settings 라우트 구현

**파일**: `server/routes/settings.js`

### GET / (GET /api/settings)
```
- settings.json 읽어서 그대로 반환
- 파일 없으면 기본값 반환:
  {
    "telegram": { "botToken": "", "chatId": "" },
    "reporting": {
      "immediateAlert": { "enabled": false },
      "dailyReport": { "enabled": false, "sendHourKST": 9 }
    }
  }
```

### PUT / (PUT /api/settings)
```
- body로 받은 전체 설정 객체를 settings.json에 저장
- 저장 후 업데이트된 설정 반환
- botToken이나 chatId가 비어있어도 저장 허용 (검증 없음)
```

### POST /test-telegram (POST /api/settings/test-telegram)
```
- body: { botToken, chatId } (저장하지 않고 이 값으로 즉시 테스트)
- 테스트 메세지 내용: "✅ Jireh's Dashboard 연결 테스트 성공!\n🕐 {KST 현재시각}"
- telegramService.sendMessage() 를 botToken/chatId를 임시로 오버라이드해서 호출
- 성공: { "success": true, "message": "테스트 메세지가 발송됐습니다." }
- 실패: { "success": false, "error": "에러 메세지" }
```

---

## Phase 4: 프론트엔드 초기 설정

### 4-1. Vite + React 프로젝트 생성
```bash
cd /home/ubuntu/app/project-dashboard
npm create vite@latest client -- --template react
cd client
npm install
```

### 4-2. Tailwind CSS 설치
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 4-3. tailwind.config.js 설정
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',  // 'class' 방식으로 다크모드 전환
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F172A',
          sidebar: '#1E293B',
          card: '#1E293B',
          border: '#334155',
          text: '#F1F5F9',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

### 4-4. src/index.css 내용
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4-5. index.html - Inter 폰트 추가
`<head>` 안에 추가:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<title>Jireh's Projects Dashboard</title>
```

### 4-6. vite.config.js - 개발용 프록시 설정
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})
```
> 이 설정으로 개발 중 프론트엔드(5173포트)에서 `/api/...` 요청이 백엔드(4000포트)로 자동 전달됨

**성공 기준**: `npm run dev` 실행 시 `http://localhost:5173` 에서 Vite 기본 화면 표시

---

## Phase 5: ThemeContext 및 App.jsx 레이아웃

### 5-1. src/context/ThemeContext.jsx
```
- createContext로 ThemeContext 생성
- ThemeProvider 컴포넌트:
  - state: isDark (boolean), 초기값 localStorage.getItem('theme') === 'dark' 또는 false
  - isDark 변경 시: document.documentElement의 class에 'dark' 추가/제거
  - isDark 변경 시: localStorage.setItem('theme', isDark ? 'dark' : 'light')
  - toggleTheme 함수 제공
- useTheme() 커스텀 훅 export
```

### 5-2. src/App.jsx

**레이아웃 구조**:
```
<div class="flex h-screen overflow-hidden">
  <Sidebar />                          // 왼쪽 고정 사이드바
  <main class="flex-1 overflow-auto">  // 오른쪽 스크롤 가능한 메인 영역
    <Routes>
      <Route path="/" element={<Navigate to="/projects" />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  </main>
</div>
```

**필요한 설치**:
```bash
npm install react-router-dom
```

- `ThemeProvider`로 전체 앱 감싸기
- 다크모드: `document.documentElement`에 `dark` 클래스 적용 (Tailwind `darkMode: 'class'` 방식)
- App 컴포넌트를 `BrowserRouter`로 감싸기

### 5-3. src/components/Sidebar.jsx

**구조**:
```
사이드바 너비: w-64 (256px), 고정(fixed 또는 flex shrink-0)
배경: 다크 #1E293B / 라이트 #FFFFFF
오른쪽 테두리 1px

상단:
- 로고 텍스트: "Jireh's Dashboard" (Inter Bold, 18px)
- ThemeToggle 버튼

메뉴 섹션:
1. "Projects" 메뉴 항목
   - 클릭 시 하위 목록 접기/펼치기 (isProjectsOpen state)
   - 펼쳐진 상태에서 projects 배열 순회하며 각 프로젝트 이름 표시
   - 각 프로젝트 클릭 시 /projects 페이지로 이동하며 해당 행 하이라이트
   - +/- 아이콘으로 토글 표시

2. "Settings" 메뉴 항목
   - 클릭 시 /settings 로 이동
   - 현재 active 경로면 강조 표시 (파란색 배경)

하단: 버전 텍스트 "v1.0.0" (작은 회색 텍스트)
```

프로젝트 목록 데이터는 `/api/projects`에서 fetch해서 가져옴.
fetch는 컴포넌트 mount 시 1회, 이후 30초마다 자동 갱신.

### 5-4. src/components/ThemeToggle.jsx
```
- 버튼 클릭 시 useTheme().toggleTheme() 호출
- 다크모드일 때: ☀️ 아이콘 (또는 SVG sun icon)
- 라이트모드일 때: 🌙 아이콘 (또는 SVG moon icon)
- 아이콘은 react-icons 또는 인라인 SVG 사용
```

```bash
npm install react-icons
```

**성공 기준**: 페이지 렌더링 시 사이드바 표시, 토글 버튼 클릭 시 다크/라이트 전환됨

---

## Phase 6: StatusLight 컴포넌트

**파일**: `src/components/StatusLight.jsx`

**Props**: `status` ("green" | "yellow" | "red" | "na")

```
- status === "na": 회색 점 (bg-slate-500), 툴팁 "N/A"
- status === "green": 초록 점 (bg-green-500) + animate-pulse, 툴팁 "정상"
- status === "yellow": 노랑 점 (bg-yellow-500), 툴팁 "경고"
- status === "red": 빨강 점 (bg-red-500) + animate-pulse, 툴팁 "오류"
- 점 크기: w-3 h-3 (12px) 원형
- 가운데 정렬로 table cell에 표시
```

---

## Phase 7: ProjectsPage 및 테이블 구현

**파일**: `src/pages/ProjectsPage.jsx`

### 상태 (state)
```javascript
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);
const [expandedRow, setExpandedRow] = useState(null);  // 펼쳐진 row의 id
const [showModal, setShowModal] = useState(false);
const [editingProject, setEditingProject] = useState(null);  // null이면 추가, 있으면 수정
```

### 데이터 로딩
```
- mount 시 GET /api/projects 호출
- 30초마다 자동 갱신 (setInterval)
- unmount 시 clearInterval
```

### 테이블 구조

**헤더 컬럼 (순서대로)**:
| 컬럼 | 너비 | 정렬 |
|------|------|------|
| No. | w-12 | 가운데 |
| Project Name | flex-1 | 왼쪽 |
| Server | w-20 | 가운데 |
| Schedule | w-24 | 가운데 |
| DB | w-16 | 가운데 |
| Latest Update | w-44 | 가운데 |
| Edit | w-16 | 가운데 |
| Delete | w-16 | 가운데 |

**테이블 디자인**:
- 배경: 다크 `#1E293B` / 라이트 `#FFFFFF`
- 헤더 행: 배경 `#0F172A` (다크) / `#F1F5F9` (라이트), 폰트 500, 대문자 텍스트 아님
- 각 행: hover 시 배경 변경 (`#263348` 다크 / `#F8FAFC` 라이트)
- 행 클릭 시 `expandedRow` 토글 (같은 id 클릭 시 닫힘)
- 행 사이 구분선 1px `#334155` (다크) / `#E2E8F0` (라이트)

**각 행 (ProjectRow.jsx)**:
- `No.`: project.no
- `Project Name`: project.name (폰트 500, 파란색 hover)
- `Server`: `<StatusLight status={project.status.server} />`
- `Schedule`: `<StatusLight status={project.hasSchedule ? project.status.schedule : 'na'} />`
- `DB`: `<StatusLight status={project.hasDb ? project.status.db : 'na'} />`
- `Latest Update`: `project.status.lastUpdated`를 `YYYY.MM.DD HH:MM:SS` 형식으로 변환
- `Edit`: 연필 아이콘 버튼. 클릭 시 해당 project를 editingProject로 설정 후 모달 열기
- `Delete`: 휴지통 아이콘 버튼. 클릭 시 2단계 확인 후 DELETE 요청

**Delete 2단계 확인**:
```
1단계: window.confirm("'프로젝트이름' 프로젝트를 삭제하시겠습니까?")
  → 취소 시: 아무것도 안 함
  → 확인 시: 2단계 진행

2단계: window.confirm("정말로 삭제합니다. 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?")
  → 취소 시: 아무것도 안 함
  → 확인 시: DELETE /api/projects/:id 요청 후 목록 갱신
```

**Accordion (ProjectAccordion.jsx)**:
- expandedRow가 project.id와 같을 때 행 바로 아래에 렌더링
- 배경: 다크 `#0F172A` / 라이트 `#F8FAFC`
- 부드러운 열기/닫기 애니메이션 (transition, max-height 또는 framer-motion 사용하지 않고 CSS transition으로)
- 표시 필드 (각 필드 레이블 + 값):
  - Project Description
  - Output Format
  - Server Location
  - URL (클릭 가능한 링크, 새 탭으로 열림)
  - Tech Stack (각 태그를 `<span>` 배지로 표시, 배지 색상: 파란색 계열)

**하단 버튼**:
- 테이블 오른쪽 아래에 "신규 Project 추가" 버튼
- 버튼 색상: `bg-blue-600 hover:bg-blue-700 text-white`
- 클릭 시 editingProject = null, showModal = true

---

## Phase 8: AddEditModal 구현

**파일**: `src/components/AddEditModal.jsx`

### Props
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  onSave: (data) => void,
  project: object | null   // null이면 신규 추가 모드, 있으면 수정 모드
}
```

### 모달 구조
- 전체 화면 오버레이 (반투명 검은 배경 `bg-black/60`)
- 가운데 정렬된 카드 (max-w-lg, 패딩 24px)
- 제목: "신규 Project 추가" 또는 "Project 수정"
- 오른쪽 상단 X 버튼으로 닫기
- 배경 클릭 시 닫기

### 입력 필드 목록

| 필드 | 타입 | 필수 | 비고 |
|------|------|------|------|
| Project Name | text input | 아니오 | |
| Description | textarea (3줄) | 아니오 | |
| Output Format | text input | 아니오 | 예: 웹사이트, API, 봇 |
| Server Location | text input | 아니오 | 예: AWS Lightsail ap-northeast-2 |
| URL | text input | 아니오 | |
| Health Endpoint | text input | 아니오 | DB 체크용 /health URL |
| Has Schedule | checkbox | 아니오 | 체크 시 아래 필드 표시 |
| Schedule Interval (hours) | number input | 아니오 | Has Schedule 체크 시만 표시 |
| Has DB | checkbox | 아니오 | |
| Tech Stack | 태그 입력 | 아니오 | Enter 또는 쉼표로 태그 추가, X로 제거 |

> **필수 입력 없음** - 모든 필드는 선택 사항

### Tech Stack 태그 입력 동작
```
- 텍스트 입력 후 Enter 또는 ',' 입력 시 태그 추가
- 기존 태그 옆 X 버튼으로 제거
- 태그는 배열로 관리
```

### 저장 동작
```
- 신규 추가 모드: POST /api/projects 요청
- 수정 모드: PUT /api/projects/:id 요청
- 성공 시: 모달 닫기, 프로젝트 목록 갱신
- 에러 시: alert("저장에 실패했습니다. 다시 시도해주세요.")
```

**성공 기준**: 모달 열기/닫기 정상 작동, 저장 후 테이블에 반영됨

---

## Phase 9: SettingsPage 구현

**파일**: `src/pages/SettingsPage.jsx`

### 상태 (state)
```javascript
const [settings, setSettings] = useState(null);   // GET /api/settings 결과
const [saving, setSaving] = useState(false);
const [testResult, setTestResult] = useState(null); // { success, message }
const [lastCheckTime, setLastCheckTime] = useState(null);
const [checking, setChecking] = useState(false);
```

mount 시 GET /api/settings 호출하여 settings state 초기화.

---

### 섹션 1: Telegram 설정

**UI 구성:**
```
카드 컨테이너 (border, rounded, padding)
제목: "Telegram 알림 설정"

[Bot Token]
- label: "Bot Token"
- input type="password" (보안상 마스킹)
- placeholder: "123456789:ABCdef..."
- value: settings.telegram.botToken

[Chat ID]
- label: "Chat ID"
- input type="text"
- placeholder: "-1001234567890"
- value: settings.telegram.chatId

[버튼 2개 - 나란히]
- "저장" 버튼 (파란색): PUT /api/settings 호출, 전체 settings 저장
- "테스트 발송" 버튼 (회색): POST /api/settings/test-telegram 호출
  → 성공: 초록 텍스트 "✅ 테스트 메세지가 발송됐습니다." (3초 후 사라짐)
  → 실패: 빨간 텍스트 "❌ 발송 실패: {error}" (3초 후 사라짐)
```

---

### 섹션 2: Reporting 설정

**UI 구성:**
```
카드 컨테이너
제목: "Reporting 설정"

[즉시발송 행]
- 왼쪽: 텍스트 "즉시발송"
         설명 텍스트 (작은 회색): "Server / Schedule / DB 오류 및 복구 발생 시 즉시 Telegram 발송"
- 오른쪽: Toggle 버튼 (On/Off)
  → On: 파란색 토글, settings.reporting.immediateAlert.enabled = true
  → Off: 회색 토글, settings.reporting.immediateAlert.enabled = false
  → 변경 즉시 PUT /api/settings 자동 저장

[Daily Report 행]
- 왼쪽: 텍스트 "Daily Report"
         설명 텍스트 (작은 회색): "매일 KST 기준 지정 시각에 24시간 요약 리포트 발송"
- 오른쪽: Toggle 버튼 (On/Off)
  → 변경 즉시 PUT /api/settings 자동 저장

[Daily Report 발송 시각] (Daily Report Toggle이 On일 때만 표시)
- label: "발송 시각 (KST)"
- select 드롭다운: 0시 ~ 23시 선택
- value: settings.reporting.dailyReport.sendHourKST
- 변경 즉시 PUT /api/settings 자동 저장
```

**Toggle 버튼 컴포넌트 스펙:**
```jsx
// 클릭 시 상태 전환
// On 상태: bg-blue-600, 원이 오른쪽
// Off 상태: bg-slate-600, 원이 왼쪽
// 부드러운 transition 애니메이션 (duration-200)
// 크기: w-11 h-6 (44px x 24px), 내부 원 w-4 h-4
```

---

### 섹션 3: 모니터링 수동 실행

**UI 구성:**
```
카드 컨테이너
제목: "모니터링"
설명: "서버 상태는 5분마다 자동으로 체크됩니다."

"지금 즉시 체크" 버튼
→ 클릭 시: POST /api/monitor/run 호출
→ 로딩 중: 버튼 비활성화 + "체크 중..." 텍스트 + 로딩 스피너
→ 완료 시: "마지막 수동 체크: YYYY.MM.DD HH:MM:SS" 텍스트 표시
```

---

### 섹션 4: API 정보

**UI 구성:**
```
카드 컨테이너
제목: "API 정보"
설명: "각 프로젝트의 cron job 마지막에 아래 URL로 POST 요청을 보내세요."

[Heartbeat URL]
- 코드 블록 스타일 박스: "POST http://{window.location.host}/api/heartbeat"
- 복사 버튼 (클립보드 아이콘): 클릭 시 URL 클립보드 복사 + "복사됨!" 텍스트 1초 표시

[요청 형식]
- 코드 블록:
  {
    "project": "프로젝트 UUID",
    "job": "job이름",
    "status": "success"
  }

대시보드 버전: v1.0.0 (하단 작은 텍스트)
```

---

## Phase 10: Git 설정 및 최초 배포

> **배포 방식**: 로컬 PC에서 개발 → GitHub push → 서버에서 git pull → 빌드 → PM2 재시작

---

### 10-0. .gitignore 파일 생성

**위치**: 프로젝트 루트 (`/project-dashboard/.gitignore`)

```gitignore
# 의존성 패키지 (용량 크고 서버에서 직접 설치)
node_modules/
client/node_modules/
server/node_modules/

# 프론트엔드 빌드 결과물 (서버에서 직접 빌드)
client/dist/

# 데이터 파일 (서버마다 다른 실제 데이터 + 보안 정보 포함)
server/data/projects.json
server/data/heartbeats.json
server/data/settings.json
server/data/eventLog.json

# 환경설정 파일
.env
.env.local

# OS 파일
.DS_Store
Thumbs.db
```

> **중요**: `server/data/*.json` 파일들은 Telegram Bot Token 등 민감한 정보를 포함하므로 반드시 gitignore에 포함. 단, 초기 빈 JSON 파일 구조는 서버에서 직접 생성해야 함 (아래 10-3 참조).

---

### 10-1. 로컬 PC에서 Git 초기화 및 원격 연결

**최초 1회만 실행** (로컬 PC의 project-dashboard 폴더에서):

```bash
git init
git remote add origin https://github.com/rnjsdlfp/monitoring-dashboard.git
git add .
git commit -m "initial commit: project dashboard"
git branch -M main
git push -u origin main
```

**이후 코드 변경 시 push 방법** (로컬 PC에서):
```bash
git add .
git commit -m "변경 내용 설명"
git push origin main
```

---

### 10-2. 서버에서 최초 1회 설정

**SSH로 서버 접속 후 실행:**

```bash
# 1. 프로젝트 폴더로 이동 (또는 원하는 경로에 clone)
cd /home/ubuntu/app

# 2. GitHub에서 코드 clone
git clone https://github.com/rnjsdlfp/monitoring-dashboard.git project-dashboard
cd project-dashboard

# 3. 백엔드 의존성 설치
cd server && npm install && cd ..

# 4. 프론트엔드 의존성 설치
cd client && npm install && cd ..
```

---

### 10-3. 서버에서 data 폴더 초기 파일 생성 (최초 1회)

data 폴더는 gitignore에 포함되어 있으므로 서버에서 직접 생성:

```bash
mkdir -p /home/ubuntu/app/project-dashboard/server/data

# projects.json
echo '[]' > /home/ubuntu/app/project-dashboard/server/data/projects.json

# heartbeats.json
echo '{}' > /home/ubuntu/app/project-dashboard/server/data/heartbeats.json

# eventLog.json
echo '[]' > /home/ubuntu/app/project-dashboard/server/data/eventLog.json

# settings.json
cat > /home/ubuntu/app/project-dashboard/server/data/settings.json << 'EOF'
{
  "telegram": { "botToken": "", "chatId": "" },
  "reporting": {
    "immediateAlert": { "enabled": false },
    "dailyReport": { "enabled": false, "sendHourKST": 9 }
  }
}
EOF
```

---

### 10-4. 프론트엔드 빌드 (최초 및 코드 변경 시마다)

```bash
cd /home/ubuntu/app/project-dashboard/client
npm run build
# 빌드 결과물: client/dist/ 폴더에 생성됨
```

---

### 10-5. PM2로 백엔드 서버 실행 (최초 1회)

```bash
cd /home/ubuntu/app/project-dashboard/server
pm2 start app.js --name "dashboard"
pm2 save
pm2 startup
# → 출력되는 명령어를 복사해서 그대로 실행 (sudo 포함)
```

**PM2 주요 명령어 (참고용)**:
```bash
pm2 list              # 실행 중인 프로세스 목록
pm2 logs dashboard    # 로그 확인
pm2 restart dashboard # 재시작
pm2 stop dashboard    # 중지
```

---

### 10-6. Nginx 설정 변경

**현재 상태**: IP주소 접속 시 포트 5040으로 연결되고 있음 → 제거 필요

**새 상태**: IP주소 접속 시 대시보드(포트 4000)로 연결

**Nginx 설정 파일 위치**: `/etc/nginx/sites-available/default`

수정 전 백업:
```bash
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak
```

아래 내용으로 `/etc/nginx/sites-available/default` 전체 교체:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Nginx 재시작:
```bash
sudo nginx -t                  # 설정 문법 검사 (에러 없어야 함)
sudo systemctl reload nginx
```

> **주의**: 다른 프로젝트들의 Nginx 설정 블록(포트별 server 블록)은 건드리지 말 것.

---

### 10-7. AWS Lightsail 방화벽 확인

Lightsail 콘솔 → 해당 인스턴스 → Networking 탭에서:
- 포트 80 (HTTP): 허용되어 있어야 함
- 포트 4000: 외부에서 직접 접근 불필요 (Nginx가 중계하므로)

**성공 기준**: `http://서버IP주소` (포트 없이) 접속 시 대시보드 화면 표시

---

### 10-8. 이후 코드 업데이트 배포 절차 (반복 사용)

코드를 수정할 때마다 아래 순서로 배포:

**Step 1 - 로컬 PC에서 push (PowerShell):**
```powershell
cd C:\Users\JIREH\app\project-dashboard
git add .
git commit -m "수정 내용 설명"
git push origin main
```

**Step 2 - 서버에서 pull & 재시작 (SSH 접속 후):**
```bash
cd /home/ubuntu/app/project-dashboard

# 코드 받기
git pull origin main

# 프론트엔드 재빌드 (client 코드가 변경된 경우)
cd client && npm install && npm run build && cd ..

# 백엔드 의존성 업데이트 (server/package.json이 변경된 경우)
cd server && npm install && cd ..

# PM2 재시작
pm2 restart dashboard

# 정상 동작 확인
pm2 logs dashboard --lines 20
```

> **참고**: server/data/*.json 파일들은 git pull의 영향을 받지 않으므로 기존 데이터(프로젝트 목록, Telegram 설정 등)가 그대로 유지됨.

---

## Phase 11: 전체 검증

### 체크리스트

**기본 동작**
- [ ] `http://서버IP` 접속 시 대시보드 표시
- [ ] 다크모드 ↔ 라이트모드 토글 정상 작동
- [ ] 페이지 새로고침 후에도 테마 유지 (localStorage)
- [ ] 사이드바 Projects 메뉴 +/- 토글 작동
- [ ] Settings 페이지 이동 정상

**Projects 테이블**
- [ ] 신규 프로젝트 추가 후 테이블에 표시됨
- [ ] 행 클릭 시 Accordion 열리고, 다시 클릭 시 닫힘
- [ ] Edit 버튼 클릭 시 기존 데이터 채워진 모달 열림
- [ ] 수정 후 저장 시 테이블에 반영됨
- [ ] Delete 2단계 확인 후 삭제됨
- [ ] 삭제 후 No. 재정렬됨

**모니터링**
- [ ] 신호등이 초록/노랑/빨강/회색으로 표시됨
- [ ] Schedule / DB 없는 프로젝트는 해당 컬럼 회색(N/A)으로 표시
- [ ] POST /api/heartbeat 호출 후 Schedule 상태 업데이트됨
- [ ] Settings > "지금 즉시 체크" 버튼 클릭 시 상태 즉시 업데이트

**Telegram 알림**
- [ ] Settings 페이지에서 Bot Token / Chat ID 입력 후 저장됨
- [ ] "테스트 발송" 버튼 클릭 시 Telegram 채널에 테스트 메세지 수신
- [ ] 즉시발송 Toggle On 상태에서 프로젝트 서버가 red 가 되면 Telegram 알림 수신
- [ ] 즉시발송 Toggle Off 상태에서는 알림 미발송 확인
- [ ] 오류 상태였던 프로젝트가 복구되면 복구 알림 Telegram 수신
- [ ] Daily Report Toggle On 후 `sendHourKST`를 현재 KST 시각+1분으로 설정 시 리포트 수신
- [ ] Daily Report 메세지에 각 프로젝트별 오류/성공 횟수 포함 확인
- [ ] Daily Report 발송 후 eventLog.json에서 해당 항목 삭제 확인

---

## 구현 순서 요약

```
Phase 0: 환경 준비 (Node, npm, PM2 확인)
  ↓
Phase 1: 백엔드 기초 (server/app.js, package.json, 빈 JSON 파일 5개)
  ↓
Phase 2: 백엔드 API (projects CRUD, heartbeat)
  ↓
Phase 3: 모니터링 서비스 (monitorService.js) + eventLog 연동
  ↓
Phase 3-A: Telegram 서비스 (telegramService.js)
  ↓
Phase 3-B: Daily Report 서비스 (dailyReportService.js)
  ↓
Phase 3-C: Settings 라우트 (routes/settings.js)
  ↓
Phase 4: 프론트엔드 초기 설정 (Vite, Tailwind, 폰트)
  ↓
Phase 5: ThemeContext + App.jsx 레이아웃 + Sidebar + ThemeToggle
  ↓
Phase 6: StatusLight 컴포넌트
  ↓
Phase 7: ProjectsPage + ProjectRow + ProjectAccordion
  ↓
Phase 8: AddEditModal (추가/수정 팝업)
  ↓
Phase 9: SettingsPage (Telegram 설정 + Reporting 토글 + 모니터링 수동실행 + API 정보)
  ↓
Phase 10: Git 설정 + .gitignore + 최초 배포 (clone → data 파일 생성 → 빌드 → PM2 → Nginx)
  ↓
Phase 11: 전체 검증
```

---

## 주의사항 및 알려진 제약

1. **포트 충돌 확인**: 서버에서 4000번 포트가 이미 사용 중인지 `sudo lsof -i :4000` 으로 확인. 사용 중이면 `PORT=4001` 등으로 변경
2. **기존 Nginx 설정 백업**: 수정 전 `sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak` 실행
3. **다른 프로젝트 영향 없음**: 이 대시보드는 포트 4000에서 실행되며, 기존 다른 프로젝트들의 포트는 변경하지 않음
4. **JSON 동시 쓰기 문제**: 모니터링 서비스와 API가 동시에 projects.json을 쓸 수 있으나, 트래픽이 적은 환경이므로 무시 가능
5. **HTTPS**: 현재 계획에는 포함하지 않음. 도메인 연결 후 Let's Encrypt로 별도 추가 가능
