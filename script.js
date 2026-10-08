// 작성: 2026-10-08 13:20 KST
// 상식 퀴즈 — 순수 로직(QuizCore), 화면 처리, 자체 점검(index.html?test)을 이 파일 하나에 둔다.
"use strict";

/* ========== 1. 순수 로직 (DOM을 건드리지 않음) ========== */

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
