/**
 * パリティテスト: サイト版と VS Code 拡張 comment-remover v0.1.3 の
 * 出力が完全に一致することを検証する。
 *
 * 使い方:
 *   node test/parity.test.mjs [extension.js のパス]
 * デフォルトではインストール済み拡張を参照する。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

let failures = 0;
let checks = 0;

function fail(msg) {
  failures++;
  console.error("FAIL: " + msg);
}

function ok() {
  checks++;
}

/* ---------- 1. サイト版のロジックを取り出す ---------- */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const start = html.indexOf("/* ============ PURE-LOGIC-START ============ */");
const end = html.indexOf("/* ============ PURE-LOGIC-END ============ */");
if (start < 0 || end < 0) {
  console.error("index.html に PURE-LOGIC マーカーが見つかりません");
  process.exit(1);
}
const pureSrc = html.slice(start, end);
const mine = new Function(
  pureSrc + "\nreturn { analyze: analyze, removeCommentsRanges: removeCommentsRanges };"
)();

/* ---------- 2. 旧拡張の removeComments を取り出す ---------- */
const extPath =
  process.argv[2] ||
  "C:\\Users\\favma\\.vscode\\extensions\\undefined_publisher.comment-remover-0.1.3\\extension.js";
if (!fs.existsSync(extPath)) {
  console.log("SKIP: 元の extension.js が見つかりません: " + extPath);
  console.log("      パスを引数で指定してください。");
  process.exit(0);
}
const extSrc = fs.readFileSync(extPath, "utf8");
const s2 = extSrc.indexOf("function removeComments");
const e2 = extSrc.indexOf("function activate");
if (s2 < 0 || e2 < 0) {
  console.error("extension.js から removeComments を抽出できません");
  process.exit(1);
}
const origRemove = new Function(extSrc.slice(s2, e2) + "\nreturn removeComments;")();

/* 旧拡張のフルフロー（activate() 内と同じ処理）を行で再現 */
function origFlow(fullText, keepHeader) {
  const headerEndMarker = "// ==/" + "UserScript==";
  const headerRegex = new RegExp(`^${headerEndMarker}\\s*[\\r\\n]`, "m");
  let headerText = "";
  let bodyText = fullText;
  if (keepHeader) {
    const match = fullText.match(headerRegex);
    if (match) {
      const splitIndex = match.index + match[0].length;
      headerText = fullText.substring(0, splitIndex);
      bodyText = fullText.substring(splitIndex);
    }
  }
  let cleanBody = origRemove(bodyText);
  cleanBody = cleanBody.replace(/^[ \t]*[\r\n]/gm, "");
  if (headerText && !headerText.endsWith("\n")) headerText += "\n";
  return headerText + cleanBody;
}

/* ---------- 3. 静的コーパス ---------- */
const cases = [
  "const a = 1; // one\n",
  'const u = "http://x // y";\nconst v = \'/* not comment */\';\n',
  "/* block */\n// line\nlet x = 1;\n",
  "const re = /ab\\/\\/c/g; // note\nconst d = a / b; // div\n",
  "let t = `// not ${1 /* hmm */}`;\n/* real */\n",
  "// ==UserScript==\n// @name x\n// ==/UserScript==\n// gone\nconst x = 1; // y\n",
  "// ==UserScript==\r\n// @name x\r\n// ==/UserScript==\r\n/* gone */\r\nconst x = 2;\r\n",
  "no comments here",
  "//",
  "/*",
  "/**/",
  "x = (/re/).test(s) // c\n",
  "url: 'a://b' // c\n",
  "\n\n\n// x\n\n\n",
  "const s = `a${{ x: 1 }.x + \"}\"}`; // t\n",
  "if (a) { /* inline */ b(); } // tail\nelse { c(); }\n",
];

function checkOne(label, text, keepHeader) {
  const expected = origFlow(text, keepHeader);
  const res = mine.analyze(text, keepHeader);
  if (res.text !== expected) {
    fail(
      label +
        " (keepHeader=" + keepHeader + ")\n--- expected ---\n" +
        JSON.stringify(expected.slice(0, 300)) +
        "\n--- got ---\n" +
        JSON.stringify(res.text.slice(0, 300))
    );
    return;
  }
  /* 範囲の健全性チェック: 元テキスト上で // か /* から始まること */
  for (const [rs, re] of res.ranges) {
    if (rs < 0 || re > text.length || re <= rs) {
      fail(label + ": 不正な範囲 [" + rs + ", " + re + ")");
      return;
    }
    const slice = text.slice(rs, re);
    if (!(slice.startsWith("//") || slice.startsWith("/*"))) {
      fail(label + ": 範囲がコメント開始位置ではない: " + JSON.stringify(slice.slice(0, 40)));
      return;
    }
  }
  ok();
}

for (let c = 0; c < cases.length; c++) {
  checkOne("case#" + c, cases[c], true);
  checkOne("case#" + c, cases[c], false);
}

/* ---------- 4. 乱数ファズ ---------- */
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const tokens = [
  "a", "bc", " ", "\n", "\r\n", "\t",
  "//c\n", "/*x*/", "/**/", "/*\n*/",
  '"//"', "'/*'", '"a\\"b"', "'a\\'b'",
  "`t${1}`", "`a`", "`x${ `y` }z`",
  "=", "(", ")", "{", "}", "[", "]", ";", ",", ":", "?", "!",
  "&", "|", "^", "~", "/", "//", "/*", "*", "*/",
  "/re/g", "/a[b/c]d/gi", "1", "0",
  "// ==UserScript==", "// @name t", "// ==/UserScript==",
  "https://", ".", "+", "-", "\n\n",
];

for (let n = 0; n < 3000; n++) {
  const count = 1 + Math.floor(rand() * 70);
  let s = "";
  for (let t = 0; t < count; t++) {
    s += tokens[Math.floor(rand() * tokens.length)];
  }
  const kh = rand() < 0.5;
  const expected = origFlow(s, kh);
  const res = mine.analyze(s, kh);
  if (res.text !== expected) {
    fail(
      "fuzz#" + n + " (keepHeader=" + kh + ")\n--- input ---\n" +
      JSON.stringify(s.slice(0, 300)) +
      "\n--- expected ---\n" + JSON.stringify(expected.slice(0, 300)) +
      "\n--- got ---\n" + JSON.stringify(res.text.slice(0, 300))
    );
    if (failures > 5) break;
  } else {
    ok();
  }
}

/* ---------- 結果 ---------- */
if (failures === 0) {
  console.log("PASS: " + checks.toLocaleString() + " checks, 出力は拡張 v0.1.3 と完全一致");
  process.exit(0);
} else {
  console.error(failures + " failures / " + checks + " checks");
  process.exit(1);
}
