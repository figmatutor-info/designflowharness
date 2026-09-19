/**
 * 검증 스크립트 회귀 테스트 · 변이
 *
 * 정상 정답지에 결함을 **하나만** 넣고, 그 결함을 담당하는 스크립트가 FAIL 로 바뀌는지 본다.
 * "통과하는 입력에서 통과" 만 확인하면 검사가 아무 일도 안 해도 테스트는 초록이다.
 * 깨진 입력에서 빨간불이 켜져야 검사가 실제로 작동한다는 증거다.
 *
 * 정답지는 메모리에서 복사해 임시 파일로 쓴다. tests/fixtures/ 는 건드리지 않는다.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  run,
  fixture,
  mutatedSnapshot,
  findNode,
  page,
  parseAuditJson,
  tmpDir,
  writeTmpText,
} from "./helpers.mjs";

const TC = "tokens-components.json";
const R1 = "screens-round1.json";
const RULES = fixture("design-rules.md");
const KEY = fixture("figma-file-key.txt");

// 하네스 기본 면제 + design-rules 가 Height: fixed 로 선언한 이름. 이 밖의 컨테이너를 변이 대상으로 고른다.
const EXEMPT =
  /^(DeviceFrame|Status ?Bar|Home ?Indicator|Safe ?Area|Divider|Spacer|Track|Img\/|Icon\/)/i;
const DECLARED_FIXED =
  /^(Button|IconButton|Input|ProgressBar|SearchBar|Tab|TabBar|AppBar|BottomCTA|LoadingSpinner)/;
const isMutableContainer = (n) =>
  n.type === "FRAME" &&
  n.layout?.vSizing === "HUG" &&
  !EXEMPT.test(n.name) &&
  !DECLARED_FIXED.test(n.name);

describe("변이 · 토큰 계층", () => {
  test("semantic 변수 1개를 값 직결(aliasOf=null)로 → check-snapshot FAIL", () => {
    const snap = mutatedSnapshot(TC, "alias-null", (s) => {
      const v = s.variables.semantic.find((v) => v.aliasOf);
      v.aliasOf = null;
    });
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      snap,
      "--file-key",
      KEY,
      "--stage",
      "components",
    ]);
    assert.equal(r.code, 1);
    assert.match(r.out, /✗ semantic 전부 primitive 참조/);
  });

  test("semantic alias 가 없는 primitive 를 가리키면 → check-snapshot FAIL", () => {
    const snap = mutatedSnapshot(TC, "alias-dangling", (s) => {
      const v = s.variables.semantic.find((v) => v.aliasOf);
      v.aliasOf = "brand-999-없는-토큰";
    });
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      snap,
      "--file-key",
      KEY,
      "--stage",
      "components",
    ]);
    assert.equal(r.code, 1);
    assert.match(r.out, /✗ alias 대상이 primitives 안에 존재/);
  });

  test("화면 fill 1개를 primitives 컬렉션 바인딩으로 → figma-audit token_layering 위반 +1", () => {
    const snap = mutatedSnapshot(R1, "primitive-binding", (s) => {
      const n = findNode(s, "03 Screens", (n) =>
        (n.fills || []).some(
          (f) => f.type === "SOLID" && f.boundVariableCollection === "semantic",
        ),
      );
      n.fills.find(
        (f) => f.boundVariableCollection === "semantic",
      ).boundVariableCollection = "primitives";
    });
    const r = run("figma-audit.mjs", [
      "--snapshot",
      snap,
      "--rules",
      RULES,
      "--output",
      path.join(tmpDir(), "a.json"),
      "--json",
    ]);
    const a = parseAuditJson(r.stdout);
    assert.equal(a.results.token_layering.status, "FAIL");
    assert.equal(a.results.token_layering.count, 1);
    // 다른 규칙의 위반 수는 그대로 (결함 하나만 넣었다)
    assert.equal(a.summary.total_violations, 48);
  });
});

describe("변이 · 레이아웃 거동", () => {
  test("02 Components 컨테이너 1개를 세로 FIXED 로 → check-layout FAIL", () => {
    let hit;
    const snap = mutatedSnapshot(TC, "fixed-height", (s) => {
      hit = findNode(s, "02 Components", isMutableContainer);
      hit.layout.vSizing = "FIXED";
      hit.layout.layoutSizingVertical = "FIXED";
    });
    const r = run("check-layout.mjs", [
      "--snapshot",
      snap,
      "--rules",
      RULES,
      "--page",
      "02 Components",
    ]);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /고정 높이 컨테이너 — 1건/);
    assert.ok(
      r.out.includes(hit.name),
      `위반 노드 이름(${hit.name})이 출력에 있어야 한다`,
    );
  });

  test("03 Screens 컨테이너 1개를 세로 FIXED 로 → figma-audit layout_hug 위반 +1", () => {
    const snap = mutatedSnapshot(R1, "fixed-height", (s) => {
      const n = findNode(s, "03 Screens", isMutableContainer);
      n.layout.vSizing = "FIXED";
      n.layout.layoutSizingVertical = "FIXED";
    });
    const r = run("figma-audit.mjs", [
      "--snapshot",
      snap,
      "--rules",
      RULES,
      "--output",
      path.join(tmpDir(), "b.json"),
      "--json",
    ]);
    const a = parseAuditJson(r.stdout);
    assert.equal(a.results.layout_hug.status, "FAIL");
    assert.equal(a.results.layout_hug.count, 1);
  });

  test("자식을 부모 밖으로 밀어내면 → check-layout 콘텐츠 넘침 FAIL", () => {
    const snap = mutatedSnapshot(TC, "overflow", (s) => {
      // 부모가 있고 크기·위치가 있는 텍스트 노드를 부모 아래로 200px 내린다
      const p = page(s, "02 Components");
      let done = false;
      for (const f of p.frames) {
        const byId = new Map(f.nodes.map((n) => [n.id, n]));
        for (const n of f.nodes) {
          const parent = n.parentId && byId.get(n.parentId);
          if (
            n.type === "TEXT" &&
            parent?.size &&
            n.size &&
            n.position &&
            !EXEMPT.test(parent.name)
          ) {
            n.position.y = (parent.position?.y ?? 0) + parent.size.height + 200;
            done = true;
            break;
          }
        }
        if (done) break;
      }
      if (!done) throw new Error("넘침 변이 대상 없음 — 정답지 확인");
    });
    const r = run("check-layout.mjs", [
      "--snapshot",
      snap,
      "--rules",
      RULES,
      "--page",
      "02 Components",
    ]);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /콘텐츠 넘침 — [1-9]/);
  });
});

describe("변이 · 스키마 · 프로필", () => {
  test("schema_version 1 은 거부", () => {
    const snap = mutatedSnapshot(TC, "schema1", (s) => {
      s.schema_version = 1;
    });
    const r = run("check-snapshot.mjs", [
      "--snapshot",
      snap,
      "--file-key",
      KEY,
      "--stage",
      "tokens",
    ]);
    assert.equal(r.code, 1);
    assert.match(r.out, /✗ schema_version 허용 범위/);
  });

  test("02 Components 를 docs 프로필로 뽑았으면 → check-layout 은 검사를 건너뛰고 경고", () => {
    const snap = mutatedSnapshot(TC, "docs-profile", (s) => {
      page(s, "02 Components").profile = "docs";
    });
    const r = run("check-layout.mjs", [
      "--snapshot",
      snap,
      "--rules",
      RULES,
      "--page",
      "02 Components",
    ]);
    // 설계: check-layout 은 docs 페이지를 경고와 함께 건너뛴다 (exit 0). 프로필 위반 자체는
    // check-snapshot 의 "페이지 프로필 허용" 이 잡는다 (check-scripts.test.mjs 의 FAIL 앵커).
    // 여기서는 "건너뛰었다" 는 사실이 출력에 드러나는지만 본다 — 조용히 통과시키면 안 된다.
    assert.match(r.out, /docs 프로필/);
    assert.match(r.out, /건너뜀/);
    assert.match(
      r.out,
      /대상: \(없음\)/,
      "docs 페이지가 검사 대상에 들어가면 안 된다",
    );
  });

  test("full 이어야 할 03 Screens 를 docs 로 → figma-audit 거부", () => {
    const snap = mutatedSnapshot(R1, "docs-profile", (s) => {
      page(s, "03 Screens").profile = "docs";
    });
    const r = run("figma-audit.mjs", [
      "--snapshot",
      snap,
      "--rules",
      RULES,
      "--output",
      path.join(tmpDir(), "c.json"),
    ]);
    assert.equal(r.code, 1);
    assert.match(r.out, /profile=docs/);
  });
});

describe("변이 · 토큰 문서", () => {
  test("Typography 카드 1개 삭제 → check-token-docs FAIL (카드 = 토큰 목록)", () => {
    const snap = mutatedSnapshot(TC, "missing-card", (s) => {
      const f = page(s, "01 Tokens").frames.find((f) =>
        /Typography/.test(f.name),
      );
      const i = f.nodes.findIndex((n) => n.name?.startsWith("Swatch · "));
      if (i === -1) throw new Error("Swatch 카드 없음 — 정답지 확인");
      f.nodes.splice(i, 1);
    });
    const r = run("check-token-docs.mjs", ["--snapshot", snap]);
    assert.equal(r.code, 1);
    assert.match(r.out, /✗ Typography · 카드 = 토큰 목록/);
  });
});

describe("변이 · 규칙 파일", () => {
  const rulesText = readFileSync(RULES, "utf-8");

  test("status: draft → verify-design-rules · figma-audit 둘 다 거부", () => {
    const p = writeTmpText(
      "design-rules.draft.md",
      rulesText.replace(/^status:\s*confirmed/m, "status: draft"),
    );
    const v = run("verify-design-rules.mjs", ["--path", p, "--strict"]);
    assert.equal(v.code, 1);
    assert.match(v.out, /status: draft/);
    const a = run("figma-audit.mjs", [
      "--snapshot",
      fixture(R1),
      "--rules",
      p,
      "--output",
      path.join(tmpDir(), "d.json"),
    ]);
    assert.equal(a.code, 1);
    assert.match(a.out, /confirmed 상태 아님/);
  });

  test("§I 표의 파일명 1개를 없는 파일로 → check-assets FAIL", () => {
    assert.match(
      rulesText,
      /`character-asset-1\.png`/,
      "정답지 §I 표에 character-asset-1.png 가 있어야 한다",
    );
    const p = writeTmpText(
      "design-rules.missing-file.md",
      rulesText.replace(
        "`character-asset-1.png`",
        "`character-asset-없음.png`",
      ),
    );
    const r = run("check-assets.mjs", ["--rules", p]);
    assert.equal(r.code, 1);
    assert.match(r.out, /✗ 라이브러리 파일 존재/);
    assert.match(r.out, /character-asset-없음\.png/);
  });
});
