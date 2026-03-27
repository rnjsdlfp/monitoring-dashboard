# Progress Log

## Phase 0
- 확인 완료: `node --version` = `v22.15.0`, `npm --version` = `10.9.2`
- 확인 결과: `pm2`는 현재 로컬 PC에 설치되어 있지 않음
- 판단: `pm2`는 배포용 프로세스 관리자이므로 현재 개발 진행에는 비차단 이슈

### Next
- `server/` 기본 구조와 초기 데이터 파일 생성
- Express 서버가 에러 없이 기동하는지 확인

## Phase 1
- 생성 완료: `server/package.json`
- 생성 완료: `server/app.js`
- 생성 완료: `server/routes/*.js` 최소 라우트
- 생성 완료: `server/services/*.js` 최소 서비스
- 생성 완료: `server/data/*.json` 초기 파일
- 설치 완료: `server` 의존성 `npm.cmd install`
- 검증 완료: 서버 실행 후 `GET http://127.0.0.1:4000/api/projects` 응답 코드 `200`

### Next
- Projects CRUD API 구현
- Heartbeat API 구현
- 이후 모니터링/알림 서비스와 연결

## Phase 2, 3, 3-A, 3-B, 3-C
- 구현 완료: Projects CRUD API
- 구현 완료: Heartbeat 저장 및 Schedule 상태 반영
- 구현 완료: Settings 조회/저장/Telegram 테스트 API
- 구현 완료: 서버/DB/Schedule 모니터링 서비스
- 구현 완료: 이벤트 로그 기록 및 즉시 알림 연동
- 구현 완료: Daily Report 서비스 뼈대 및 발송 조건 처리
- 추가 완료: 공통 JSON 데이터 저장 유틸리티, KST 시간 유틸리티
- 검증 완료: 프로젝트 생성 → 수정 → heartbeat → settings 저장 → monitor 실행 → 삭제 전체 흐름 통과
- 검증 완료: 빈 Telegram 설정으로 테스트 발송 시 `400` 반환

### Next
- `client/` Vite + React + Tailwind 초기 세팅
- 테마 컨텍스트, 라우팅, 사이드바, 상태등 공통 UI 구현

## Phase 4, 5, 6
- 생성 완료: `client/` Vite + React 기본 구조
- 생성 완료: Tailwind CSS, Vite proxy, Inter 폰트 설정
- 구현 완료: ThemeContext, App 레이아웃, Sidebar, ThemeToggle
- 구현 완료: StatusLight 공통 컴포넌트
- 검증 완료: `client`에서 `npm.cmd run build` 통과

### Next
- Projects 표, 아코디언, 모달 구현
- Settings 화면과 실제 API 연동 구현

## Phase 7, 8, 9
- 구현 완료: Projects 표, 추가/수정 모달, 상세 아코디언
- 구현 완료: 프로젝트 추가/수정/삭제 후 사이드바 즉시 갱신
- 구현 완료: Settings 화면, Telegram 저장/테스트, Reporting 토글, 수동 체크, API 안내
- 검증 완료: 브라우저 자동화로 프로젝트 추가, Settings 이동, Daily Report 토글, 수동 체크 확인

### Next
- `.gitignore` 추가
- 프로젝트 설명 문서 작성
- 최종 스모크 테스트 및 데이터 정리

## Phase 10, 11
- 생성 완료: `.gitignore`
- 작성 완료: `FORCodex.md`
- 정리 완료: 테스트용 `server/data/*.json` 초기화
- 검증 완료: 백엔드 API 흐름, 프론트엔드 빌드, 브라우저 핵심 흐름 테스트 통과

### Final Status
- 전체 Phase 구현 및 검증 완료
- 로컬 기준 배포 전 준비 상태 확보

## Additional UI Refinement
- 수정 완료: 사이드바 `Projects`를 실제 페이지 이동 링크로 분리
- 수정 완료: chevron 버튼은 접기/펼치기 전용으로 유지
- 수정 완료: Projects 테이블 컬럼 폭과 셀 패딩 축소
- 수정 완료: `Project Name` 셀 고정 폭 + `truncate` 적용
- 검증 완료: `client`에서 `npm.cmd run build` 통과

### Next
- 실제 브라우저에서 Projects 링크 접근성과 테이블 가독성 최종 확인
