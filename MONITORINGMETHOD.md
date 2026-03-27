# Jireh's Projects Monitoring Dashboard - 모니터링 방법

## 개요

대시보드에서 각 프로젝트의 **Server / Schedule / DB** 상태를 모니터링하는 방법을 정리합니다.
모니터링 항목별로 **필요한 작업**과 **AI 프롬프트(바로 붙여넣기용)**를 함께 제공합니다.

---

## 1. Server 상태 모니터링

### 방법: HTTP Health Check (HTTP 핑)
> **HTTP 핑(Ping)**: 대시보드 서버가 각 프로젝트 URL로 주기적으로 "살아있니?" 요청을 보내고 응답을 확인하는 방식.

- **기존 프로젝트 코드 수정 불필요**
- 대시보드 백엔드에서만 처리
- 모든 서버(같은 AWS Lightsail / 외부 서버) 동일하게 적용 가능

### 신호등 기준

| 상태 | 기준 | 색상 |
|------|------|------|
| 정상 | HTTP 200 응답, 2초 이내 | 초록 |
| 경고 | HTTP 200이지만 2~5초 소요 | 노랑 |
| 오류 | 응답 없음, 5xx 에러, 타임아웃 | 빨강 |

### 필요한 작업
- 없음. 대시보드 등록 시 프로젝트 URL만 입력하면 자동으로 체크됨.

---

## 2. Schedule 상태 모니터링

### 방법: Heartbeat 패턴 (하트비트)
> **하트비트(Heartbeat)**: 각 프로젝트의 스케쥴 작업(cron job)이 완료될 때마다 대시보드 서버로 "나 방금 정상 실행됐어요" 신호를 보내는 방식. 마치 심박수처럼 신호가 오면 살아있고, 안 오면 문제가 있는 것.

### 신호등 기준

| 상태 | 기준 | 색상 |
|------|------|------|
| 정상 | 예상 주기 내 heartbeat 수신 | 초록 |
| 경고 | 마지막 heartbeat로부터 예상 주기 1.5배 초과 | 노랑 |
| 오류 | 24시간 이상 heartbeat 없음 | 빨강 |

### 필요한 작업
각 프로젝트의 cron job 스크립트 마지막에 아래 **한 줄** 추가 필요.

```bash
# 예시 (bash cron job 마지막 줄에 추가)
curl -s "http://대시보드IP:포트/api/heartbeat?project=프로젝트이름&job=job이름" > /dev/null 2>&1
```

---

### AI 프롬프트 - Node.js/Express 프로젝트에 heartbeat 추가

```
아래는 내 프로젝트의 스케쥴 작업 코드야. 이 작업이 성공적으로 완료될 때마다
http://대시보드IP:포트/api/heartbeat 로 POST 요청을 보내는 코드를 추가해줘.

요청 body는 JSON으로:
{
  "project": "프로젝트이름",
  "job": "job이름",
  "status": "success"
}

실패 시에는 "status": "failed" 로 전송해줘.
에러가 나도 heartbeat 전송 실패가 메인 작업에 영향을 주면 안 돼.

[여기에 기존 스케쥴 코드 붙여넣기]
```

---

### AI 프롬프트 - Python 프로젝트에 heartbeat 추가

```
아래는 내 Python 프로젝트의 스케쥴 작업 코드야. 이 작업이 성공적으로 완료될 때마다
http://대시보드IP:포트/api/heartbeat 로 POST 요청을 보내는 코드를 추가해줘.

요청 body는 JSON으로:
{
  "project": "프로젝트이름",
  "job": "job이름",
  "status": "success"
}

실패 시에는 "status": "failed" 로 전송해줘.
requests 라이브러리를 사용하고, heartbeat 전송 실패가 메인 작업 실행에 영향을 주지 않도록 try/except로 감싸줘.

[여기에 기존 스케쥴 코드 붙여넣기]
```

---

### AI 프롬프트 - Shell Script (bash) cron job에 heartbeat 추가

```
아래는 내 bash cron job 스크립트야.
스크립트가 성공적으로 완료되면 아래 URL로 curl 요청을 보내줘:

성공 시: curl -X POST http://대시보드IP:포트/api/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"project":"프로젝트이름","job":"job이름","status":"success"}'

실패 시: status를 "failed"로 변경해서 전송.
curl 명령어 실패가 스크립트 전체에 영향 주지 않도록 처리해줘.

[여기에 기존 bash 스크립트 붙여넣기]
```

---

## 3. DB 상태 모니터링

### 방법: /health API 엔드포인트
> **API 엔드포인트**: 특정 URL로 접속하면 서버 내부 상태(DB 연결 여부 등)를 JSON 형식으로 돌려주는 주소. 대시보드가 이 주소를 주기적으로 조회해서 DB 상태를 확인.

### 신호등 기준

| 상태 | 기준 | 색상 |
|------|------|------|
| 정상 | `/health` 응답에서 db: "ok" | 초록 |
| 경고 | DB 응답 지연 (500ms 이상) | 노랑 |
| 오류 | db: "error" 또는 엔드포인트 자체 응답 없음 | 빨강 |

### 응답 형식 (표준)
```json
{
  "db": "ok",
  "db_latency_ms": 12,
  "timestamp": "2026-03-27T10:00:00Z"
}
```

### 필요한 작업
각 프로젝트에 `/health` GET 엔드포인트 추가 필요.

---

### AI 프롬프트 - Node.js/Express + MySQL에 /health 엔드포인트 추가

```
내 Node.js Express 앱에 /health GET 엔드포인트를 추가해줘.
이 엔드포인트는 MySQL DB에 간단한 쿼리(SELECT 1)를 실행해서 연결 상태를 확인하고,
아래 JSON을 반환해야 해:

성공 시:
{
  "db": "ok",
  "db_latency_ms": 응답시간(숫자),
  "timestamp": "ISO8601 형식 현재시각"
}

실패 시:
{
  "db": "error",
  "error": "에러 메시지",
  "timestamp": "ISO8601 형식 현재시각"
}

HTTP 상태코드는 성공 200, 실패 503으로 해줘.
기존 DB 연결 설정(pool 또는 connection)을 재사용해줘.

[여기에 기존 app.js 또는 db 연결 코드 붙여넣기]
```

---

### AI 프롬프트 - Node.js/Express + PostgreSQL에 /health 엔드포인트 추가

```
내 Node.js Express 앱에 /health GET 엔드포인트를 추가해줘.
PostgreSQL DB에 SELECT 1 쿼리를 실행해서 연결 상태를 확인하고,
아래 JSON을 반환해야 해:

성공 시:
{
  "db": "ok",
  "db_latency_ms": 응답시간(숫자),
  "timestamp": "ISO8601 형식 현재시각"
}

실패 시:
{
  "db": "error",
  "error": "에러 메시지",
  "timestamp": "ISO8601 형식 현재시각"
}

HTTP 상태코드는 성공 200, 실패 503으로 해줘.
기존 pg Pool 설정을 재사용해줘.

[여기에 기존 app.js 또는 db 연결 코드 붙여넣기]
```

---

### AI 프롬프트 - Python/Flask + MySQL에 /health 엔드포인트 추가

```
내 Python Flask 앱에 /health GET 엔드포인트를 추가해줘.
MySQL DB에 SELECT 1 쿼리를 실행해서 연결 상태를 확인하고,
아래 JSON을 반환해야 해:

성공 시:
{
  "db": "ok",
  "db_latency_ms": 응답시간(숫자),
  "timestamp": "ISO8601 형식 현재시각"
}

실패 시:
{
  "db": "error",
  "error": "에러 메시지",
  "timestamp": "ISO8601 형식 현재시각"
}

HTTP 상태코드는 성공 200, 실패 503으로 해줘.
기존 DB 연결 설정을 재사용해줘.

[여기에 기존 app.py 또는 db 연결 코드 붙여넣기]
```

---

### AI 프롬프트 - Python/FastAPI + SQLAlchemy에 /health 엔드포인트 추가

```
내 FastAPI 앱에 /health GET 엔드포인트를 추가해줘.
SQLAlchemy를 통해 DB에 SELECT 1 쿼리를 실행해서 연결 상태를 확인하고,
아래 JSON을 반환해야 해:

성공 시:
{
  "db": "ok",
  "db_latency_ms": 응답시간(숫자),
  "timestamp": "ISO8601 형식 현재시각"
}

실패 시:
{
  "db": "error",
  "error": "에러 메시지",
  "timestamp": "ISO8601 형식 현재시각"
}

HTTP 상태코드는 성공 200, 실패 503으로 해줘.
기존 SessionLocal 또는 engine 설정을 재사용해줘.

[여기에 기존 main.py 또는 database.py 코드 붙여넣기]
```

---

## 4. 전체 흐름 요약

```
대시보드 서버 (폴링 주기: 5분)
    │
    ├─ [Server 체크]
    │     └─ 각 프로젝트 URL에 HTTP GET → 응답시간/상태코드로 판단
    │
    ├─ [DB 체크]
    │     └─ 각 프로젝트의 /health 엔드포인트 GET → db 필드로 판단
    │
    └─ [Schedule 체크]
          └─ 각 프로젝트 cron job 완료 시 → /api/heartbeat POST 수신
                → data/heartbeats.json 에 마지막 수신시각 기록
                → 현재 시각과 비교하여 상태 판단
```

## 5. 각 프로젝트별 체크리스트

프로젝트를 대시보드에 등록할 때 아래 항목을 확인하세요.

| 항목 | 필요한 작업 | 비고 |
|------|------------|------|
| Server 모니터링 | 없음 | URL만 등록하면 자동 |
| DB 모니터링 | 각 프로젝트에 `/health` 엔드포인트 추가 | 위 AI 프롬프트 활용 |
| Schedule 모니터링 | 각 cron job 마지막에 heartbeat 전송 코드 추가 | 위 AI 프롬프트 활용 |

> **참고**: Schedule이나 DB가 없는 프로젝트는 해당 항목을 "N/A"로 설정하면 신호등 표시 생략 가능.
