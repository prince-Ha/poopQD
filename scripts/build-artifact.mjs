// vite build --mode artifact 결과를 HTML 파일 한 장으로 합쳐서
// Claude 아티팩트(미리보기 페이지)로 올릴 수 있게 만든다.
// 아티팩트는 <!doctype>/<head>/<body>를 자동으로 감싸 주므로 내용만 쓴다.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const outDir = 'dist-artifact';
const assetsDir = join(outDir, 'assets');
const files = readdirSync(assetsDir);
const jsFile = files.find((f) => f.endsWith('.js'));
const cssFile = files.find((f) => f.endsWith('.css'));
if (!jsFile || !cssFile) throw new Error('빌드 결과에서 JS/CSS 파일을 찾지 못했어요');

const indexHtml = readFileSync(join(outDir, 'index.html'), 'utf8');
const fontLinks = indexHtml.match(/<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>/g) ?? [];

// 인라인 <script> 안에서 문자열 '</script'가 태그를 닫아 버리지 않게
const js = readFileSync(join(assetsDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(assetsDir, cssFile), 'utf8');

const html = `<title>똥 피하기 퀴즈</title>
${fontLinks.join('\n')}
<style>${css}</style>
<style>
  /* 미리보기 틀의 기본 글꼴·배경보다 게임 스타일이 우선하도록 */
  html, body { height: 100%; }
  body {
    margin: 0;
    background: #ffffff;
    color: #18181b;
    font-family: 'Gaegu', 'Jua', 'Noto Sans KR', sans-serif;
    overflow: hidden;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }
</style>
<div id="root"></div>
<script type="module">${js}</script>
`;

const outFile = join(outDir, 'poop-quiz.html');
writeFileSync(outFile, html);
console.log(`${outFile} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
