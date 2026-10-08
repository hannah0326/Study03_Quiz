// 작성: 2026-10-08 13:20 KST
// 상식 퀴즈 — 순수 로직(QuizCore), 화면 처리, 자체 점검(index.html?test)을 이 파일 하나에 둔다.
"use strict";

/* ========== 1. 순수 로직 (DOM을 건드리지 않음) ========== */

const QuizCore = (function () {
  const QUESTIONS_PER_CATEGORY = 10;
  const CHOICES_PER_QUESTION = 4;
  const EXPLANATION_MAX_LENGTH = 100;

  // 원본은 그대로 두고 섞은 새 배열을 돌려준다(Fisher–Yates).
  function shuffle(list, rng = Math.random) {
    const result = list.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

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

function problemsAfter(change) {
  const questions = makeSampleQuestions();
  change(questions);
  return QuizCore.validateQuestions(questions, SAMPLE_CATEGORIES);
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

check("validateQuestions: 실제 문항 데이터(questions.js)에 문제가 없다", () => {
  assert(typeof QUESTIONS !== "undefined" && typeof CATEGORIES !== "undefined", "questions.js를 불러오지 못했습니다.");
  const problems = QuizCore.validateQuestions(QUESTIONS, CATEGORIES);
  assert(problems.length === 0, problems.join(" / "));
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
