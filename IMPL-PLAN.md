<!-- 작성: 2026-10-08 12:35 KST -->
<!-- 수정: 2026-10-10 22:10 KST — 2단계에 Task 13(결과 화면의 문항별 결과 목록)을 넣고 뒤 태스크 번호를 하나씩 미룸 -->

# 상식 퀴즈 웹 앱 구현 계획서 (IMPL-PLAN)

> **실행자에게:** 필수 하위 스킬 — 이 계획은 superpowers:subagent-driven-development(권장) 또는 superpowers:executing-plans로 태스크 하나씩 실행한다. 진행 상황은 체크박스(`- [ ]`)로 표시한다.
> 실행자는 이 계획서와 [PRD.md](PRD.md)를 함께 읽는다. 둘이 어긋나면 PRD.md가 기준이며, 어긋남을 발견하면 고치기 전에 사용자에게 알린다.

**목표:** 서버 없이 `index.html`을 더블클릭하면 동작하는 4지선다 상식 퀴즈 앱(카테고리 4개 × 10문항, 연습·스피드·힌트 모드, 순위표)을 3단계로 만든다.

**구조:** 화면 5개는 `index.html`에 `<section>`으로 미리 두고 JS는 하나만 보이게 한다. `script.js`는 위에서 아래로 ① 순수 로직 `QuizCore`(DOM 없음) ② 화면 처리 ③ 자체 점검 ④ 시작 코드의 네 덩어리다. 모드별 차이는 `MODES` 설정 객체 하나에 모으고, 퀴즈 흐름은 하나로 둔다.

**기술:** HTML, CSS, 순수 JavaScript, localStorage. 외부 라이브러리·빌드 도구·테스트 프레임워크·테스트 파일은 쓰지 않는다.

**명세:** [PRD.md](PRD.md)

---

## 전역 제약

모든 태스크의 요구 사항에 이 절이 포함된다.

- 앱 파일은 `index.html`, `style.css`, `script.js`, `questions.js` 4개뿐이다. 테스트 파일·테스트 폴더를 만들지 않는다. 점검 코드는 `script.js`의 ③ 자체 점검 덩어리에 둔다.
- `index.html`은 `questions.js`를 `script.js`보다 먼저 일반 `<script>`로 불러온다. `fetch()`, JSON 파일, ES 모듈(`import`)은 `file://`에서 막히므로 쓰지 않는다.
- 새로 만드는 파일의 첫 줄에 작성 날짜·시각을 대한민국 표준시로 적는다. 시각은 `date -u -d "+9 hours" "+%Y-%m-%d %H:%M"`으로 얻는다. 예: `// 작성: 2026-10-08 12:35 KST`, `/* 작성: ... KST */`, `<!-- 작성: ... KST -->`
- 코드 주석, 화면 문구, 커밋 메시지는 한국어로 쓴다(식별자·명령어 제외).
- 화면 문구는 PRD.md와 글자까지 같게 쓴다: "순위표에 기록되지 않음", "정답!", "오답", "시간 초과", "정답", "정답 (힌트 0.5점)", "문항별 결과", "고른 답: 없음", "결과 보기", "다음", "틀린 문제만 다시 풀기", "같은 설정으로 다시 하기", "처음으로", "문항 데이터를 불러오지 못했습니다", "문항 데이터 오류", "이 브라우저에서는 기록을 저장할 수 없습니다", "아직 기록이 없습니다", "10위 안에 들지 못했습니다".
- 사용자 입력이 아닌 문항 문자열도 화면에는 `textContent`로만 넣는다(`innerHTML` 금지).
- **단계 경계에서 멈춘다.** Task 7(1단계 끝), Task 14(2단계 끝), Task 18(3단계 끝)에서 사용자가 브라우저 확인을 마치고 다음 단계를 지시할 때까지 다음 태스크를 시작하지 않는다.
- **계획과 다르게 정해야 할 일이 생기면 정하기 전에 사용자에게 먼저 묻는다.** 묻지 않고 정한 뒤 보고하지 않는다.
- 커밋은 git 저장소가 있을 때 각 태스크의 마지막 단계에서 한다. 커밋 메시지 끝에는 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 줄을 붙인다. 저장소가 없으면 커밋 단계는 건너뛰고 점검 명령 통과로 태스크를 마친다.

## 점검 명령

실행자는 `questions.js`와 `script.js`를 Node.js로 불러와 자체 점검을 돌린다(작업 폴더에서 Git Bash로 실행). 브라우저 없이 돌고, 실패가 있으면 종료 코드 1을 낸다.

```bash
node -e 'const fs=require("fs"),vm=require("vm");const ctx=vm.createContext({console});const code=fs.readFileSync("questions.js","utf8")+"\n"+fs.readFileSync("script.js","utf8")+"\nrunSelfTest();";process.exitCode=vm.runInContext(code,ctx)===0?0:1;'
```

- `script.js`는 `document`가 없으면 화면 처리를 시작하지 않으므로 Node에서는 점검만 돈다. 문법 오류가 있으면 이 명령이 바로 실패하므로 화면 처리 코드를 고친 태스크에서도 이 명령을 돌린다.
- 구현을 시작하기 전에 `node --version`을 실행한다. 실패하면 구현을 시작하지 말고 사용자에게 Node.js 설치(강의자료 3장 3.2.4항)를 요청한다.
- 사용자는 같은 점검을 브라우저에서 `index.html?test`로 열고 개발자 도구(F12)의 콘솔 탭에서 본다.

## 검토 초점

PRD가 직접 말하지 않았지만 사용자가 가장 먼저 부딪힐 입력과 상황이다. 각 줄의 확인은 담당 태스크에 들어 있다.

1. **같은 버튼 연타**(보기, [다음], [결과 보기]) — 채점·결과·순위 기록은 한 번만 일어나야 한다. → `state.answered`, `state.finished` 가드(Task 6), 확인 항목 1-8·3-4(Task 7, 18)
2. **스피드 모드에서 0초가 되는 순간의 클릭** — 먼저 일어난 쪽만 채점하고, 해설 중에는 남은 초가 멈춰야 한다. → `handleAnswer`의 가드와 `stopTimer`(Task 10), 확인 항목 2-5(Task 14)
3. **`questions.js`를 고치다 낸 실수**(보기 3개, `http://` 출처, 기준 없는 "가장") — 앱이 멈추지 않고 시작 화면에 "문항 데이터 오류"를 띄우고 콘솔에 문제 목록을 찍어야 한다. → `validateQuestions` 점검(Task 3), `dataProblem`(Task 6), 확인 항목 1-10·1-11(Task 7)
4. **깨졌거나 쓸 수 없는 localStorage** — 퀴즈는 계속되고, 깨진 값은 빈 순위표로, 쓸 수 없으면 안내 문구를 보여야 한다. → `parseBoard` 점검(Task 15), `loadBoard`/`saveRecord`(Task 16), 확인 항목 3-9·3-10(Task 18)
5. **답한 뒤 또는 두 번째로 누른 [힌트]** — 아무 일도 일어나지 않아야 하고, 다음 문항에서는 다시 쓸 수 있어야 한다. → `useHint` 가드(Task 11), 확인 항목 2-7(Task 14)

---

## 파일 구조

| 파일 | 맡는 일 | 만드는 태스크 |
|---|---|---|
| `questions.js` | `CATEGORIES`(카테고리 4개)와 `QUESTIONS`(문항 40개). 데이터만 둔다. | Task 1(뼈대), Task 4(문항) |
| `script.js` | ① `QuizCore` 순수 로직 ② 화면 처리 ③ 자체 점검 ④ 시작 코드 | Task 1부터 계속 |
| `index.html` | 화면 `<section>`들. 1·2·3단계마다 전체를 새 판으로 바꾼다(Task 13은 결과 화면에 목록만 더한다). | Task 5, 9, 13, 16 |
| `style.css` | 화면 배치, 정답·오답 색, 힌트로 지운 보기, 결과 목록, 순위표 | Task 5, 9, 13, 17 |

`script.js`의 전체 모양(3단계 완료 시):

```
// 작성: ... KST
// 상식 퀴즈 — ...
"use strict";

/* ========== 1. 순수 로직 (DOM을 건드리지 않음) ========== */
const QuizCore = (function () { ...상수, 함수들... return { ... }; })();

/* ========== 2. 화면 처리 ========== */
const MODES = { ... };  const STORAGE_KEY = ...;  const TIMER_TICK_MS = ...;  const state = { ... };
function byId ... function formatDate ...

/* ========== 3. 자체 점검 (index.html?test 또는 점검 명령으로 실행) ========== */
const SELF_CHECKS = [];  function check ... function seededRng ... check(...) ... function runSelfTest ...

/* ========== 4. 시작 ========== */
if (typeof document !== "undefined" && document.getElementById("screen-start")) { ... }
```

새 함수를 "② 화면 처리 끝에 추가"하라는 말은 `/* ========== 3. 자체 점검` 줄 바로 위에 넣으라는 뜻이다. 새 점검을 "③ 점검 목록 끝에 추가"하라는 말은 `// 모든 점검을 실행하고` 주석 바로 위에 넣으라는 뜻이다.

## 단계 개요

| 단계 | 태스크 | 만드는 것 | 멈추는 곳 |
|---|---|---|---|
| 1. 연습 모드와 점수 | 1~7 | 자체 점검 틀, `shuffle`·`buildRound`·`scoreFor`·`validateQuestions`, 문항 40개, 시작·퀴즈·결과 화면 | Task 7 |
| 2. 스피드 모드, 힌트 모드, 틀린 문제 다시 풀기 | 8~14 | `pickHintRemovals`, 모드 선택 화면, 15초 타이머, 힌트, 다시 풀기, 결과 화면의 문항별 결과 | Task 14 |
| 3. 점수 저장과 순위표 | 15~18 | `addRecord`·`parseBoard`, 결과 저장과 순위 표시, 순위표 화면 | Task 18 |

---

# 1단계 — 연습 모드와 점수

### 만들 것

- `questions.js`: 카테고리 4개, 출처를 직접 확인한 문항 40개
- `script.js`: `QuizCore.shuffle`, `buildRound`, `scoreFor`, `validateQuestions`, 자체 점검(로직 4종 + 문항 데이터), 연습 모드 화면 처리
- `index.html`: 시작·퀴즈·결과 화면 3개
- `style.css`: 기본 배치, 정답(초록)·오답(빨강) 표시

모드 선택 화면과 틀린 문제 다시 풀기는 이 단계에서 만들지 않는다. 카테고리를 고르면 바로 연습 모드로 시작한다.

### 완료 기준 (실행자가 확인)

- [ ] 점검 명령 결과가 "자체 점검: 10개 중 10개 통과"다.
- [ ] 40문항 모두 출처 페이지를 열어 정답과 해설을 대조했고, 그 검수표를 사용자에게 보였다(Task 4).
- [ ] `index.html`이 `questions.js` → `script.js` 순서로 불러오고, 앱 파일은 4개뿐이다.
- [ ] 새 파일 4개의 첫 줄에 KST 작성 시각이 있다.

### 브라우저에서 직접 확인할 항목 (사용자)

`index.html`을 더블클릭해 연다.

1-1. 시작 화면에 "상식 퀴즈", 카테고리 버튼 4개(한국사, 세계지리, 과학, 예술과 문화), "연습 모드 · 순위표에 기록되지 않음"이 보인다.
1-2. [한국사]를 누르면 퀴즈 화면 위쪽에 "한국사 · 연습", "1 / 10", "점수 0"이 보인다.
1-3. 보기를 하나 누르면 보기 4개가 모두 잠기고, 정답 보기는 초록색, 고른 오답은 빨간색이 된다.
1-4. 그 아래 "정답!" 또는 "오답", 한 줄 해설, "출처: 이름"이 보이고, 출처 이름을 누르면 새 탭에서 출처 페이지가 열린다.
1-5. [다음]을 누르면 "2 / 10"이 되고, 맞혔으면 점수가 1 오른다.
1-6. 10번째 문항에서는 버튼 이름이 [결과 보기]이고, 누르면 결과 화면에 "n / 10점", "맞힌 문항 n개", "순위표에 기록되지 않음"이 보인다.
1-7. [같은 설정으로 다시 하기]를 누르면 같은 카테고리가 "1 / 10", "점수 0"부터 다시 시작하고, 문항 순서와 보기 위치가 앞 판과 다르다. [처음으로]는 시작 화면으로 간다.
1-8. 보기를 빠르게 여러 번 눌러도 점수는 한 번만 바뀐다. [결과 보기]를 여러 번 눌러도 결과 화면은 한 번만 나온다.
1-9. 주소 끝에 `?test`를 붙여 다시 열고(F12 → 콘솔) "자체 점검: 10개 중 10개 통과"를 확인한다.
1-10. `questions.js`의 이름을 잠시 `questions.bak.js`로 바꾸고 새로 고침하면 시작 화면에 "문항 데이터를 불러오지 못했습니다"가 나오고 카테고리 버튼이 눌리지 않는다. 확인한 뒤 이름을 되돌린다.
1-11. `questions.js`에서 문항 하나의 `url`을 `https://`에서 `http://`로 잠시 바꾸고 새로 고침하면 시작 화면에 "문항 데이터 오류"가 나오고 카테고리 버튼이 눌리지 않으며, 콘솔에 그 문항 id와 "출처 URL은 https://로 시작해야 합니다."가 찍힌다. 확인한 뒤 되돌린다.

---

### Task 1: 파일 뼈대, 자체 점검 틀, `shuffle`

**Files:**
- Create: `questions.js`
- Create: `script.js`

**Interfaces:**
- Consumes: 없음
- Produces: 전역 `CATEGORIES`(`{ id, name }` 4개), `QUESTIONS`(배열), `QuizCore.shuffle(list, rng = Math.random) → 새 배열`, 점검 도구 `check(name, fn)`, `assert(condition, message)`, `sameItems(a, b) → boolean`, `seededRng(seed) → () => [0, 1) 수`, `runSelfTest() → 실패 개수`

- [ ] **Step 1: `questions.js` 뼈대를 만든다**

```js
// 작성: <KST 시각>
// 상식 퀴즈 문항 데이터 — 카테고리 목록과 문항 40개(데이터만 둔다)

const CATEGORIES = [
  { id: "korean-history", name: "한국사" },
  { id: "world-geography", name: "세계지리" },
  { id: "science", name: "과학" },
  { id: "arts-culture", name: "예술과 문화" },
];

// 문항 40개는 Task 4에서 채운다.
const QUESTIONS = [];
```

- [ ] **Step 2: `script.js`에 점검 틀과 실패하는 `shuffle` 점검을 쓴다**

```js
// 작성: <KST 시각>
// 상식 퀴즈 — 순수 로직(QuizCore), 화면 처리, 자체 점검(index.html?test)을 이 파일 하나에 둔다.
"use strict";

/* ========== 1. 순수 로직 (DOM을 건드리지 않음) ========== */

const QuizCore = (function () {
  return {};
})();

/* ========== 2. 화면 처리 ========== */

/* ========== 3. 자체 점검 (index.html?test 또는 점검 명령으로 실행) ========== */

const SELF_CHECKS = [];

function check(name, fn) {
  SELF_CHECKS.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameItems(a, b) {
  return a.length === b.length && a.map(String).sort().join("|") === b.map(String).sort().join("|");
}

// 점검에서 결과를 고정하기 위한 난수 함수(같은 seed면 같은 수열).
function seededRng(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

check("shuffle: 원소 구성이 같다", () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  for (let seed = 1; seed <= 20; seed += 1) {
    assert(sameItems(QuizCore.shuffle(list, seededRng(seed)), list), `seed ${seed}에서 원소가 달라졌습니다.`);
  }
});

check("shuffle: 원본 배열을 바꾸지 않는다", () => {
  const list = [1, 2, 3, 4, 5];
  QuizCore.shuffle(list, seededRng(7));
  assert(list.join(",") === "1,2,3,4,5", "원본 배열이 바뀌었습니다.");
});

check("shuffle: 실제로 순서를 바꾼다", () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let changed = false;
  for (let seed = 1; seed <= 20; seed += 1) {
    if (QuizCore.shuffle(list, seededRng(seed)).join(",") !== list.join(",")) changed = true;
  }
  assert(changed, "20번 섞는 동안 순서가 한 번도 바뀌지 않았습니다.");
});

// 모든 점검을 실행하고 콘솔에 결과를 찍는다. 실패한 개수를 돌려준다.
function runSelfTest() {
  const failures = [];
  SELF_CHECKS.forEach(({ name, fn }) => {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (error) {
      failures.push(name);
      console.error(`✗ ${name} — ${error.message}`);
    }
  });
  console.log(`자체 점검: ${SELF_CHECKS.length}개 중 ${SELF_CHECKS.length - failures.length}개 통과`);
  return failures.length;
}

/* ========== 4. 시작 ========== */

// 브라우저에서 index.html로 열었을 때만 실행한다(점검 명령에서는 건너뜀).
if (typeof document !== "undefined" && document.getElementById("screen-start")) {
  if (new URLSearchParams(window.location.search).has("test")) runSelfTest();
}
```

- [ ] **Step 3: 점검 명령을 돌려 실패를 확인한다**

Run: 점검 명령
Expected: FAIL. `✗ shuffle: 원소 구성이 같다 — QuizCore.shuffle is not a function` 등 3줄, `자체 점검: 3개 중 0개 통과`, 종료 코드 1

- [ ] **Step 4: `QuizCore`에 `shuffle`을 넣는다**

`QuizCore` 덩어리 전체를 다음으로 바꾼다.

```js
const QuizCore = (function () {
  // 원본은 그대로 두고 섞은 새 배열을 돌려준다(Fisher–Yates).
  function shuffle(list, rng = Math.random) {
    const result = list.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  return { shuffle };
})();
```

- [ ] **Step 5: 점검 명령을 돌려 통과를 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 3개 중 3개 통과`, 종료 코드 0

- [ ] **Step 6: 커밋**

```bash
git add questions.js script.js
git commit -m "1단계: 파일 뼈대와 자체 점검 틀, shuffle 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `buildRound`와 `scoreFor`

**Files:**
- Modify: `script.js` (① `QuizCore`, ③ 자체 점검)

**Interfaces:**
- Consumes: `QuizCore.shuffle`, `check`, `assert`, `sameItems`, `seededRng`
- Produces: `QuizCore.buildRound(questions, categoryId, rng = Math.random) → 문항 사본 배열`(문항 순서와 보기 위치를 섞고 `answer`를 새 위치로 고침, 원본은 그대로), `QuizCore.scoreFor(isCorrect: boolean, usedHint: boolean) → 0 | 0.5 | 1`, 점검용 `SAMPLE_CATEGORIES`, `makeSampleQuestions() → 예시 문항 40개`(정답은 항상 0번)

- [ ] **Step 1: 예시 데이터와 실패하는 점검을 쓴다**

③ 자체 점검에서 `seededRng` 함수 바로 아래에 넣는다.

```js
// 점검용 예시 데이터: 카테고리 4개 × 10문항, 정답은 항상 0번.
const SAMPLE_CATEGORIES = [
  { id: "a", name: "가" },
  { id: "b", name: "나" },
  { id: "c", name: "다" },
  { id: "d", name: "라" },
];

function makeSampleQuestions() {
  const list = [];
  SAMPLE_CATEGORIES.forEach((category) => {
    for (let n = 1; n <= 10; n += 1) {
      list.push({
        id: `${category.id}-${n}`,
        category: category.id,
        question: `${category.name} 문제 ${n}`,
        choices: [`정답${n}`, `오답${n}-1`, `오답${n}-2`, `오답${n}-3`],
        answer: 0,
        explanation: `${category.name} 해설 ${n}`,
        source: { name: "예시 출처", url: "https://example.com/" },
      });
    }
  });
  return list;
}
```

③ 점검 목록 끝(`// 모든 점검을 실행하고` 주석 바로 위)에 넣는다.

```js
check("buildRound: 해당 카테고리 10문항만 나온다", () => {
  const round = QuizCore.buildRound(makeSampleQuestions(), "b", seededRng(3));
  assert(round.length === 10, `문항이 ${round.length}개입니다.`);
  assert(round.every((q) => q.category === "b"), "다른 카테고리 문항이 섞였습니다.");
  assert(new Set(round.map((q) => q.id)).size === 10, "같은 문항이 두 번 나왔습니다.");
});

check("buildRound: 섞은 뒤에도 choices[answer]가 원래 정답이다", () => {
  const originals = makeSampleQuestions();
  for (let seed = 1; seed <= 20; seed += 1) {
    QuizCore.buildRound(originals, "c", seededRng(seed)).forEach((q) => {
      const original = originals.find((o) => o.id === q.id);
      assert(q.choices[q.answer] === original.choices[original.answer], `${q.id}의 정답이 바뀌었습니다.`);
      assert(sameItems(q.choices, original.choices), `${q.id}의 보기 구성이 바뀌었습니다.`);
    });
  }
});

check("buildRound: 원본 문항을 바꾸지 않는다", () => {
  const originals = makeSampleQuestions();
  const before = JSON.stringify(originals);
  QuizCore.buildRound(originals, "a", seededRng(5));
  assert(JSON.stringify(originals) === before, "원본 문항이 바뀌었습니다.");
});

check("scoreFor: 정답 1점, 힌트 쓰고 정답 0.5점, 오답 0점", () => {
  assert(QuizCore.scoreFor(true, false) === 1, "정답·힌트 없음은 1점이어야 합니다.");
  assert(QuizCore.scoreFor(true, true) === 0.5, "정답·힌트 사용은 0.5점이어야 합니다.");
  assert(QuizCore.scoreFor(false, false) === 0, "오답은 0점이어야 합니다.");
  assert(QuizCore.scoreFor(false, true) === 0, "오답은 힌트를 써도 0점이어야 합니다.");
});
```

- [ ] **Step 2: 점검 명령을 돌려 실패를 확인한다**

Run: 점검 명령
Expected: FAIL. `✗ buildRound: ... — QuizCore.buildRound is not a function` 3줄, `✗ scoreFor: ... — QuizCore.scoreFor is not a function`, `자체 점검: 7개 중 3개 통과`

- [ ] **Step 3: `QuizCore`에 함수를 넣는다**

`QuizCore` 안의 `return { shuffle };` 줄 바로 위에 넣고, `return` 줄을 바꾼다.

```js
  // 보기 위치를 섞고 정답 위치(answer)를 새 위치로 고친 사본을 돌려준다.
  function shuffleChoices(question, rng) {
    const order = shuffle(question.choices.map((_, i) => i), rng);
    return {
      ...question,
      choices: order.map((i) => question.choices[i]),
      answer: order.indexOf(question.answer),
    };
  }

  // 한 판에 쓸 문항: 해당 카테고리 문항의 순서와 보기 위치를 섞는다.
  function buildRound(questions, categoryId, rng = Math.random) {
    const picked = questions.filter((question) => question.category === categoryId);
    return shuffle(picked, rng).map((question) => shuffleChoices(question, rng));
  }

  // 오답 0점, 힌트 쓰고 정답 0.5점, 그 외 정답 1점.
  function scoreFor(isCorrect, usedHint) {
    if (!isCorrect) return 0;
    return usedHint ? 0.5 : 1;
  }

  return { shuffle, buildRound, scoreFor };
```

- [ ] **Step 4: 점검 명령을 돌려 통과를 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 7개 중 7개 통과`

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "1단계: 문항·보기 섞기(buildRound)와 점수 계산(scoreFor) 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `validateQuestions` (문항 데이터 형식 검사)

**Files:**
- Modify: `script.js` (① `QuizCore`, ③ 자체 점검)

**Interfaces:**
- Consumes: `makeSampleQuestions`, `SAMPLE_CATEGORIES`
- Produces: `QuizCore.validateQuestions(questions, categories) → string[]`(문제 목록, 문제가 없으면 빈 배열). PRD 9.1의 문항 데이터 점검 다섯 줄을 모두 검사한다.

- [ ] **Step 1: 실패하는 점검을 쓴다**

③ 자체 점검에서 `makeSampleQuestions` 함수 바로 아래에 넣는다.

```js
function problemsAfter(change) {
  const questions = makeSampleQuestions();
  change(questions);
  return QuizCore.validateQuestions(questions, SAMPLE_CATEGORIES);
}
```

③ 점검 목록 끝에 넣는다.

```js
check("validateQuestions: 올바른 예시 문항에는 문제가 없다", () => {
  const problems = QuizCore.validateQuestions(makeSampleQuestions(), SAMPLE_CATEGORIES);
  assert(problems.length === 0, problems.join(" / "));
});

check("validateQuestions: 망가진 문항을 찾아낸다", () => {
  const cases = [
    ["보기 3개", (qs) => { qs[0].choices.pop(); }],
    ["같은 보기", (qs) => { qs[0].choices[1] = qs[0].choices[0]; }],
    ["answer 범위 밖", (qs) => { qs[0].answer = 4; }],
    ["answer가 문자열", (qs) => { qs[0].answer = "0"; }],
    ["출처 없음", (qs) => { delete qs[0].source; }],
    ["출처 URL이 http", (qs) => { qs[0].source.url = "http://example.com/"; }],
    ["해설 줄바꿈", (qs) => { qs[0].explanation = "첫 줄\n둘째 줄"; }],
    ["해설 101자", (qs) => { qs[0].explanation = "가".repeat(101); }],
    ["최상급에 기준·시점 없음", (qs) => { qs[0].question = "가장 큰 행성은?"; }],
    ["id 중복", (qs) => { qs[1].id = qs[0].id; }],
    ["없는 카테고리", (qs) => { qs[0].category = "zz"; }],
    ["문항 39개", (qs) => { qs.pop(); }],
  ];
  cases.forEach(([name, change]) => {
    assert(problemsAfter(change).length > 0, `"${name}"을 찾지 못했습니다.`);
  });
});
```

- [ ] **Step 2: 점검 명령을 돌려 실패를 확인한다**

Run: 점검 명령
Expected: FAIL. `✗ validateQuestions: ... — QuizCore.validateQuestions is not a function` 2줄, `자체 점검: 9개 중 7개 통과`

- [ ] **Step 3: `QuizCore`에 상수와 검사 함수를 넣는다**

`QuizCore` 맨 위(`const QuizCore = (function () {` 바로 아래)에 상수를 넣는다.

```js
  const QUESTIONS_PER_CATEGORY = 10;
  const CHOICES_PER_QUESTION = 4;
  const EXPLANATION_MAX_LENGTH = 100;
```

`return` 줄 바로 위에 함수를 넣고, `return` 줄을 바꾼다.

```js
  function isText(value) {
    return typeof value === "string" && value.trim() !== "";
  }

  function validateQuestion(q, label, categoryIds) {
    const problems = [];
    if (!categoryIds.includes(q.category)) {
      problems.push(`${label}: category "${q.category}"가 CATEGORIES에 없습니다.`);
    }
    if (!isText(q.question)) problems.push(`${label}: 문제 문장이 비어 있습니다.`);
    if (!Array.isArray(q.choices) || q.choices.length !== CHOICES_PER_QUESTION) {
      problems.push(`${label}: 보기는 ${CHOICES_PER_QUESTION}개여야 합니다.`);
    } else {
      if (!q.choices.every(isText)) problems.push(`${label}: 비어 있는 보기가 있습니다.`);
      if (new Set(q.choices.map((choice) => String(choice).trim())).size !== q.choices.length) {
        problems.push(`${label}: 같은 보기가 두 번 이상 있습니다.`);
      }
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= CHOICES_PER_QUESTION) {
      problems.push(`${label}: answer는 0~3의 정수여야 합니다.`);
    }
    if (!isText(q.explanation)) {
      problems.push(`${label}: 해설이 비어 있습니다.`);
    } else {
      if (/[\r\n]/.test(q.explanation)) problems.push(`${label}: 해설에 줄바꿈이 있습니다.`);
      if (q.explanation.length > EXPLANATION_MAX_LENGTH) {
        problems.push(`${label}: 해설이 ${EXPLANATION_MAX_LENGTH}자를 넘습니다.`);
      }
    }
    if (!q.source || !isText(q.source.name)) problems.push(`${label}: 출처 이름이 없습니다.`);
    if (!q.source || typeof q.source.url !== "string" || !q.source.url.startsWith("https://")) {
      problems.push(`${label}: 출처 URL은 https://로 시작해야 합니다.`);
    }
    // 문항 규칙 3: "가장"이 있으면 기준과 시점(예: 2024년 기준)을 함께 적는다.
    if (isText(q.question) && q.question.includes("가장")
      && !(q.question.includes("기준") && /\d{4}년/.test(q.question))) {
      problems.push(`${label}: "가장"이 있으면 기준과 시점(예: 2024년 기준)을 적어야 합니다.`);
    }
    return problems;
  }

  // 문항 데이터 규칙을 형식 면에서 검사하고 문제 목록을 돌려준다. 문제가 없으면 빈 배열.
  function validateQuestions(questions, categories) {
    if (!Array.isArray(questions)) return ["QUESTIONS가 배열이 아닙니다."];
    if (!Array.isArray(categories)) return ["CATEGORIES가 배열이 아닙니다."];
    const problems = [];
    const categoryIds = categories.map((category) => category.id);
    const expectedTotal = categoryIds.length * QUESTIONS_PER_CATEGORY;
    if (questions.length !== expectedTotal) {
      problems.push(`전체 문항이 ${questions.length}개입니다(${expectedTotal}개여야 합니다).`);
    }
    categoryIds.forEach((id) => {
      const count = questions.filter((q) => q && q.category === id).length;
      if (count !== QUESTIONS_PER_CATEGORY) {
        problems.push(`${id} 문항이 ${count}개입니다(${QUESTIONS_PER_CATEGORY}개여야 합니다).`);
      }
    });
    const seenIds = new Set();
    questions.forEach((q, index) => {
      if (!q || typeof q !== "object") {
        problems.push(`${index + 1}번째 문항이 객체가 아닙니다.`);
        return;
      }
      const label = isText(q.id) ? q.id : `${index + 1}번째 문항`;
      if (!isText(q.id)) problems.push(`${label}: id가 없습니다.`);
      else if (seenIds.has(q.id)) problems.push(`${label}: id가 겹칩니다.`);
      else seenIds.add(q.id);
      problems.push(...validateQuestion(q, label, categoryIds));
    });
    return problems;
  }

  return { shuffle, buildRound, scoreFor, validateQuestions };
```

- [ ] **Step 4: 점검 명령을 돌려 통과를 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 9개 중 9개 통과`

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "1단계: 문항 데이터 형식 검사(validateQuestions) 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: 문항 40개 작성과 출처 확인

**Files:**
- Modify: `questions.js` (`QUESTIONS` 채우기)
- Modify: `script.js` (③ 점검 1개 추가)

**Interfaces:**
- Consumes: `QuizCore.validateQuestions`, `CATEGORIES`
- Produces: `QUESTIONS` 40개. 각 문항 `{ id, category, question, choices[4], answer, explanation, source: { name, url } }`. id는 `kh-01`~`kh-10`(한국사), `wg-01`~`wg-10`(세계지리), `sc-01`~`sc-10`(과학), `ac-01`~`ac-10`(예술과 문화).

- [ ] **Step 1: 실제 문항 데이터 점검을 추가한다**

③ 점검 목록 끝에 넣는다.

```js
check("validateQuestions: 실제 문항 데이터(questions.js)에 문제가 없다", () => {
  assert(typeof QUESTIONS !== "undefined" && typeof CATEGORIES !== "undefined", "questions.js를 불러오지 못했습니다.");
  const problems = QuizCore.validateQuestions(QUESTIONS, CATEGORIES);
  assert(problems.length === 0, problems.join(" / "));
});
```

- [ ] **Step 2: 점검 명령을 돌려 실패를 확인한다**

Run: 점검 명령
Expected: FAIL. `✗ validateQuestions: 실제 문항 데이터(questions.js)에 문제가 없다 — 전체 문항이 0개입니다(40개여야 합니다). / korean-history 문항이 0개입니다(10개여야 합니다). / ...`, `자체 점검: 10개 중 9개 통과`

- [ ] **Step 3: 카테고리마다 10문항을 쓴다**

`questions.js`의 `// 문항 40개는 Task 4에서 채운다.` 주석을 지우고 `QUESTIONS`를 채운다. 카테고리마다 주석 한 줄로 구역을 나눈다. 아래는 **형식 예시**이며 그대로 넣지 않는다.

```js
const QUESTIONS = [
  // ---- 한국사 (kh-01 ~ kh-10) ----
  {
    id: "kh-01",
    category: "korean-history",
    question: "세종이 훈민정음을 반포한 해는?",
    choices: ["1446년", "1443년", "1392년", "1592년"],
    answer: 0,
    explanation: "훈민정음은 1443년에 창제되고 1446년에 반포되었다.",
    source: { name: "<출처 기관·문서 이름>", url: "https://<실제로 열어 확인한 페이지>" },
  },
  // ...
];
```

문항을 쓸 때 지킬 것(PRD 5.2, 5.3):

1. 정답은 하나뿐이다. 다른 보기가 기준이나 해석에 따라 정답이 될 여지가 없어야 한다.
2. 최상급("가장 ~한") 표현을 쓰면 문제 문장에 기준과 시점을 함께 적는다. 예: "2024년 유엔 통계 기준, 면적이 가장 넓은 나라는?"
3. 해설은 한 줄(줄바꿈 없음), 100자 이하다.
4. 보기 4개는 서로 다르다. `answer`는 정답 보기의 위치(0~3)다. 화면에서 다시 섞으므로 위치는 어디든 된다.
5. 출처는 공신력 있는 기관·사전·백과사전의 페이지다(예: 국사편찬위원회 우리역사넷, 국립국어원 표준국어대사전, 브리태니커, 정부·공공기관·국제기구 누리집). 위키백과, 나무위키, 블로그, 개인 누리집은 출처로 쓰지 않는다.
6. 난이도는 대학 1학년이 상식으로 풀 수 있는 수준으로 한다.

- [ ] **Step 4: 40문항의 출처를 모두 열어 대조한다**

문항마다 `source.url` 페이지를 실제로 열어(WebFetch 또는 브라우저) 정답과 해설의 사실이 그 페이지에 있는지 확인한다. **40개 모두** 확인한다. 일부만 골라 확인하고 넘어가지 않는다.

- 페이지가 열리지 않거나 사실이 페이지에 없으면, 같은 사실을 담은 다른 공신력 있는 페이지로 바꾼다. 그래도 찾지 못하면 그 문항을 다른 문항으로 바꾸고 처음부터 다시 확인한다.
- 확인하면서 아래 검수표를 채운다. 표는 파일로 저장하지 않고 이 태스크를 마칠 때 사용자에게 대화로 보인다.

| id | 문제(요약) | 정답 | 출처 이름 | 페이지에서 확인한 근거(한 줄) | 정답 하나뿐 | 최상급이면 기준·시점 |
|---|---|---|---|---|---|---|

- [ ] **Step 5: 점검 명령을 돌려 통과를 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 10개 중 10개 통과`

- [ ] **Step 6: 검수표를 사용자에게 보인다**

40줄 검수표를 대화에 붙이고, 확인하지 못해 바꾼 문항이 있으면 그 목록과 이유를 함께 적는다. 사용자의 최종 승인은 Task 7에서 받으므로 Task 5로 넘어간다.

- [ ] **Step 7: 커밋**

```bash
git add questions.js script.js
git commit -m "1단계: 문항 40개 작성(출처 확인 완료)과 실제 문항 데이터 점검 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: 1단계 화면 틀 (`index.html`, `style.css`)

**Files:**
- Create: `index.html`
- Create: `style.css`

**Interfaces:**
- Consumes: 없음
- Produces: 요소 id — 시작 `screen-start`, `data-error`, 카테고리 버튼 `[data-category]`(값은 `CATEGORIES`의 id) / 퀴즈 `screen-quiz`, `quiz-label`, `quiz-progress`, `quiz-score`, `quiz-question`, `choice-list`, `feedback`, `feedback-result`, `feedback-explanation`, `feedback-source`, `next-button` / 결과 `screen-result`, `result-score`, `result-detail`, `result-practice-note`, `again-button`, `home-button`. 모든 화면은 `class="screen"`이다. CSS 클래스 `.choice`, `.is-correct`, `.is-wrong`, `.notice`, `.is-error`, `.primary`

- [ ] **Step 1: `index.html`을 만든다**

```html
<!-- 작성: <KST 시각> -->
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="app">
    <!-- 시작 화면 -->
    <section id="screen-start" class="screen">
      <h1>상식 퀴즈</h1>
      <p class="lead">카테고리를 고르세요. 한 판은 10문제입니다.</p>
      <p id="data-error" class="notice is-error" hidden></p>
      <div class="button-grid">
        <button type="button" class="category-button" data-category="korean-history">한국사</button>
        <button type="button" class="category-button" data-category="world-geography">세계지리</button>
        <button type="button" class="category-button" data-category="science">과학</button>
        <button type="button" class="category-button" data-category="arts-culture">예술과 문화</button>
      </div>
      <p class="notice">연습 모드 · 순위표에 기록되지 않음</p>
    </section>

    <!-- 퀴즈 화면 -->
    <section id="screen-quiz" class="screen" hidden>
      <div class="quiz-header">
        <span id="quiz-label"></span>
        <span id="quiz-progress"></span>
        <span id="quiz-score"></span>
      </div>
      <h2 id="quiz-question" class="question"></h2>
      <div id="choice-list" class="choice-list"></div>
      <div id="feedback" class="feedback" hidden>
        <p id="feedback-result" class="feedback-result"></p>
        <p id="feedback-explanation"></p>
        <p class="source">출처: <a id="feedback-source" href="#" target="_blank" rel="noopener noreferrer"></a></p>
        <button id="next-button" type="button" class="primary">다음</button>
      </div>
    </section>

    <!-- 결과 화면 -->
    <section id="screen-result" class="screen" hidden>
      <h2>결과</h2>
      <p id="result-score" class="result-score"></p>
      <p id="result-detail"></p>
      <p id="result-practice-note" class="notice" hidden>순위표에 기록되지 않음</p>
      <div class="button-row">
        <button id="again-button" type="button" class="primary">같은 설정으로 다시 하기</button>
        <button id="home-button" type="button">처음으로</button>
      </div>
    </section>
  </main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: `style.css`를 만든다**

```css
/* 작성: <KST 시각> */
/* 상식 퀴즈 화면 스타일 */

:root {
  --bg: #f5f6f8;
  --surface: #ffffff;
  --text: #1f2328;
  --muted: #5b6370;
  --border: #d0d7de;
  --accent: #2f6fde;
  --correct: #1a7f37;
  --correct-bg: #dafbe1;
  --wrong: #cf222e;
  --wrong-bg: #ffebe9;
}

* {
  box-sizing: border-box;
}

[hidden] {
  display: none !important;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Segoe UI", "Malgun Gothic", sans-serif;
  line-height: 1.6;
}

.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.screen {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
}

h1,
h2 {
  margin: 0 0 12px;
  line-height: 1.3;
}

.lead {
  margin: 0 0 16px;
  color: var(--muted);
}

.notice {
  color: var(--muted);
  font-size: 0.95rem;
}

.is-error {
  color: var(--wrong);
  font-weight: 600;
}

button {
  font: inherit;
  color: inherit;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  border-color: var(--accent);
}

button:disabled {
  cursor: default;
}

button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.category-button {
  padding: 18px 12px;
  font-size: 1.1rem;
  font-weight: 600;
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.quiz-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
  font-size: 0.95rem;
}

.question {
  margin: 16px 0;
  font-size: 1.25rem;
}

.choice-list {
  display: grid;
  gap: 10px;
}

.choice {
  text-align: left;
  padding: 14px 16px;
}

.choice.is-correct {
  border-color: var(--correct);
  background: var(--correct-bg);
  color: var(--correct);
  font-weight: 600;
}

.choice.is-wrong {
  border-color: var(--wrong);
  background: var(--wrong-bg);
  color: var(--wrong);
  font-weight: 600;
}

.feedback {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.feedback-result {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 700;
}

.feedback-result.is-correct {
  color: var(--correct);
}

.feedback-result.is-wrong {
  color: var(--wrong);
}

.source {
  color: var(--muted);
  font-size: 0.9rem;
}

.source a {
  color: var(--accent);
}

.result-score {
  margin: 8px 0;
  font-size: 2rem;
  font-weight: 700;
}

@media (max-width: 420px) {
  .screen {
    padding: 18px;
  }

  .button-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: 점검 명령으로 기존 점검이 그대로인지 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 10개 중 10개 통과`

- [ ] **Step 4: 커밋**

```bash
git add index.html style.css
git commit -m "1단계: 시작·퀴즈·결과 화면 틀과 기본 스타일 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: 연습 모드 진행 (화면 처리)

**Files:**
- Modify: `script.js` (② 화면 처리, ④ 시작)

**Interfaces:**
- Consumes: Task 5의 요소 id, `QuizCore.buildRound`, `QuizCore.scoreFor`, `QuizCore.validateQuestions`, `CATEGORIES`, `QUESTIONS`
- Produces: `MODES`(이 태스크에서는 `practice` 하나), `state`, `byId(id)`, `showScreen(name)`(`name`은 `start`·`quiz`·`result`, 이후 `mode`·`board`), `categoryName(categoryId)`, `formatScore(value)`, `dataProblem() → string`, `initApp()`, `startRound(categoryId, mode)`, `renderQuestion()`, `renderScoreLine()`, `handleAnswer(choiceIndex | null)`, `renderFeedback(choiceIndex, isCorrect)`, `goNext()`, `renderResult()`, `goHome()`

- [ ] **Step 1: ② 화면 처리 덩어리를 쓴다**

`/* ========== 2. 화면 처리 ========== */` 줄 아래에 넣는다.

```js
// 모드별 차이는 이 설정에만 둔다. 퀴즈 흐름은 하나이고 이 값으로만 분기한다.
const MODES = {
  practice: { name: "연습", timeLimit: null, hint: false, ranked: false, retry: true },
};

// 진행 상태는 이 객체 하나에 둔다.
const state = {
  mode: "practice",
  categoryId: null,
  round: [],
  index: 0,
  score: 0,
  correctCount: 0,
  wrongIds: [],
  usedHint: false,
  answered: false,
  finished: false,
};

function byId(id) {
  return document.getElementById(id);
}

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((section) => {
    section.hidden = section.id !== `screen-${name}`;
  });
  window.scrollTo(0, 0);
}

function categoryName(categoryId) {
  const found = CATEGORIES.find((category) => category.id === categoryId);
  return found ? found.name : categoryId;
}

function formatScore(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

// 문항 데이터에 문제가 있으면 화면에 띄울 문구를, 없으면 빈 문자열을 돌려준다.
function dataProblem() {
  if (typeof QUESTIONS === "undefined" || typeof CATEGORIES === "undefined") {
    console.error("questions.js를 불러오지 못했습니다.");
    return "문항 데이터를 불러오지 못했습니다";
  }
  const problems = QuizCore.validateQuestions(QUESTIONS, CATEGORIES);
  if (problems.length > 0) {
    console.error("문항 데이터 오류:");
    problems.forEach((problem) => console.error(`- ${problem}`));
    return "문항 데이터 오류";
  }
  return "";
}

function initApp() {
  const problem = dataProblem();
  if (problem) {
    byId("data-error").textContent = problem;
    byId("data-error").hidden = false;
    document.querySelectorAll("#screen-start button").forEach((button) => {
      button.disabled = true;
    });
    showScreen("start");
    return;
  }
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => startRound(button.dataset.category, "practice"));
  });
  byId("next-button").addEventListener("click", goNext);
  byId("again-button").addEventListener("click", () => startRound(state.categoryId, state.mode));
  byId("home-button").addEventListener("click", goHome);
  showScreen("start");
}

function startRound(categoryId, mode) {
  Object.assign(state, {
    categoryId,
    mode,
    round: QuizCore.buildRound(QUESTIONS, categoryId),
    index: 0,
    score: 0,
    correctCount: 0,
    wrongIds: [],
    finished: false,
  });
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const question = state.round[state.index];
  const mode = MODES[state.mode];
  state.answered = false;
  state.usedHint = false;
  byId("quiz-label").textContent = `${categoryName(state.categoryId)} · ${mode.name}`;
  byId("quiz-progress").textContent = `${state.index + 1} / ${state.round.length}`;
  renderScoreLine();
  byId("quiz-question").textContent = question.question;
  const list = byId("choice-list");
  list.replaceChildren();
  question.choices.forEach((text, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.textContent = text;
    button.addEventListener("click", () => handleAnswer(i));
    list.appendChild(button);
  });
  byId("feedback").hidden = true;
}

function renderScoreLine() {
  byId("quiz-score").textContent = `점수 ${formatScore(state.score)}`;
}

function handleAnswer(choiceIndex) {
  // 연타는 무시한다. 채점은 문항마다 한 번만 한다.
  if (state.answered) return;
  state.answered = true;
  const question = state.round[state.index];
  const isCorrect = choiceIndex === question.answer;
  state.score += QuizCore.scoreFor(isCorrect, state.usedHint);
  if (isCorrect) {
    state.correctCount += 1;
  } else {
    state.wrongIds.push(question.id);
  }
  renderFeedback(choiceIndex, isCorrect);
}

function renderFeedback(choiceIndex, isCorrect) {
  const question = state.round[state.index];
  byId("choice-list").querySelectorAll(".choice").forEach((button, i) => {
    button.disabled = true;
    if (i === question.answer) button.classList.add("is-correct");
    else if (i === choiceIndex) button.classList.add("is-wrong");
  });
  const result = byId("feedback-result");
  result.textContent = isCorrect ? "정답!" : "오답";
  result.className = `feedback-result ${isCorrect ? "is-correct" : "is-wrong"}`;
  byId("feedback-explanation").textContent = question.explanation;
  const link = byId("feedback-source");
  link.textContent = question.source.name;
  link.href = question.source.url;
  const isLast = state.index === state.round.length - 1;
  byId("next-button").textContent = isLast ? "결과 보기" : "다음";
  byId("feedback").hidden = false;
  renderScoreLine();
}

function goNext() {
  // 답하기 전이거나 이미 결과를 냈으면 무시한다(버튼 연타 방지).
  if (!state.answered || state.finished) return;
  if (state.index < state.round.length - 1) {
    state.index += 1;
    renderQuestion();
  } else {
    renderResult();
  }
}

function renderResult() {
  const mode = MODES[state.mode];
  const total = state.round.length;
  state.finished = true;
  byId("result-score").textContent = `${formatScore(state.score)} / ${total}점`;
  byId("result-detail").textContent = `맞힌 문항 ${state.correctCount}개`;
  byId("result-practice-note").hidden = mode.ranked;
  showScreen("result");
}

function goHome() {
  showScreen("start");
}
```

- [ ] **Step 2: ④ 시작 코드에 `initApp()`을 넣는다**

④ 시작 덩어리의 `if` 블록을 다음으로 바꾼다.

```js
// 브라우저에서 index.html로 열었을 때만 화면 처리를 시작한다(점검 명령에서는 건너뜀).
if (typeof document !== "undefined" && document.getElementById("screen-start")) {
  initApp();
  if (new URLSearchParams(window.location.search).has("test")) runSelfTest();
}
```

- [ ] **Step 3: 점검 명령을 돌려 문법 오류가 없고 점검이 그대로인지 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 10개 중 10개 통과`

- [ ] **Step 4: 화면 흐름을 코드로 다시 확인한다**

브라우저 확인은 사용자가 Task 7에서 한다. 실행자는 `index.html`의 id 목록(Task 5 Interfaces)과 `byId("...")`로 쓴 id가 하나도 빠짐없이 맞는지 `grep -o 'byId("[a-z-]*")' script.js | sort -u`로 뽑아 대조한다.

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "1단계: 연습 모드 진행(문항 표시, 채점, 해설, 결과) 구현" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: 1단계 마무리 — 확인 후 멈춤

**Files:** 없음(확인만)

- [ ] **Step 1: 완료 기준을 확인한다**

1단계 "완료 기준 (실행자가 확인)" 네 줄을 하나씩 확인한다. 점검 명령 결과를 그대로 보고에 붙인다.

- [ ] **Step 2: 사용자에게 보고하고 멈춘다**

다음을 보고하고 **멈춘다.** 사용자가 다음 단계를 지시하기 전에는 Task 8을 시작하지 않는다.

- 만든 것과 커밋 목록
- 점검 명령 결과
- 1단계 "브라우저에서 직접 확인할 항목" 1-1~1-11(그대로 복사)
- Task 4 검수표에 대한 승인 요청
- 계획과 다르게 한 것이 있으면 그 목록(없으면 "없음")

사용자가 확인 중 문제를 알리면 그 문제만 고치고 같은 보고를 다시 한다.

---

# 2단계 — 스피드 모드, 힌트 모드, 틀린 문제 다시 풀기

### 만들 것

- `script.js`: `QuizCore.pickHintRemovals`와 점검, `MODES`의 스피드·힌트, 모드 선택 화면 처리, 15초 타이머, 힌트, 틀린 문제 다시 풀기, 결과 화면의 문항별 결과(`state.results`, `renderResultList`)
- `index.html`: 모드 선택 화면 추가, 퀴즈 화면에 타이머·[힌트], 결과 화면에 [틀린 문제만 다시 풀기]와 "문항별 결과" 목록. 시작 화면의 "연습 모드 · 순위표에 기록되지 않음"은 모드 선택 화면의 연습 버튼으로 옮긴다.
- `style.css`: 모드 버튼, 타이머, 힌트로 지운 보기(취소선 + 흐리게), 문항별 결과 목록

### 완료 기준 (실행자가 확인)

- [ ] 점검 명령 결과가 "자체 점검: 11개 중 11개 통과"다.
- [ ] `MODES`에 `practice`, `speed`, `hint` 세 모드가 PRD 2절 표와 같은 값으로 있다.
- [ ] `handleAnswer`가 맨 앞에서 `state.answered`를 확인하고 `stopTimer()`를 부른다.
- [ ] 화면을 떠나거나 새 판을 시작하는 모든 길(`beginRound`, `goHome`)에서 `stopTimer()`를 부른다.
- [ ] `state.results`는 `handleAnswer`의 `state.answered` 가드 아래에서만 늘어나 문항마다 한 번만 기록되고, `beginRound`에서 비워진다.

### 브라우저에서 직접 확인할 항목 (사용자)

2-1. 시작 화면에는 카테고리 버튼 4개만 있고 "연습 모드 · 순위표에 기록되지 않음"은 없다. [과학]을 누르면 모드 선택 화면에 "과학"과 [연습]·[스피드]·[힌트]가 규칙 한 줄씩과 함께 보인다.
2-2. 모드 선택 화면의 [연습]에 "순위표에 기록되지 않음"이 보인다. [뒤로]를 누르면 시작 화면으로 간다.
2-3. [스피드]: 위쪽에 "과학 · 스피드"와 "남은 시간 15초"가 보이고 1초씩 줄어든다.
2-4. [스피드]: 아무것도 누르지 않고 기다리면 0초에 "시간 초과"가 나오고, 정답 보기가 초록색으로 표시되며 점수는 그대로다.
2-5. [스피드]: 해설이 나온 뒤에는 남은 초가 멈춰 있고, 그때 보기를 눌러도 아무 일이 없다. [다음]을 누르면 "남은 시간 15초"부터 다시 센다.
2-6. [힌트]: 위쪽에 [힌트] 버튼이 있고 남은 시간은 없다. [힌트]를 누르면 오답 보기 2개의 글씨에 줄이 그어지고 흐려지며 눌리지 않는다. 정답 보기는 지워지지 않는다.
2-7. [힌트]: 한 번 쓴 뒤에는 [힌트]가 눌리지 않는다. 답을 고른 뒤에도 눌리지 않는다. [다음] 문항에서는 다시 누를 수 있다.
2-8. [힌트]: 힌트를 쓰고 맞히면 점수가 0.5, 안 쓰고 맞히면 1 오른다. 결과 화면 점수가 "8.5 / 10점"처럼 0.5 단위로 보인다.
2-9. [연습]에서 일부러 2~3개를 틀리면 결과 화면에 [틀린 문제만 다시 풀기]가 나온다. 스피드·힌트 결과 화면에는 이 버튼이 없다.
2-10. [틀린 문제만 다시 풀기]를 누르면 위쪽에 "· 다시 풀기"와 "1 / 틀린 개수", 점수 대신 "맞힌 수 0"이 보이고 틀린 문항만 나온다.
2-11. 다시 풀기 결과는 "맞힌 수 / 푼 수"로 나온다. 또 틀린 문제가 있으면 버튼이 다시 나오고, 모두 맞히면 버튼이 사라진다.
2-12. 다시 풀기 결과 화면에서 [같은 설정으로 다시 하기]를 누르면 같은 카테고리 10문항 전체가 "점수 0"부터 시작한다.
2-13. 세 모드 모두 결과 화면의 버튼 아래에 "문항별 결과"와 10문항 목록이 푼 순서대로 나온다. 문항마다 문제, 결과, "고른 답: …", "정답: …", 해설이 보인다.
2-14. 결과 문구가 맞다. 맞힌 문항은 초록색 "정답", 힌트를 쓰고 맞힌 문항은 초록색 "정답 (힌트 0.5점)", 틀린 문항은 빨간색 "오답", 스피드 모드에서 시간이 지난 문항은 빨간색 "시간 초과"와 "고른 답: 없음"이다.
2-15. 다시 풀기 결과 화면의 목록에는 다시 푼 문항만 나온다. 그 뒤 [같은 설정으로 다시 하기]로 새 판을 끝내면 목록은 새 판의 10문항으로 바뀐다.
2-16. 주소 끝에 `?test`를 붙여 열고 콘솔에서 "자체 점검: 11개 중 11개 통과"를 확인한다.

---

### Task 8: `pickHintRemovals`

**Files:**
- Modify: `script.js` (① `QuizCore`, ③ 자체 점검)

**Interfaces:**
- Consumes: `QuizCore.shuffle`, `seededRng`
- Produces: `QuizCore.pickHintRemovals(question, rng = Math.random) → [i, j]`(정답이 아닌 서로 다른 보기 위치 2개, 오름차순)

- [ ] **Step 1: 실패하는 점검을 쓴다**

③ 점검 목록 끝에 넣는다.

```js
check("pickHintRemovals: 정답이 아닌 서로 다른 보기 2개를 고른다", () => {
  const question = { choices: ["가", "나", "다", "라"], answer: 2 };
  for (let seed = 1; seed <= 50; seed += 1) {
    const removed = QuizCore.pickHintRemovals(question, seededRng(seed));
    assert(removed.length === 2, `seed ${seed}: ${removed.length}개를 골랐습니다.`);
    assert(removed[0] !== removed[1], `seed ${seed}: 같은 보기를 두 번 골랐습니다.`);
    assert(!removed.includes(2), `seed ${seed}: 정답을 골랐습니다.`);
    assert(removed.every((i) => Number.isInteger(i) && i >= 0 && i < 4), `seed ${seed}: 범위 밖 위치입니다.`);
  }
});
```

- [ ] **Step 2: 점검 명령을 돌려 실패를 확인한다**

Run: 점검 명령
Expected: FAIL. `✗ pickHintRemovals: ... — QuizCore.pickHintRemovals is not a function`, `자체 점검: 11개 중 10개 통과`

- [ ] **Step 3: `QuizCore`에 함수를 넣는다**

`return` 줄 바로 위에 넣고, `return` 줄을 바꾼다.

```js
  // 힌트로 지울 오답 보기 위치 2개를 돌려준다. 정답 위치는 고르지 않는다.
  function pickHintRemovals(question, rng = Math.random) {
    const wrong = question.choices.map((_, i) => i).filter((i) => i !== question.answer);
    return shuffle(wrong, rng).slice(0, 2).sort((a, b) => a - b);
  }

  return { shuffle, buildRound, scoreFor, validateQuestions, pickHintRemovals };
```

- [ ] **Step 4: 점검 명령을 돌려 통과를 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 11개 중 11개 통과`

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "2단계: 힌트로 지울 오답 고르기(pickHintRemovals) 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: 모드 선택 화면

**Files:**
- Modify: `index.html` (2단계 판으로 전체 교체)
- Modify: `style.css` (끝에 2단계 블록 추가)
- Modify: `script.js` (② `MODES`, `initApp`, 새 함수 2개)

**Interfaces:**
- Consumes: Task 6의 `startRound`, `showScreen`, `categoryName`, `goHome`
- Produces: 요소 id `screen-mode`, `mode-title`, 모드 버튼 `[data-mode]`(값 `practice`·`speed`·`hint`), `back-button`, `quiz-timer`, `hint-button`, `retry-button`. 함수 `chooseCategory(categoryId)`, `renderModeSelect()`. `MODES.speed`, `MODES.hint`

- [ ] **Step 1: `index.html`을 2단계 판으로 바꾼다**

첫 줄의 작성 시각 주석은 그대로 두고, 나머지를 다음과 같게 만든다(시작 화면의 연습 안내 줄 삭제, 모드 선택 화면 추가, 퀴즈 화면에 `quiz-tools`, 결과 화면에 `retry-button`).

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="app">
    <!-- 시작 화면 -->
    <section id="screen-start" class="screen">
      <h1>상식 퀴즈</h1>
      <p class="lead">카테고리를 고르세요. 한 판은 10문제입니다.</p>
      <p id="data-error" class="notice is-error" hidden></p>
      <div class="button-grid">
        <button type="button" class="category-button" data-category="korean-history">한국사</button>
        <button type="button" class="category-button" data-category="world-geography">세계지리</button>
        <button type="button" class="category-button" data-category="science">과학</button>
        <button type="button" class="category-button" data-category="arts-culture">예술과 문화</button>
      </div>
    </section>

    <!-- 모드 선택 화면 -->
    <section id="screen-mode" class="screen" hidden>
      <h2 id="mode-title"></h2>
      <p class="lead">게임 모드를 고르세요.</p>
      <div class="mode-list">
        <button type="button" class="mode-button" data-mode="practice">
          <strong>연습</strong>
          <span>시간 제한·힌트 없음, 맞히면 1점</span>
          <span class="notice">순위표에 기록되지 않음</span>
        </button>
        <button type="button" class="mode-button" data-mode="speed">
          <strong>스피드</strong>
          <span>문항마다 15초, 시간이 지나면 오답</span>
        </button>
        <button type="button" class="mode-button" data-mode="hint">
          <strong>힌트</strong>
          <span>문항마다 힌트 1번(오답 2개 지움), 힌트 쓰고 맞히면 0.5점</span>
        </button>
      </div>
      <button id="back-button" type="button">뒤로</button>
    </section>

    <!-- 퀴즈 화면 -->
    <section id="screen-quiz" class="screen" hidden>
      <div class="quiz-header">
        <span id="quiz-label"></span>
        <span id="quiz-progress"></span>
        <span id="quiz-score"></span>
      </div>
      <div class="quiz-tools">
        <span id="quiz-timer" class="timer" hidden></span>
        <button id="hint-button" type="button" hidden>힌트</button>
      </div>
      <h2 id="quiz-question" class="question"></h2>
      <div id="choice-list" class="choice-list"></div>
      <div id="feedback" class="feedback" hidden>
        <p id="feedback-result" class="feedback-result"></p>
        <p id="feedback-explanation"></p>
        <p class="source">출처: <a id="feedback-source" href="#" target="_blank" rel="noopener noreferrer"></a></p>
        <button id="next-button" type="button" class="primary">다음</button>
      </div>
    </section>

    <!-- 결과 화면 -->
    <section id="screen-result" class="screen" hidden>
      <h2>결과</h2>
      <p id="result-score" class="result-score"></p>
      <p id="result-detail"></p>
      <p id="result-practice-note" class="notice" hidden>순위표에 기록되지 않음</p>
      <div class="button-row">
        <button id="retry-button" type="button" hidden>틀린 문제만 다시 풀기</button>
        <button id="again-button" type="button" class="primary">같은 설정으로 다시 하기</button>
        <button id="home-button" type="button">처음으로</button>
      </div>
    </section>
  </main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: `style.css` 끝에 2단계 블록을 붙인다**

```css
/* ---- 2단계: 모드 선택, 타이머, 힌트 ---- */

.mode-list {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.mode-button {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
  padding: 14px 16px;
}

.mode-button strong {
  font-size: 1.1rem;
}

.mode-button span {
  color: var(--muted);
  font-size: 0.95rem;
}

.quiz-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.timer {
  color: var(--accent);
  font-weight: 700;
}

.choice.is-removed {
  text-decoration: line-through;
  opacity: 0.4;
}
```

- [ ] **Step 3: `MODES`에 스피드·힌트를 넣는다**

`MODES` 전체를 다음으로 바꾼다.

```js
const MODES = {
  practice: { name: "연습", timeLimit: null, hint: false, ranked: false, retry: true },
  speed: { name: "스피드", timeLimit: 15, hint: false, ranked: true, retry: false },
  hint: { name: "힌트", timeLimit: null, hint: true, ranked: true, retry: false },
};
```

- [ ] **Step 4: 카테고리 → 모드 선택 → 퀴즈 흐름으로 바꾼다**

`initApp` 전체를 다음으로 바꾼다.

```js
function initApp() {
  const problem = dataProblem();
  if (problem) {
    byId("data-error").textContent = problem;
    byId("data-error").hidden = false;
    document.querySelectorAll("#screen-start button").forEach((button) => {
      button.disabled = true;
    });
    showScreen("start");
    return;
  }
  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => chooseCategory(button.dataset.category));
  });
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => startRound(state.categoryId, button.dataset.mode));
  });
  byId("back-button").addEventListener("click", goHome);
  byId("next-button").addEventListener("click", goNext);
  byId("again-button").addEventListener("click", () => startRound(state.categoryId, state.mode));
  byId("home-button").addEventListener("click", goHome);
  showScreen("start");
}
```

`initApp` 바로 아래에 넣는다.

```js
function chooseCategory(categoryId) {
  state.categoryId = categoryId;
  renderModeSelect();
}

function renderModeSelect() {
  byId("mode-title").textContent = categoryName(state.categoryId);
  showScreen("mode");
}
```

- [ ] **Step 5: 점검 명령을 돌린다**

Run: 점검 명령
Expected: PASS. `자체 점검: 11개 중 11개 통과`

- [ ] **Step 6: 커밋**

```bash
git add index.html style.css script.js
git commit -m "2단계: 모드 선택 화면과 스피드·힌트 모드 설정 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: 스피드 모드 15초 타이머

**Files:**
- Modify: `script.js` (② 화면 처리)

**Interfaces:**
- Consumes: `MODES[mode].timeLimit`, 요소 `quiz-timer`
- Produces: `TIMER_TICK_MS`, `state.timerId`, `startTimer()`, `stopTimer()`. 시간 초과는 `handleAnswer(null)`로 처리한다.

- [ ] **Step 1: 상수와 상태를 넣는다**

`MODES` 바로 아래에 넣는다.

```js
const TIMER_TICK_MS = 200;
```

`state`의 `finished: false,` 줄 아래에 `timerId: null,`을 넣는다.

- [ ] **Step 2: 타이머 함수를 ② 화면 처리 끝에 넣는다**

```js
function startTimer() {
  stopTimer();
  const limit = MODES[state.mode].timeLimit;
  const timer = byId("quiz-timer");
  if (!limit) {
    timer.hidden = true;
    return;
  }
  // 남은 시간은 실제 경과 시각으로 계산해 브라우저가 느려져도 늘어나지 않게 한다.
  const endsAt = Date.now() + limit * 1000;
  const tick = () => {
    const leftMs = endsAt - Date.now();
    timer.textContent = `남은 시간 ${Math.max(0, Math.ceil(leftMs / 1000))}초`;
    if (leftMs <= 0) handleAnswer(null);
  };
  timer.hidden = false;
  state.timerId = window.setInterval(tick, TIMER_TICK_MS);
  tick();
}

function stopTimer() {
  if (state.timerId !== null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}
```

- [ ] **Step 3: 기존 함수 4개를 바꾼다**

`startRound`의 첫 줄에 `stopTimer();`를 넣는다.

```js
function startRound(categoryId, mode) {
  stopTimer();
  Object.assign(state, {
    categoryId,
    mode,
    round: QuizCore.buildRound(QUESTIONS, categoryId),
    index: 0,
    score: 0,
    correctCount: 0,
    wrongIds: [],
    finished: false,
  });
  showScreen("quiz");
  renderQuestion();
}
```

`renderQuestion`의 마지막 줄(`byId("feedback").hidden = true;`) 아래에 `startTimer();`를 넣는다.

`handleAnswer` 전체를 다음으로 바꾼다.

```js
function handleAnswer(choiceIndex) {
  // 연타나 시간 초과와 겹친 클릭은 무시한다. 채점은 문항마다 한 번만 한다.
  if (state.answered) return;
  state.answered = true;
  stopTimer();
  const question = state.round[state.index];
  const isCorrect = choiceIndex === question.answer;
  state.score += QuizCore.scoreFor(isCorrect, state.usedHint);
  if (isCorrect) {
    state.correctCount += 1;
  } else {
    state.wrongIds.push(question.id);
  }
  renderFeedback(choiceIndex, isCorrect);
}
```

`renderFeedback`의 `result.textContent = isCorrect ? "정답!" : "오답";` 줄을 다음 두 줄로 바꾼다(`choiceIndex`가 `null`이면 시간 초과).

```js
  if (isCorrect) result.textContent = "정답!";
  else result.textContent = choiceIndex === null ? "시간 초과" : "오답";
```

`goHome` 전체를 다음으로 바꾼다.

```js
function goHome() {
  stopTimer();
  showScreen("start");
}
```

- [ ] **Step 4: 점검 명령을 돌린다**

Run: 점검 명령
Expected: PASS. `자체 점검: 11개 중 11개 통과`

- [ ] **Step 5: 타이머가 멈추는 길을 코드로 확인한다**

`grep -n "stopTimer()" script.js`로 `startTimer` 안, `stopTimer` 정의, `startRound`, `handleAnswer`, `goHome`에 있는지 확인한다(검토 초점 2).

- [ ] **Step 6: 커밋**

```bash
git add script.js
git commit -m "2단계: 스피드 모드 15초 타이머와 시간 초과 처리 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: 힌트 모드

**Files:**
- Modify: `script.js` (② 화면 처리)

**Interfaces:**
- Consumes: `QuizCore.pickHintRemovals`, `MODES[mode].hint`, 요소 `hint-button`, CSS `.is-removed`
- Produces: `useHint()`. 힌트를 쓰면 `state.usedHint = true`가 되어 `scoreFor`가 0.5점을 준다.

- [ ] **Step 1: `useHint`를 ② 화면 처리 끝에 넣는다**

```js
function useHint() {
  // 답한 뒤나 이미 쓴 뒤에는 무시한다.
  if (state.answered || state.usedHint) return;
  state.usedHint = true;
  const question = state.round[state.index];
  const buttons = byId("choice-list").querySelectorAll(".choice");
  QuizCore.pickHintRemovals(question).forEach((i) => {
    buttons[i].disabled = true;
    buttons[i].classList.add("is-removed");
  });
  byId("hint-button").disabled = true;
}
```

- [ ] **Step 2: 버튼을 연결하고 문항마다 상태를 되돌린다**

`initApp`의 `byId("back-button").addEventListener("click", goHome);` 줄 아래에 넣는다.

```js
  byId("hint-button").addEventListener("click", useHint);
```

`renderQuestion`의 `byId("feedback").hidden = true;`와 `startTimer();` 사이에 넣는다.

```js
  byId("hint-button").hidden = !mode.hint;
  byId("hint-button").disabled = false;
```

`renderFeedback`에서 보기 버튼을 잠그는 `forEach` 블록 바로 아래에 넣는다.

```js
  byId("hint-button").disabled = true;
```

- [ ] **Step 3: 점검 명령을 돌린다**

Run: 점검 명령
Expected: PASS. `자체 점검: 11개 중 11개 통과`

- [ ] **Step 4: 커밋**

```bash
git add script.js
git commit -m "2단계: 힌트 모드(오답 2개 지우기, 0.5점) 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: 틀린 문제만 다시 풀기

**Files:**
- Modify: `script.js` (② 화면 처리)

**Interfaces:**
- Consumes: `state.wrongIds`, `MODES[mode].retry`, 요소 `retry-button`
- Produces: `state.isRetry`, `beginRound(categoryId, mode, round, isRetry)`, `startRetry()`. `startRound`는 `beginRound`를 부른다.

- [ ] **Step 1: 상태를 넣는다**

`state`의 `wrongIds: [],` 줄 아래에 `isRetry: false,`를 넣는다.

- [ ] **Step 2: 판 시작을 `beginRound` 하나로 모은다**

`startRound` 전체를 다음 세 함수로 바꾼다.

```js
function startRound(categoryId, mode) {
  beginRound(categoryId, mode, QuizCore.buildRound(QUESTIONS, categoryId), false);
}

// 처음 판에서 틀린 문항만 다시 섞어서 푼다. 처음 판의 점수는 바꾸지 않는다.
function startRetry() {
  const wrongQuestions = QUESTIONS.filter((question) => state.wrongIds.includes(question.id));
  beginRound(state.categoryId, "practice", QuizCore.buildRound(wrongQuestions, state.categoryId), true);
}

function beginRound(categoryId, mode, round, isRetry) {
  stopTimer();
  Object.assign(state, {
    categoryId,
    mode,
    round,
    isRetry,
    index: 0,
    score: 0,
    correctCount: 0,
    wrongIds: [],
    finished: false,
  });
  showScreen("quiz");
  renderQuestion();
}
```

- [ ] **Step 3: 다시 풀기 판의 표시를 바꾼다**

`renderQuestion`의 `quiz-label` 줄을 다음으로 바꾼다.

```js
  byId("quiz-label").textContent =
    `${categoryName(state.categoryId)} · ${mode.name}${state.isRetry ? " · 다시 풀기" : ""}`;
```

`renderScoreLine` 전체를 다음으로 바꾼다.

```js
function renderScoreLine() {
  byId("quiz-score").textContent = state.isRetry
    ? `맞힌 수 ${state.correctCount}`
    : `점수 ${formatScore(state.score)}`;
}
```

`renderResult` 전체를 다음으로 바꾼다.

```js
function renderResult() {
  const mode = MODES[state.mode];
  const total = state.round.length;
  state.finished = true;
  if (state.isRetry) {
    byId("result-score").textContent = `${state.correctCount} / ${total}`;
    byId("result-detail").textContent = "다시 풀기 결과(맞힌 수 / 푼 수)입니다. 처음 판의 점수는 바뀌지 않습니다.";
  } else {
    byId("result-score").textContent = `${formatScore(state.score)} / ${total}점`;
    byId("result-detail").textContent = `맞힌 문항 ${state.correctCount}개`;
  }
  byId("result-practice-note").hidden = mode.ranked;
  byId("retry-button").hidden = !(mode.retry && state.wrongIds.length > 0);
  showScreen("result");
}
```

- [ ] **Step 4: 버튼을 연결한다**

`initApp`의 `byId("next-button").addEventListener("click", goNext);` 줄 아래에 넣는다.

```js
  byId("retry-button").addEventListener("click", startRetry);
```

[같은 설정으로 다시 하기]는 이미 `startRound(state.categoryId, state.mode)`를 부르므로, 다시 풀기 결과에서 눌러도 10문항 전체로 새 판을 시작한다(`isRetry: false`).

- [ ] **Step 5: 점검 명령을 돌린다**

Run: 점검 명령
Expected: PASS. `자체 점검: 11개 중 11개 통과`

- [ ] **Step 6: 커밋**

```bash
git add script.js
git commit -m "2단계: 연습 모드의 틀린 문제만 다시 풀기 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: 결과 화면의 문항별 결과 목록

**Files:**
- Modify: `index.html` (결과 화면에 목록 추가)
- Modify: `style.css` (끝에 결과 목록 블록 추가)
- Modify: `script.js` (② 화면 처리)

**Interfaces:**
- Consumes: Task 10의 `handleAnswer`(`choiceIndex`가 `null`이면 시간 초과), Task 11의 `state.usedHint`, Task 12의 `beginRound`와 `renderResult`
- Produces: `state.results`(푼 순서대로 `{ question, choiceIndex, isCorrect, usedHint }`), `resultLabel(item)`, `renderResultList()`. 요소 id `result-list`. CSS 클래스 `.result-list-title`, `.result-list`, `.result-item`, `.result-question`, `.result-status`, `.result-explanation`

- [ ] **Step 1: `index.html`의 결과 화면에 목록 자리를 넣는다**

결과 화면의 `button-row` 블록을 닫는 `</div>` 줄과 `</section>` 줄 사이에 넣는다.

```html
      <h3 class="result-list-title">문항별 결과</h3>
      <ol id="result-list" class="result-list"></ol>
```

- [ ] **Step 2: `style.css` 끝에 결과 목록 블록을 붙인다**

```css
/* ---- 2단계: 결과 화면의 문항별 결과 ---- */

.result-list-title {
  margin: 28px 0 8px;
  font-size: 1.05rem;
}

.result-list {
  margin: 0;
  padding-left: 1.4em;
}

.result-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.result-item p {
  margin: 2px 0;
}

.result-question {
  font-weight: 600;
}

.result-status {
  font-weight: 700;
}

.result-status.is-correct {
  color: var(--correct);
}

.result-status.is-wrong {
  color: var(--wrong);
}

.result-explanation {
  color: var(--muted);
  font-size: 0.95rem;
}
```

- [ ] **Step 3: 상태에 문항별 결과를 넣는다**

`state`와 `beginRound`의 `Object.assign` 두 곳 모두 `wrongIds: [],` 줄 아래에 넣는다. 새 판(다시 풀기 판 포함)을 시작할 때마다 목록이 비워진다.

```js
    results: [],
```

`handleAnswer`의 `if (isCorrect) { ... } else { ... }` 블록 바로 아래, `renderFeedback(choiceIndex, isCorrect);` 줄 위에 넣는다. `question`은 보기를 섞은 뒤의 문항이므로 `choices[choiceIndex]`와 `choices[answer]`가 화면에 보인 보기와 같다.

```js
  state.results.push({ question, choiceIndex, isCorrect, usedHint: state.usedHint });
```

- [ ] **Step 4: 목록을 그리는 함수를 ② 화면 처리 끝에 넣는다**

```js
// 결과 목록에 쓸 문구. 시간 초과는 choiceIndex가 null이다.
function resultLabel(item) {
  if (item.isCorrect) return item.usedHint ? "정답 (힌트 0.5점)" : "정답";
  return item.choiceIndex === null ? "시간 초과" : "오답";
}

// 이번 판에 푼 순서대로 문항별 결과를 그린다. 문항 문자열은 textContent로만 넣는다.
function renderResultList() {
  const list = byId("result-list");
  list.replaceChildren();
  state.results.forEach((item) => {
    const { question, choiceIndex } = item;
    const lines = [
      ["result-question", question.question],
      [`result-status ${item.isCorrect ? "is-correct" : "is-wrong"}`, resultLabel(item)],
      ["", `고른 답: ${choiceIndex === null ? "없음" : question.choices[choiceIndex]}`],
      ["", `정답: ${question.choices[question.answer]}`],
      ["result-explanation", question.explanation],
    ];
    const li = document.createElement("li");
    li.className = "result-item";
    lines.forEach(([className, text]) => {
      const line = document.createElement("p");
      if (className) line.className = className;
      line.textContent = text;
      li.append(line);
    });
    list.append(li);
  });
}
```

- [ ] **Step 5: 결과 화면에서 부른다**

`renderResult`의 `showScreen("result");` 줄 바로 위에 넣는다.

```js
  renderResultList();
```

- [ ] **Step 6: 점검 명령을 돌린다**

Run: 점검 명령
Expected: PASS. `자체 점검: 11개 중 11개 통과`

- [ ] **Step 7: id를 대조한다**

`grep -o 'byId("[a-z-]*")' script.js | sort -u`로 뽑은 id에 `result-list`가 있고, `index.html`에도 같은 id가 있는지 확인한다.

- [ ] **Step 8: 커밋**

```bash
git add index.html style.css script.js
git commit -m "2단계: 결과 화면에 문항별 결과 목록(문제, 결과, 고른 답, 정답, 해설) 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: 2단계 마무리 — 확인 후 멈춤

**Files:** 없음(확인만)

- [ ] **Step 1: 완료 기준을 확인한다**

2단계 "완료 기준 (실행자가 확인)" 네 줄을 하나씩 확인한다.

- [ ] **Step 2: 사용자에게 보고하고 멈춘다**

다음을 보고하고 **멈춘다.** 사용자가 다음 단계를 지시하기 전에는 Task 15를 시작하지 않는다.

- 만든 것과 커밋 목록
- 점검 명령 결과
- 2단계 "브라우저에서 직접 확인할 항목" 2-1~2-16(그대로 복사). 1단계 항목 1-3~1-8도 연습 모드에서 다시 확인해 달라고 적는다.
- 계획과 다르게 한 것이 있으면 그 목록(없으면 "없음")

---

# 3단계 — 점수 저장과 순위표

### 만들 것

- `script.js`: `QuizCore.addRecord`, `QuizCore.parseBoard`와 점검, 결과 저장과 순위 표시(`loadBoard`, `saveRecord`, `renderRecordResult`), 순위표 화면(`fillBoardCategories`, `openBoard`, `renderBoard`, `formatDate`)
- `index.html`: 시작 화면 [순위표 보기], 결과 화면의 순위 문구·저장 불가 안내·[순위표 보기], 순위표 화면
- `style.css`: 순위표 표와 선택 상자

### 완료 기준 (실행자가 확인)

- [ ] 점검 명령 결과가 "자체 점검: 15개 중 15개 통과"다.
- [ ] localStorage 키는 `quiz.leaderboard.v1` 하나이고, 값은 `"모드:카테고리"` 키에 `{ score, date }` 배열을 담는다(PRD 7절).
- [ ] localStorage 읽기와 쓰기가 모두 `try/catch` 안에 있다.
- [ ] 연습 모드와 다시 풀기 판에서는 `saveRecord`가 불리지 않는다.

### 브라우저에서 직접 확인할 항목 (사용자)

3-1. 시작 화면에 [순위표 보기]가 있다. 누르면 순위표 화면에 "스피드"·"한국사"가 선택되어 있고, 기록이 없으면 "아직 기록이 없습니다"가 보인다.
3-2. [스피드]로 한 판을 끝내면 결과 화면에 "이번 기록: 1위"와 [순위표 보기]가 보인다.
3-3. 결과 화면의 [순위표 보기]를 누르면 방금 푼 모드·카테고리 표가 열리고, 순위·점수·날짜(`2026-10-08 12:12` 꼴) 한 줄이 보인다.
3-4. [결과 보기]를 여러 번 빠르게 눌러도 순위표에 기록은 한 줄만 늘어난다.
3-5. [힌트]로 0.5점이 섞인 판을 끝내면 순위표에 "8.5"처럼 보이고, 점수가 높은 기록이 위, 점수가 같으면 최근 기록이 위에 있다.
3-6. 연습 모드와 다시 풀기 결과 화면에는 순위 문구와 [순위표 보기]가 없고, 순위표에도 기록이 늘지 않는다.
3-7. 순위표 화면에서 모드·카테고리를 바꾸면 그 표로 바뀐다. [처음으로]는 시작 화면으로 간다.
3-8. 브라우저를 완전히 닫았다가 `index.html`을 다시 열어도 기록이 남아 있다.
3-9. 개발자 도구 콘솔에서 `localStorage.setItem("quiz.leaderboard.v1", "{깨짐")`을 실행하고 순위표를 열면, 앱이 멈추지 않고 "아직 기록이 없습니다"가 나온다. 그 뒤 한 판을 끝내면 다시 정상으로 저장된다.
3-10. 저장소를 쓸 수 없는 상황을 흉내 낸다. 콘솔에서 `Object.defineProperty(window, "localStorage", { get() { throw new Error("차단"); } })`를 실행한 뒤(새로 고침하면 원래대로 돌아옴) [스피드] 한 판을 끝내면, 퀴즈는 정상으로 진행되고 결과 화면에 "이 브라우저에서는 기록을 저장할 수 없습니다"가 나온다. [순위표 보기]를 눌러도 같은 문구와 "아직 기록이 없습니다"가 나온다.
3-11. 주소 끝에 `?test`를 붙여 열고 콘솔에서 "자체 점검: 15개 중 15개 통과"를 확인한다.

---

### Task 15: `addRecord`와 `parseBoard`

**Files:**
- Modify: `script.js` (① `QuizCore`, ③ 자체 점검)

**Interfaces:**
- Consumes: 없음
- Produces: `QuizCore.addRecord(records, record) → 새 배열`(점수 내림차순, 동점이면 `date` 내림차순, 앞 10개, 원본 그대로), `QuizCore.parseBoard(text) → { "모드:카테고리": [{ score, date }] }`(깨진 값은 `{}`, 형식이 틀린 기록은 버림, 목록마다 정렬해 10개까지). 기록 형식은 `{ score: number, date: ISO 문자열 }`

- [ ] **Step 1: 실패하는 점검을 쓴다**

③ 점검 목록 끝에 넣는다.

```js
check("addRecord: 점수 내림차순, 동점이면 최근 기록이 위", () => {
  let list = [];
  list = QuizCore.addRecord(list, { score: 7, date: "2026-10-01T00:00:00.000Z" });
  list = QuizCore.addRecord(list, { score: 9, date: "2026-10-02T00:00:00.000Z" });
  list = QuizCore.addRecord(list, { score: 7, date: "2026-10-03T00:00:00.000Z" });
  assert(list.map((r) => r.score).join(",") === "9,7,7", "점수 순서가 틀렸습니다.");
  assert(list[1].date === "2026-10-03T00:00:00.000Z", "동점일 때 최근 기록이 위에 있지 않습니다.");
});

check("addRecord: 10개만 남기고 원본 목록을 바꾸지 않는다", () => {
  let list = [];
  for (let day = 1; day <= 10; day += 1) {
    list = QuizCore.addRecord(list, { score: 5, date: `2026-10-${String(day).padStart(2, "0")}T00:00:00.000Z` });
  }
  const before = JSON.stringify(list);
  const low = { score: 1, date: "2026-10-20T00:00:00.000Z" };
  const afterLow = QuizCore.addRecord(list, low);
  assert(afterLow.length === 10, `기록이 ${afterLow.length}개입니다.`);
  assert(!afterLow.includes(low), "11번째 기록이 잘리지 않았습니다.");
  assert(JSON.stringify(list) === before, "원본 목록이 바뀌었습니다.");
  const high = { score: 10, date: "2026-10-21T00:00:00.000Z" };
  assert(QuizCore.addRecord(list, high).indexOf(high) === 0, "가장 높은 점수가 1위가 아닙니다.");
});

check("parseBoard: 깨진 값은 빈 순위표로 읽는다", () => {
  ["", "{", "null", "[]", "123", "\"문자열\""].forEach((text) => {
    assert(Object.keys(QuizCore.parseBoard(text)).length === 0, `${JSON.stringify(text)}를 빈 순위표로 읽지 않았습니다.`);
  });
  assert(Object.keys(QuizCore.parseBoard(null)).length === 0, "null을 빈 순위표로 읽지 않았습니다.");
});

check("parseBoard: 형식이 맞는 기록만 남긴다", () => {
  const text = JSON.stringify({
    "speed:science": [
      { score: 8, date: "2026-10-08T03:12:00.000Z" },
      { score: "많음", date: "2026-10-08T03:12:00.000Z" },
      { score: 5 },
    ],
    "hint:science": "깨진 값",
  });
  const board = QuizCore.parseBoard(text);
  assert(board["speed:science"].length === 1, "형식이 틀린 기록을 거르지 않았습니다.");
  assert(!("hint:science" in board), "배열이 아닌 값을 거르지 않았습니다.");
});
```

- [ ] **Step 2: 점검 명령을 돌려 실패를 확인한다**

Run: 점검 명령
Expected: FAIL. `✗ addRecord: ... is not a function` 2줄, `✗ parseBoard: ... is not a function` 2줄, `자체 점검: 15개 중 11개 통과`

- [ ] **Step 3: `QuizCore`에 상수와 함수를 넣는다**

`QuizCore` 맨 위 상수들 아래에 넣는다.

```js
  const MAX_RECORDS = 10;
```

`return` 줄 바로 위에 넣고, `return` 줄을 바꾼다.

```js
  // 점수 내림차순, 동점이면 날짜 내림차순(최근 기록이 위).
  function compareRecords(a, b) {
    if (b.score !== a.score) return b.score - a.score;
    if (a.date === b.date) return 0;
    return a.date < b.date ? 1 : -1;
  }

  // 기록을 넣고 정렬한 뒤 앞의 10개만 돌려준다. 원본 목록은 바꾸지 않는다.
  function addRecord(records, record) {
    return records.concat([record]).sort(compareRecords).slice(0, MAX_RECORDS);
  }

  function isValidRecord(record) {
    return Boolean(record)
      && typeof record.score === "number" && Number.isFinite(record.score)
      && typeof record.date === "string" && !Number.isNaN(Date.parse(record.date));
  }

  // localStorage에서 읽은 문자열을 순위표 객체로 바꾼다. 깨진 값은 빈 순위표로 본다.
  function parseBoard(text) {
    if (typeof text !== "string" || text === "") return {};
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return {};
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const board = {};
    Object.keys(data).forEach((key) => {
      if (Array.isArray(data[key])) {
        board[key] = data[key].filter(isValidRecord).sort(compareRecords).slice(0, MAX_RECORDS);
      }
    });
    return board;
  }

  return { shuffle, buildRound, scoreFor, validateQuestions, pickHintRemovals, addRecord, parseBoard };
```

- [ ] **Step 4: 점검 명령을 돌려 통과를 확인한다**

Run: 점검 명령
Expected: PASS. `자체 점검: 15개 중 15개 통과`

- [ ] **Step 5: 커밋**

```bash
git add script.js
git commit -m "3단계: 기록 정렬(addRecord)과 저장값 읽기(parseBoard) 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: 결과 저장과 순위 표시

**Files:**
- Modify: `index.html` (3단계 판으로 전체 교체)
- Modify: `script.js` (② 화면 처리)

**Interfaces:**
- Consumes: `QuizCore.addRecord`, `QuizCore.parseBoard`, `MODES[mode].ranked`
- Produces: `STORAGE_KEY = "quiz.leaderboard.v1"`, `loadBoard() → { ok: boolean, board }`, `saveRecord(record) → { saved: boolean, rank: number }`(`rank`는 1~10, 10위 밖이면 0), `renderRecordResult()`. 요소 id `start-board-button`, `result-rank`, `result-storage-warning`, `result-board-button`, 순위표 화면 `screen-board`, `board-mode`, `board-category`, `board-warning`, `board-body`, `board-empty`, `board-home-button`

- [ ] **Step 1: `index.html`을 3단계 판으로 바꾼다**

첫 줄의 작성 시각 주석은 그대로 두고, 나머지를 다음과 같게 만든다(시작 화면 [순위표 보기], 결과 화면 세 요소, 순위표 화면 추가. Task 13의 "문항별 결과" 목록은 그대로 둔다).

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>상식 퀴즈</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="app">
    <!-- 시작 화면 -->
    <section id="screen-start" class="screen">
      <h1>상식 퀴즈</h1>
      <p class="lead">카테고리를 고르세요. 한 판은 10문제입니다.</p>
      <p id="data-error" class="notice is-error" hidden></p>
      <div class="button-grid">
        <button type="button" class="category-button" data-category="korean-history">한국사</button>
        <button type="button" class="category-button" data-category="world-geography">세계지리</button>
        <button type="button" class="category-button" data-category="science">과학</button>
        <button type="button" class="category-button" data-category="arts-culture">예술과 문화</button>
      </div>
      <button id="start-board-button" type="button" class="link-button">순위표 보기</button>
    </section>

    <!-- 모드 선택 화면 -->
    <section id="screen-mode" class="screen" hidden>
      <h2 id="mode-title"></h2>
      <p class="lead">게임 모드를 고르세요.</p>
      <div class="mode-list">
        <button type="button" class="mode-button" data-mode="practice">
          <strong>연습</strong>
          <span>시간 제한·힌트 없음, 맞히면 1점</span>
          <span class="notice">순위표에 기록되지 않음</span>
        </button>
        <button type="button" class="mode-button" data-mode="speed">
          <strong>스피드</strong>
          <span>문항마다 15초, 시간이 지나면 오답</span>
        </button>
        <button type="button" class="mode-button" data-mode="hint">
          <strong>힌트</strong>
          <span>문항마다 힌트 1번(오답 2개 지움), 힌트 쓰고 맞히면 0.5점</span>
        </button>
      </div>
      <button id="back-button" type="button">뒤로</button>
    </section>

    <!-- 퀴즈 화면 -->
    <section id="screen-quiz" class="screen" hidden>
      <div class="quiz-header">
        <span id="quiz-label"></span>
        <span id="quiz-progress"></span>
        <span id="quiz-score"></span>
      </div>
      <div class="quiz-tools">
        <span id="quiz-timer" class="timer" hidden></span>
        <button id="hint-button" type="button" hidden>힌트</button>
      </div>
      <h2 id="quiz-question" class="question"></h2>
      <div id="choice-list" class="choice-list"></div>
      <div id="feedback" class="feedback" hidden>
        <p id="feedback-result" class="feedback-result"></p>
        <p id="feedback-explanation"></p>
        <p class="source">출처: <a id="feedback-source" href="#" target="_blank" rel="noopener noreferrer"></a></p>
        <button id="next-button" type="button" class="primary">다음</button>
      </div>
    </section>

    <!-- 결과 화면 -->
    <section id="screen-result" class="screen" hidden>
      <h2>결과</h2>
      <p id="result-score" class="result-score"></p>
      <p id="result-detail"></p>
      <p id="result-practice-note" class="notice" hidden>순위표에 기록되지 않음</p>
      <p id="result-rank" class="notice" hidden></p>
      <p id="result-storage-warning" class="notice is-error" hidden>이 브라우저에서는 기록을 저장할 수 없습니다</p>
      <div class="button-row">
        <button id="retry-button" type="button" hidden>틀린 문제만 다시 풀기</button>
        <button id="result-board-button" type="button" hidden>순위표 보기</button>
        <button id="again-button" type="button" class="primary">같은 설정으로 다시 하기</button>
        <button id="home-button" type="button">처음으로</button>
      </div>
      <h3 class="result-list-title">문항별 결과</h3>
      <ol id="result-list" class="result-list"></ol>
    </section>

    <!-- 순위표 화면 -->
    <section id="screen-board" class="screen" hidden>
      <h2>순위표</h2>
      <div class="board-filters">
        <label>모드
          <select id="board-mode">
            <option value="speed">스피드</option>
            <option value="hint">힌트</option>
          </select>
        </label>
        <label>카테고리
          <select id="board-category"></select>
        </label>
      </div>
      <p id="board-warning" class="notice is-error" hidden>이 브라우저에서는 기록을 저장할 수 없습니다</p>
      <table class="board-table">
        <thead>
          <tr><th>순위</th><th>점수</th><th>날짜</th></tr>
        </thead>
        <tbody id="board-body"></tbody>
      </table>
      <p id="board-empty" class="notice" hidden>아직 기록이 없습니다</p>
      <div class="button-row">
        <button id="board-home-button" type="button">처음으로</button>
      </div>
    </section>
  </main>
  <script src="questions.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

- [ ] **Step 2: 저장 키를 넣는다**

`MODES` 바로 아래(`TIMER_TICK_MS` 위)에 넣는다.

```js
const STORAGE_KEY = "quiz.leaderboard.v1";
```

- [ ] **Step 3: 저장 함수를 ② 화면 처리 끝에 넣는다**

```js
// 저장소를 쓸 수 없으면 ok가 false다. 깨진 값은 parseBoard가 빈 순위표로 바꾼다.
function loadBoard() {
  try {
    return { ok: true, board: QuizCore.parseBoard(window.localStorage.getItem(STORAGE_KEY)) };
  } catch (error) {
    return { ok: false, board: {} };
  }
}

// 이번 판 기록을 저장하고 순위를 돌려준다. 10위 밖이면 rank는 0이다.
function saveRecord(record) {
  const key = `${state.mode}:${state.categoryId}`;
  const loaded = loadBoard();
  if (!loaded.ok) return { saved: false, rank: 0 };
  const records = QuizCore.addRecord(loaded.board[key] || [], record);
  loaded.board[key] = records;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded.board));
  } catch (error) {
    return { saved: false, rank: 0 };
  }
  return { saved: true, rank: records.indexOf(record) + 1 };
}

// 스피드·힌트 모드 결과 화면에서만 기록을 저장하고 순위를 보여 준다.
function renderRecordResult() {
  const ranked = MODES[state.mode].ranked;
  const rankLine = byId("result-rank");
  const warning = byId("result-storage-warning");
  rankLine.hidden = true;
  warning.hidden = true;
  byId("result-board-button").hidden = !ranked;
  if (!ranked) return;
  const outcome = saveRecord({ score: state.score, date: new Date().toISOString() });
  if (!outcome.saved) {
    warning.hidden = false;
    return;
  }
  rankLine.textContent = outcome.rank > 0 ? `이번 기록: ${outcome.rank}위` : "10위 안에 들지 못했습니다";
  rankLine.hidden = false;
}
```

다시 풀기 판은 모드가 항상 `practice`(`ranked: false`)이므로 저장되지 않는다.

- [ ] **Step 4: 결과 화면에서 부른다**

`renderResult`의 `byId("retry-button").hidden = ...` 줄과 `showScreen("result");` 사이에 넣는다.

```js
  renderRecordResult();
```

`renderResult`는 `goNext`의 `state.finished` 가드 덕분에 판마다 한 번만 불리므로 기록도 한 번만 저장된다(검토 초점 1).

- [ ] **Step 5: 점검 명령을 돌린다**

Run: 점검 명령
Expected: PASS. `자체 점검: 15개 중 15개 통과`

- [ ] **Step 6: 커밋**

```bash
git add index.html script.js
git commit -m "3단계: 스피드·힌트 결과 저장과 순위 표시 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: 순위표 화면

**Files:**
- Modify: `script.js` (② 화면 처리)
- Modify: `style.css` (끝에 3단계 블록 추가)

**Interfaces:**
- Consumes: `loadBoard`, `formatScore`, `CATEGORIES`, Task 16의 요소 id
- Produces: `fillBoardCategories()`, `openBoard(mode, categoryId)`, `renderBoard()`, `formatDate(iso) → "YYYY-MM-DD HH:MM"`(사용자 컴퓨터 시간대)

- [ ] **Step 1: 순위표 함수를 ② 화면 처리 끝에 넣는다**

```js
function fillBoardCategories() {
  const select = byId("board-category");
  CATEGORIES.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  });
}

function openBoard(mode, categoryId) {
  byId("board-mode").value = mode;
  byId("board-category").value = categoryId;
  renderBoard();
  showScreen("board");
}

function renderBoard() {
  const key = `${byId("board-mode").value}:${byId("board-category").value}`;
  const loaded = loadBoard();
  const records = loaded.board[key] || [];
  byId("board-warning").hidden = loaded.ok;
  const body = byId("board-body");
  body.replaceChildren();
  records.forEach((record, i) => {
    const row = document.createElement("tr");
    [String(i + 1), formatScore(record.score), formatDate(record.date)].forEach((text) => {
      const cell = document.createElement("td");
      cell.textContent = text;
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
  byId("board-empty").hidden = records.length > 0;
}

function formatDate(iso) {
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
```

- [ ] **Step 2: 버튼과 선택 상자를 연결한다**

`initApp`의 `byId("home-button").addEventListener("click", goHome);` 줄 아래에 넣는다.

```js
  fillBoardCategories();
  // 시작 화면에서 열면 스피드·한국사(첫 카테고리) 표를 먼저 보여 준다.
  byId("start-board-button").addEventListener("click", () => openBoard("speed", CATEGORIES[0].id));
  byId("result-board-button").addEventListener("click", () => openBoard(state.mode, state.categoryId));
  byId("board-mode").addEventListener("change", renderBoard);
  byId("board-category").addEventListener("change", renderBoard);
  byId("board-home-button").addEventListener("click", goHome);
```

- [ ] **Step 3: `style.css` 끝에 3단계 블록을 붙인다**

```css
/* ---- 3단계: 순위표 ---- */

.link-button {
  padding: 4px 0;
  border: none;
  background: none;
  color: var(--accent);
  text-decoration: underline;
}

.board-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.board-filters select {
  margin-left: 4px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font: inherit;
}

.board-table {
  width: 100%;
  border-collapse: collapse;
}

.board-table th,
.board-table td {
  padding: 8px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}
```

- [ ] **Step 4: 점검 명령을 돌린다**

Run: 점검 명령
Expected: PASS. `자체 점검: 15개 중 15개 통과`

- [ ] **Step 5: id를 대조한다**

`grep -o 'byId("[a-z-]*")' script.js | sort -u`로 뽑은 id가 모두 `index.html`에 있는지 확인한다.

- [ ] **Step 6: 커밋**

```bash
git add script.js style.css
git commit -m "3단계: 순위표 화면 추가" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: 3단계 마무리 — 확인 후 멈춤

**Files:** 없음(확인만)

- [ ] **Step 1: 완료 기준을 확인한다**

3단계 "완료 기준 (실행자가 확인)" 네 줄을 하나씩 확인한다.

- [ ] **Step 2: 사용자에게 보고하고 멈춘다**

다음을 보고하고 **멈춘다.**

- 만든 것과 커밋 목록
- 점검 명령 결과
- 3단계 "브라우저에서 직접 확인할 항목" 3-1~3-11(그대로 복사)
- 계획과 다르게 한 것이 있으면 그 목록(없으면 "없음")

---

## PRD 대응표

| PRD | 내용 | 태스크 |
|---|---|---|
| 1 | 개요, 카테고리 4개 | 1, 4 |
| 2.1 | 연습 모드(1점, 순위표 미기록 안내, 틀린 문제 다시 풀기) | 6, 9, 12 |
| 2.2 | 스피드 모드(15초, 시간 초과 오답, 해설 중 정지, `Date.now()` 계산) | 10 |
| 2.3 | 힌트 모드(오답 2개 취소선 + 흐리게, 1번, 0.5점) | 8, 11 |
| 3.1 | 시작 화면(1단계 바로 시작, 2단계 모드 선택으로, 3단계 [순위표 보기]) | 5, 6, 9, 16, 17 |
| 3.2 | 모드 선택 화면(규칙 한 줄, 연습 안내, [뒤로]) | 9 |
| 3.3 | 퀴즈 화면(진행, 점수, 정답·오답 색, 해설, 출처 링크, [다음]/[결과 보기]) | 5, 6 |
| 3.4 | 결과 화면(점수, 안내, 다시 풀기, 문항별 결과, 자동 저장과 순위, 버튼) | 6, 12, 13, 16 |
| 3.5 | 순위표 화면(두 입구, 기본 선택, 표, 빈 표 안내) | 16, 17 |
| 4 | 파일 4개, 첫 줄 KST, 외부 도구 없음 | 전역 제약, 1, 5 |
| 5.1~5.3 | 문항 데이터 형식, 문항 규칙, 작성 절차 | 3, 4 |
| 6.1 | `QuizCore` 함수 7개 | 1, 2, 3, 8, 15 |
| 6.2 | `MODES`, `state`, 화면 함수, `stopTimer` 호출 | 6, 9, 10, 11, 12, 13 |
| 6.3 | 데이터 흐름(채점 한 번, 타이머 정지, 문항별 결과 기록) | 6, 10, 13 |
| 6.4, 9.1 | 자체 점검(`index.html?test`), 점검 항목 | 1, 2, 3, 4, 8, 15 |
| 7 | 순위표 저장(`quiz.leaderboard.v1`, 10개, 최근 우선, 이름 없음) | 15, 16 |
| 8 | 오류 처리 5가지 | 6, 10, 15, 16, 17 |
| 9.2, 10 | 직접 확인, 단계별 완료 기준 | 7, 14, 18 |
| 11 | 다루지 않는 것 | 전역 제약(만들지 않음) |
