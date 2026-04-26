# FORCodex

## 이 프로젝트를 한 문장으로 말하면
이 프로젝트는 "프로젝트 정보를 저장하고, 수정하고, 순서를 정리해서 보는 개인용 운영 대시보드"입니다.

예전에는 상태 감시에 더 가까웠지만, 지금은 목적이 훨씬 또렷합니다.

- 프로젝트를 기록한다.
- 필요할 때 빨리 찾는다.
- 운영용 주소와 관리자 주소를 같이 본다.
- 목록 순서를 직접 정리한다.

비유하면 예전엔 경보판 같았고, 지금은 잘 정리된 프로젝트 서랍장에 가깝습니다.

## 지금 구조의 핵심
현재 이 저장소는 두 층으로 되어 있습니다.

### 1. `client/`
사용자가 브라우저에서 보는 화면입니다.

- React로 화면을 만듭니다.
- Vite로 빌드합니다.
- `Projects`, `Settings` 같은 페이지가 여기 있습니다.

### 2. `server/`
원래 로컬 서버나 일반 VM 서버에서 쓰던 API입니다.

- Express 서버입니다.
- `/api/projects`, `/api/settings`를 처리합니다.
- 데이터를 `server/data/*.json` 파일에 저장합니다.

이 구조는 Lightsail 같은 "항상 켜져 있는 서버"에는 잘 맞습니다.

## 왜 Cloudflare에서는 문제가 생겼는가
이번 배포 이슈의 핵심은 아주 단순합니다.

이 프로젝트는 원래:

- Express 서버가 API를 처리하고
- 같은 서버가 `client/dist` 정적 파일도 같이 서비스하는 구조였습니다.

그런데 Cloudflare Pages에 프런트만 올리면:

- 화면 파일은 올라갈 수 있어도
- `/api/projects`, `/api/settings` 같은 API는 자동으로 생기지 않습니다.

게다가 더 중요한 문제가 있습니다.

### 로컬 JSON 파일 저장은 Cloudflare와 맞지 않습니다
지금 서버는 `fs`로 JSON 파일을 읽고 씁니다.

`fs`
Node.js에서 파일을 읽고 쓰는 기능입니다.  
지금 프로젝트는 이걸 써서 `projects.json`, `settings.json`을 저장합니다.

Cloudflare Workers/Pages는 일반 서버처럼 "내 디스크에 파일을 영구 저장"하는 구조가 아닙니다.

- 번들에 포함된 파일은 읽기 전용에 가깝고
- 임시 파일은 써도 영구 저장소가 아닙니다
- 그래서 CRUD 데이터를 JSON 파일로 유지하는 방식은 안정적으로 동작하지 않습니다

즉, 이번 빈 화면 문제는 단순히 "빌드가 안 됐다"만의 문제가 아니라,
"현재 백엔드 저장 방식이 Cloudflare 운영 방식과 다르다"는 구조 문제도 같이 있었습니다.

## 이번에 Cloudflare용으로 어떻게 바꿨는가
가장 단순하고 안정적인 방향은 아래였습니다.

- 프런트는 Cloudflare Pages에 배포
- API는 Pages Functions로 이동
- 저장은 D1 사용

### `Pages Functions`
Cloudflare Pages 안에서 같이 실행되는 서버 코드입니다.  
Express 서버를 따로 띄우지 않고도 `/api/...` 같은 동적 요청을 처리할 수 있습니다.

### `D1`
Cloudflare의 서버리스 SQL 데이터베이스입니다.  
파일 대신 DB에 저장하므로 Cloudflare 환경과 잘 맞습니다.

## 이번에 추가된 Cloudflare 관련 파일

### `client/public/_redirects`
React `BrowserRouter`가 새로고침에서도 살아있게 하는 파일입니다.

내용:

```text
/* /index.html 200
```

이 규칙이 없으면 `/projects`나 `/settings`에 직접 들어갔을 때 404가 날 수 있습니다.

### `functions/`
Cloudflare Pages Functions용 API 디렉터리입니다.

추가한 파일:

- `functions/api/projects/index.js`
- `functions/api/projects/reorder.js`
- `functions/api/projects/[id].js`
- `functions/api/settings/index.js`
- `functions/api/settings/test-telegram.js`

쉽게 말하면 기존 Express 라우트를 Cloudflare 함수 파일 여러 개로 쪼갠 것입니다.

### `functions/_lib/projects.js`
프로젝트 CRUD와 정렬 로직을 D1 기준으로 처리합니다.

여기서 하는 일:

- 프로젝트 목록 조회
- 프로젝트 생성
- 프로젝트 수정
- 프로젝트 삭제
- 드래그 정렬 결과 저장

### `functions/_lib/settings.js`
설정 저장, Telegram 테스트 발송, KST 시각 포맷을 처리합니다.

### `schema.sql`
D1 테이블 구조입니다.

이 파일로:

- `projects` 테이블
- `app_kv` 테이블

을 만듭니다.

`app_kv`
간단한 key-value 저장 테이블입니다.  
여기서는 `settings` 전체 JSON을 한 덩어리로 저장하는 데 썼습니다.

이 선택은 "설정 구조가 아직 작다"는 전제에서 가장 단순한 방법입니다.

### `wrangler.toml`
Cloudflare용 기본 설정 파일입니다.

여기에는:

- Pages 빌드 출력 디렉터리
- D1 바인딩 이름

같은 Cloudflare 관련 기준이 들어갑니다.

## 왜 이런 설계를 선택했는가

### 1. 프런트와 API를 같은 Pages 프로젝트에 둔다
따로 Worker 하나, Pages 하나로 쪼개는 방법도 있습니다.

하지만 지금 요구사항에는 과합니다.

- 프런트와 API가 같은 도메인 아래에 있으면 설정이 단순합니다.
- 프런트 코드를 크게 안 바꿔도 됩니다.
- `/api/...` 경로를 그대로 유지할 수 있습니다.

좋은 엔지니어는 "가능한 가장 작은 구조 변경"을 먼저 고릅니다.

### 2. JSON 파일 대신 D1으로 옮긴다
Cloudflare에서는 파일 저장보다 D1이 더 자연스럽습니다.

이 방식의 장점:

- CRUD 데이터가 영구 저장됩니다.
- 배포해도 데이터가 사라지지 않습니다.
- Cloudflare 런타임과 잘 맞습니다.

### 3. 기존 Express 서버는 바로 지우지 않는다
이번 변경은 Cloudflare용 배포 경로를 추가한 것입니다.

즉:

- 기존 `server/`는 일반 서버 배포용 경로
- 새 `functions/`는 Cloudflare 배포용 경로

입니다.

이렇게 해두면 기존 서버 운영을 당장 깨지 않고 Cloudflare 실험을 할 수 있습니다.

## 현재 데이터 흐름

### 프로젝트 목록 조회
1. 브라우저가 `/api/projects` 요청
2. Cloudflare Pages Function이 받음
3. D1에서 `projects` 조회
4. 정렬 순서대로 JSON 응답

### 프로젝트 생성
1. 모달에서 값 입력
2. `POST /api/projects`
3. D1에 새 row 저장
4. 화면 다시 조회

### 프로젝트 순서 변경
1. 사용자가 드래그 핸들을 끎
2. 프런트가 새 순서를 계산
3. `PUT /api/projects/reorder`로 ID 배열 전송
4. Functions가 D1의 `order_index`를 업데이트
5. 새로고침 후에도 유지

## 지금 빈 화면이 나왔을 가능성이 큰 이유
우선순위대로 보면 아래 가능성이 큽니다.

### 1. Pages가 아니라 Workers 방식으로 올렸거나, 정적 출력 폴더가 틀렸다
이 저장소의 화면 파일은 루트가 아니라 `client/dist`에 생깁니다.

Cloudflare Pages 설정에서 중요한 값:

- Build command: `cd client && npm ci && npm run build`
- Build output directory: `client/dist`

이 값이 아니면 빈 배포가 나올 수 있습니다.

### 2. SPA 라우팅 설정이 없었다
`BrowserRouter`를 쓰는 React 앱은 `_redirects`가 없으면 경로 새로고침이 깨질 수 있습니다.

### 3. 프런트만 올라가고 API가 없었다
기존 앱은 `/api/projects`와 `/api/settings`를 바로 부릅니다.

API가 없으면:

- 목록이 안 뜨고
- 설정이 안 열리고
- 저장/삭제/정렬이 동작하지 않습니다.

### 4. 저장소 구조가 Cloudflare 파일 저장 방식과 안 맞았다
기존 `server/lib/dataStore.js`는 파일 저장 기반입니다.
Cloudflare에선 이 방식을 그대로 믿으면 안 됩니다.

## Cloudflare 배포 절차

### 1. Pages 프로젝트를 기준으로 연결
Cloudflare 대시보드에서 Pages 프로젝트로 이 GitHub 저장소를 연결합니다.

중요:

- 이번 구조는 "Pages + Functions" 기준입니다.
- `workers.dev` 단독 Worker처럼 생각하면 설정이 헷갈릴 수 있습니다.

### 2. Build 설정
Cloudflare Pages 대시보드에 아래처럼 넣습니다.

- Framework preset: `None` 또는 Vite에 맞는 값
- Build command: `cd client && npm ci && npm run build`
- Build output directory: `client/dist`
- Production branch: `main`

### 3. D1 생성
PowerShell에서 예시:

```powershell
cd C:\Users\JIREH\app\project-dashboard
npx wrangler d1 create project-dashboard
```

출력된 `database_id`를 `wrangler.toml`의 `REPLACE_WITH_D1_DATABASE_ID` 자리에 넣습니다.

### 4. 스키마 적용
PowerShell:

```powershell
cd C:\Users\JIREH\app\project-dashboard
npx wrangler d1 execute project-dashboard --file=.\schema.sql
```

### 5. Pages 프로젝트에 D1 바인딩 연결
Cloudflare 대시보드에서 Pages 프로젝트 설정으로 들어가서:

- Binding name: `DB`
- Type: `D1`
- Database: `project-dashboard`

로 연결합니다.

이 이름 `DB`는 코드에서 `context.env.DB`로 읽기 때문에 정확히 맞아야 합니다.

### 6. 다시 배포
Git push 후 Pages가 새로 빌드/배포되게 하거나, 대시보드에서 재배포합니다.

## 내가 추천하는 확인 순서

### 1. 화면 파일부터 확인
- `https://<your-pages-domain>/assets/...js`가 200으로 열리는지
- `index.html`이 실제 내려오는지

### 2. API 확인
- `https://<your-pages-domain>/api/projects`
- `https://<your-pages-domain>/api/settings`

이 두 URL이 JSON을 반환하는지 봅니다.

### 3. D1 연결 확인
API가 500이면 D1 바인딩이나 스키마 적용이 빠졌을 가능성이 큽니다.

## 이번 작업에서 배울 점

### 1. 배포 플랫폼이 바뀌면 저장 방식도 다시 봐야 한다
서버를 옮긴다고 코드가 자동으로 옮겨지지는 않습니다.

특히:

- 디스크 파일 저장
- 장기 실행 프로세스
- PM2 같은 프로세스 관리자

이런 가정은 Cloudflare로 오면 깨질 수 있습니다.

### 2. "빈 화면"은 프런트 문제만이 아닐 수 있다
실무에서는 빈 화면이 나와도 원인이 꼭 CSS나 JS 번들만은 아닙니다.

이번처럼:

- 잘못된 출력 디렉터리
- 라우팅 설정 부재
- API 부재
- 백엔드 저장 구조 부적합

이 한꺼번에 겹칠 수 있습니다.

### 3. 가장 단순한 새 구조를 고르는 게 중요하다
이번 상황에서 가능한 선택지는 많았습니다.

- Cloudflare Worker 하나로 전부 다시 만들기
- Pages와 Worker를 분리하기
- 외부 DB를 따로 쓰기
- Pages Functions + D1 쓰기

여기서는 `Pages Functions + D1`이 가장 단순하고 설명 가능성이 높은 답이었습니다.

## 앞으로 조심할 점

- Telegram Bot Token, Chat ID 같은 민감 값은 장기적으로 D1보다 Secret 저장이 더 나을 수 있습니다.
- Pages Functions가 붙으면 요청 과금/제한 구조를 같이 봐야 합니다.
- 추후 사용자가 늘면 설정 데이터를 정규화할지 다시 판단해야 합니다.

## 지금 바로 확인할 명령
PowerShell 기준입니다.

프런트 빌드:

```powershell
cd C:\Users\JIREH\app\project-dashboard\client
npm.cmd run build
```

D1 생성:

```powershell
cd C:\Users\JIREH\app\project-dashboard
npx wrangler d1 create project-dashboard
```

스키마 적용:

```powershell
cd C:\Users\JIREH\app\project-dashboard
npx wrangler d1 execute project-dashboard --file=.\schema.sql
```

## 마지막 요약
이번 문제는 "Cloudflare에서 화면이 안 보인다"로 시작했지만, 실제 본질은 더 깊었습니다.

- 이 프로젝트는 원래 Express + JSON 파일 저장 구조였다.
- Cloudflare에서는 그 구조가 그대로 맞지 않는다.
- 그래서 Pages Functions와 D1으로 Cloudflare용 실행 경로를 새로 만들었다.

즉, 단순 배포 수정이 아니라 "플랫폼이 바뀌었을 때 저장과 실행 모델을 같이 맞춘 작업"이라고 보면 됩니다.
