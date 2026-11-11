// 기존 9개 시트와 수식·간트 구조를 유지하고 최신 구현 기록을 덧붙인다.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SpreadsheetFile } from '@oai/artifact-tool';
const pf = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(pf,'PortFile');
const filename = (await fs.readdir(dir)).find(x=>x.endsWith('.xlsx'));
const wb = await SpreadsheetFile.importXlsx(await fs.readFile(path.join(dir,filename)));
const overview = wb.worksheets.getItem('프로젝트_총기획');
overview.getRange('A2').values = [['프로젝트_총기획 · 갱신 2026-11-11 · 근거 docs/AGENT_HANDOVER.md · TESTING.md · STATUS.md. 스키마·일정 원본은 각 시트의 기준일 유지']];
overview.getRange('C12').values = [['웹 Vercel·API/DB/AI Oracle. 11월 11일 스트리밍·장애 대응 코드는 서버 재배포 대기. 포트폴리오 Rails·Flask는 11월 8일 배포 기록.']];
overview.getRange('C32').values = [['2026-11-11 기록: API 249개 · AI 단위 92개. E2E 사례 123개, 최근 실행 미해결 3건. e4b 실제 모델 평가는 11월 6일 결과, 31B 재평가 전.']];
overview.getRange('C52').values = [['기본은 로컬 e4b, 강화·배경 호출은 설정에 따라 NVIDIA 호스팅 API 사용. 국외 이전 표 반영·약관 검토 필요(U11·U12).']];
overview.getRange('A67:C71').copyFrom(overview.getRange('A60:C64'),'all');
// 기존 행의 서식을 복사한 뒤 이번 기록으로 값을 채운다.
overview.getRange('A67:C71').values = [
 ['2026-11-11 갱신','장기 기억','직접 기억 추가·삭제, notice-facts 자동 수집. 11월 8일 코드.'],
 ['2026-11-11 갱신','대화 도구','마지막 대사 수정·삭제·변경사항 추천, 현재 시간·장소 표시. 운영 적용 별도.'],
 ['2026-11-11 갱신','스트리밍','1:1 웹소켓 + 호스팅 SSE. api·ai 재배포 대기, 개선 후 운영 속도 미측정.'],
 ['2026-11-11 갱신','예비·장애','최근 메시지 8개·출력 320토큰, 배경 예비 금지, 호스팅 접근 오류 로그.'],
 ['2026-11-11 갱신','포트폴리오','개발 기록·프레임워크 전용 페이지, 구조 이미지, 문서·RAG 자료 동기화.']
];
overview.getRange('A67:C71').format.rowHeight=45;
overview.getRange('A67:C71').format.wrapText=true;
overview.getRange('A67:C71').format.font={name:'Malgun Gothic',size:10};
const features = wb.worksheets.getItem('기능_설계');
features.getRange('A113:I116').copyFrom(features.getRange('A106:I109'),'all');
features.getRange('A113:I116').values=[
 ['F11-01','대화','1:1 토큰 스트리밍','캐릭터 대화','/infer/stream · /ws/chat','apps/api/src · services/ai','로컬·호스팅 토큰 전달, 최종 교체','구현','2026-11-11 서버 반영 대기'],
 ['F11-02','대화','마지막 대사 편집','캐릭터 대화','메시지 수정·삭제·추천','apps/api/src/character-chat','최근 한 줄만 수정·삭제·다시 쓰기','구현','2026-11-08, 운영 적용 별도'],
 ['F11-03','기억','직접 기억과 사실 수집','기억 화면','/notice-facts','services/ai/app','기억 추가·삭제, 자동 사실 수집','구현','2026-11-08'],
 ['F11-04','운영','호스팅 지연·장애 대응','서버','호스팅 SSE·CPU 예비','services/ai/app/services/llm.py','조각/전체 제한, 예비 축소, 배경 분리','구현','2026-11-11 서버 반영 대기']
];
features.getRange('A113:I116').format.wrapText=true;
features.getRange('A113:I116').format.rowHeight=65;
const future=wb.worksheets.getItem('향후_계획');
future.getRange('A52:I53').copyFrom(future.getRange('A48:I49'),'all');
future.getRange('A52:I53').values=[
 ['U13','운영 반영','api·ai 최신 코드 재배포','스트리밍·호스팅 장애 고침은 병합됨. 운영 성능 미측정','서버 접근','사용자','배포 후 1:1 스트리밍·로그·응답 시간 확인','미완료','docs/TASKS.md · docs/AGENT_HANDOVER.md'],
 ['E2E-3','품질','기존 E2E 실패 3건 해결','월드 빈 턴 상태 코드·모델 이름·푸터 약관 링크','제품 코드 확인','개발','기준 변경 없이 실제 회귀 확인','미완료','docs/AGENT_HANDOVER.md 2026-11-11']
];
future.getRange('A52:I53').format.wrapText=true;
future.getRange('A52:I53').format.rowHeight=92;
future.getRange('A52:I53').format.verticalAlignment='center';
future.getRange('A52:I53').format.font={name:'Malgun Gothic',size:10};
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:"'프로젝트_총기획'!A67:C71",include:'values,formulas',tableMaxRows:5,tableMaxCols:3,maxChars:1800})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#NULL!',options:{useRegex:true,maxResults:10},maxChars:1600})).ndjson);
const qa=path.join(pf,'scripts/.qa');
await fs.mkdir(qa,{recursive:true});
for(const [sheetName,range,name] of [['프로젝트_총기획','A67:C71','workbook-updates'],['기능_설계','A113:I116','workbook-features'],['향후_계획','A52:I53','workbook-next']]){
 const png=await wb.render({sheetName,range,scale:1.3});
 await fs.writeFile(path.join(qa,`${name}.png`),new Uint8Array(await png.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(dir,filename));
await fs.rename(path.join(dir,filename+'.inspect.ndjson'),path.join(qa,'workbook-inspect.ndjson')).catch(error=>{if(error.code!=='ENOENT')throw error;});
console.log('기존 9개 시트 유지, 최신 기록 11행 추가');
