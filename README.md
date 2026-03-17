# markdown-editor

`markdown-editor`는 Tauri + React + Vite + Vditor 기반의 데스크톱 마크다운 편집기입니다.  
Windows 환경에서 실행과 배포를 목표로 하며, 기본적인 파일 열기/저장/다른 이름으로 저장/출력 기능과 이미지 첨부, 드래그 앤 드롭, 본문 폭 조절 옵션을 제공합니다.

## 주요 기능

- 마크다운 문서 열기
- 마크다운 문서 저장
- 다른 이름으로 저장
- 인쇄/출력
- 이미지 업로드
- 클립보드 이미지 붙여넣기
- 이미지 파일 드래그 앤 드롭
- 편집 영역 폭 옵션 제공
  - 기본
  - 넓게
  - 전체
- 마지막으로 선택한 편집 폭 로컬 저장

## 기술 스택

- Frontend: React 18, TypeScript, Vite
- Editor: Vditor
- Desktop runtime: Tauri v2
- Backend: Rust

## 개발 환경 준비

이 프로젝트는 Node.js와 Rust가 모두 필요합니다.

### 1. Node.js 설치

- 권장: LTS 버전
- `npm`이 함께 설치되어 있어야 합니다.

확인:

```powershell
node -v
npm -v
```

### 2. Rust 설치

Tauri 빌드를 위해 Rust 툴체인이 필요합니다.

확인:

```powershell
rustc -V
cargo -V
```

### 3. Windows 빌드 도구

Windows에서 Tauri 앱을 빌드하려면 일반적으로 아래 환경이 필요합니다.

- Microsoft C++ Build Tools 또는 Visual Studio Build Tools
- WebView2 Runtime

이미 다른 Tauri 프로젝트가 빌드되는 환경이라면 대부분 그대로 사용 가능합니다.

## 설치

프로젝트 루트에서 아래 명령을 실행합니다.

```powershell
npm install
```

## 개발 모드 실행

### 브라우저 프런트엔드만 실행

```powershell
npm run dev
```

### Tauri 데스크톱 앱으로 실행

```powershell
npx tauri dev
```

또는:

```powershell
npm run tauri dev
```

개발 모드 또는 빌드 전에 `Vditor` 정적 자산은 자동으로 `public/vditor/dist`에 동기화됩니다.

## 빌드 방법

### 방법 1. `build.bat` 사용

가장 간단한 방법은 루트의 `build.bat`를 실행하는 것입니다.

```bat
build.bat
```

이 스크립트는 다음 작업을 수행합니다.

1. 현재 폴더로 이동
2. `npm install` 실행
3. `npx tauri build` 실행
4. 완료 후 결과물 위치 안내

빌드 결과물은 보통 아래 경로에서 확인할 수 있습니다.

```text
src-tauri\target\release\bundle
```

### 방법 2. 수동 빌드

필요한 단계를 직접 실행할 수도 있습니다.

```powershell
npm install
npm run build
npx tauri build
```

설명:

- `npm run build`
  - TypeScript 컴파일
  - Vite 프로덕션 번들 생성
- `npx tauri build`
  - 프런트엔드 결과물과 Rust 백엔드를 합쳐 데스크톱 앱으로 패키징

## `build.bat` 설명

`build.bat`는 Windows에서 한 번에 빌드하기 위한 배치 스크립트입니다.

주요 흐름:

```bat
call npm install
call npx tauri build
```

오류가 발생하면:

- `[ERROR] npm install failed.`
- `[ERROR] Tauri build failed.`

메시지를 출력한 뒤 종료합니다.

성공하면:

- `Build Complete!`
- `Check src-tauri\target\release\bundle`

를 출력합니다.

## 사용 방법

앱 실행 후 아래 기능을 사용할 수 있습니다.

### 파일 작업

- `열기`
- `저장`
- `다른 이름으로 저장`
- `출력`

### 단축키

- `Ctrl + S`: 저장
- `Ctrl + Shift + S`: 다른 이름으로 저장
- `Ctrl + O`: 열기
- `Ctrl + P`: 출력

### 이미지 처리

- 편집 중 이미지 파일 업로드 가능
- 클립보드 이미지 붙여넣기 가능
- 이미지 파일을 드래그 앤 드롭해서 문서에 추가 가능

주의:

- 이미지 저장 기능은 현재 문서가 먼저 저장되어 있어야 정상적으로 동작합니다.
- 이미지 파일은 문서 기준 `assets` 폴더에 저장됩니다.

### 본문 폭 조절

상단 옵션으로 편집 폭을 변경할 수 있습니다.

- `기본`
- `넓게`
- `전체`

이 설정은 브라우저 로컬 저장소에 저장되어 다음 실행 시 유지됩니다.

## 프로젝트 구조

```text
.
├─ build.bat
├─ package.json
├─ vite.config.ts
├─ public/
├─ scripts/
│  └─ sync-vditor.mjs
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ styles.css
└─ src-tauri/
   ├─ Cargo.toml
   ├─ tauri.conf.json
   └─ src/
```

### 주요 파일 설명

- `build.bat`
  - Windows용 전체 빌드 스크립트
- `package.json`
  - npm 스크립트 및 프런트엔드 의존성 정의
- `scripts/sync-vditor.mjs`
  - `node_modules/vditor/dist`를 `public/vditor/dist`로 복사
- `src/App.tsx`
  - 편집기 UI와 파일 기능의 중심 로직
- `src/styles.css`
  - 앱 레이아웃과 편집기 스타일
- `src-tauri/tauri.conf.json`
  - 앱 이름, 창 설정, 빌드 설정
- `src-tauri/src/lib.rs`
  - Tauri 명령과 플러그인 초기화

## npm 스크립트

```json
{
  "sync:vditor": "node scripts/sync-vditor.mjs",
  "predev": "npm run sync:vditor",
  "prebuild": "npm run sync:vditor",
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "tauri": "tauri"
}
```

설명:

- `npm run sync:vditor`
  - Vditor 정적 파일 동기화
- `npm run dev`
  - 프런트엔드 개발 서버 실행
- `npm run build`
  - 프런트엔드 프로덕션 빌드
- `npm run tauri dev`
  - Tauri 개발 실행

## 트러블슈팅

### 1. PowerShell에서 `npm` 실행이 막히는 경우

일부 PowerShell 환경에서는 실행 정책 때문에 `npm.ps1`이 차단될 수 있습니다.

이 경우 아래처럼 `npm.cmd`를 사용하면 됩니다.

```powershell
npm.cmd install
npm.cmd run build
```

### 2. 화면은 뜨는데 편집기가 비어 있는 경우

이 프로젝트는 `Vditor` 정적 자산이 필요합니다.  
현재는 `predev`, `prebuild` 단계에서 자동으로 동기화되므로 보통 수동 작업은 필요 없습니다.

문제가 생기면 아래를 먼저 실행해 보세요.

```powershell
npm run sync:vditor
```

### 3. Tauri 빌드 실패

주요 원인:

- Rust 미설치
- MSVC 빌드 도구 미설치
- WebView2 Runtime 미설치
- Node.js/npm 환경 문제

## 배포 결과물

패키징된 결과물은 일반적으로 아래 폴더 아래에 생성됩니다.

```text
src-tauri\target\release\bundle
```

예:

- `.msi`
- `.exe`
- 기타 Tauri 번들 형식

## GitHub Actions 자동 릴리스

이 저장소에는 GitHub Actions 기반 자동 릴리스 워크플로가 포함되어 있습니다.

파일:

```text
.github/workflows/release.yml
```

동작 방식:

- `main` 브랜치에 push
  - 앱 버전이 변경된 경우에만 `prerelease` 생성
- `v*` 태그 push
  - 정식 `release` 생성

### prerelease 생성 조건

`main`에 push되더라도 항상 release를 만드는 것은 아닙니다.  
아래 파일의 버전이 실제로 바뀐 경우에만 prerelease가 생성됩니다.

```text
src-tauri/tauri.conf.json
```

예:

```json
{
  "version": "0.1.0"
}
```

이 값을 `0.1.1`로 올린 뒤 `main`에 push하면 새 prerelease가 생성됩니다.

### 정식 release 생성 방법

정식 release는 태그를 push할 때 생성됩니다.

태그 이름은 반드시 현재 앱 버전과 일치해야 합니다.

예를 들어 `src-tauri/tauri.conf.json`의 버전이:

```json
{
  "version": "0.1.1"
}
```

이라면 태그는 아래처럼 만들어야 합니다.

```powershell
git tag v0.1.1
git push origin v0.1.1
```

태그 이름이 앱 버전과 다르면 워크플로는 실패하도록 설정되어 있습니다.

## 라이선스

필요에 따라 추가하세요.
