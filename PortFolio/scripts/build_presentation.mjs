// artifact-tool을 불러올 수 있는 Node.js로 실행. 본문은 portfolio.json에서 읽는다.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';
const pf=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const c=JSON.parse(await fs.readFile(path.join(pf,'shared/content/portfolio.json'),'utf8'));
const qa=path.join(pf,'scripts/.qa/presentation');
await fs.mkdir(qa,{recursive:true});
const p=Presentation.create({slideSize:{width:1280,height:720}});
const ink='#101C2B',muted='#5B6678',copper='#995023',paper='#F7F4EE';
function text(s,t,x,y,w,h,size=24,color=ink,bold=false){
 const shape=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 shape.text=t;
 shape.text.style={fontSize:size,typeface:'Malgun Gothic',color,bold,wrap:'square',autoFit:'none',insets:0,verticalAlignment:'top'};
 return shape;
}
async function image(s,src,x=712,y=190,w=500,h=380){
 const b=await fs.readFile(path.join(pf,'frontend/public',src));
 s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:src.endsWith('.png')?'image/png':'image/jpeg',alt:src,fit:'contain',position:{left:x,top:y,width:w,height:h}});
}
function slide(kicker,title,notes='PortFolio/shared/content/portfolio.json'){
 const s=p.slides.add();s.background.fill=paper;
 text(s,kicker,64,40,1100,30,15,copper,true);
 text(s,title,64,90,1140,88,39,ink,true);
 text(s,`CodiComperChat / ${c.site.updatedAt}`,64,669,1000,25,13,muted);
 text(s,String(p.slides.items.length).padStart(2,'0'),1160,669,60,25,13,muted);
 s.speakerNotes.text=`근거: ${notes}\n구현과 운영 상태는 2026-11-11 저장소 기록 기준. 과거 측정은 평균이나 개선 효과를 의미하지 않는다.`;
 return s;
}
function lines(s,items,{x=64,y=215,w=600,size=23,gap=112}={}){
 items.forEach((v,i)=>text(s,v,x,y+i*gap,w,gap-15,size));
}
let s=slide('INDEPENDENT DEVELOPER','코디컴퍼챗 개발 포트폴리오');
text(s,'기억과 관계가 쌓이는\n캐릭터 캠페인',64,214,625,180,48,ink,true);
text(s,c.site.author,64,440,590,70,22,muted);
text(s,c.site.period,64,520,590,58,18,muted);
await image(s,'shots/home-light.jpg');
s=slide('PRODUCT','캠페인 상태와 캐릭터의 기억');
lines(s,[c.project.oneLine,c.project.answer],{w:1100,gap:175,size:28});
text(s,'비밀은 모델에 보내지 않고, 달성 판정은 실제 대사의 인용을 코드로 대조합니다.',64,555,1100,80,24,copper);
const picks={frontend:{img:'chat.jpg',ids:['features']},console:{img:'console-dashboard.jpg',ids:['features']},backend:{img:'chat-turn.png',ids:['features']},ai:{img:'webtoon.jpg',ids:['features']}};
for(const [slug,pick] of Object.entries(picks)){
 const page=c.pages[slug];s=slide(page.kicker,page.title);
 text(s,page.summary,64,196,600,145,22,muted);
 const sec=page.sections.find(s=>s.id===pick.ids[0]);
 const items=[...(sec.bullets||[]),...(sec.table||[]).map(([a,b])=>`${a}: ${b}`)].slice(0,3);
 lines(s,items,{y:365,w:600,size:20,gap:85});
 await image(s,`shots/${pick.img}`);
}
s=slide('RECENT FEATURES','대화 편집과 직접 적는 장기 기억','docs/AGENT_HANDOVER.md 2026-11-08');
text(s,c.pages.updates.sections[0].body,64,210,600,190,25);
lines(s,c.pages.updates.sections[0].bullets,{y:444,w:600,size:22,gap:90});
await image(s,'shots/story.jpg');
s=slide('STREAMING','1대1 답변의 실시간 전달','docs/trainings/oracle-deploy-latency.md 2026-11-11');
text(s,c.pages.updates.sections[1].body,64,210,650,220,26);
lines(s,c.pages.updates.sections[1].bullets,{y:445,w:650,size:22,gap:90});
await image(s,'shots/mobile-chat.jpg',810,187,290,430);
s=slide('INCIDENT AND RESPONSE','호스팅 지연과 CPU 예비 경로','docs/trainings/oracle-deploy-latency.md 2026-11-11');
text(s,'배포에서 한 턴 약 3분 53초라는 사용자 보고',64,202,1100,60,32,copper,true);
lines(s,['호스팅 응답을 SSE로 전환하고 조각 사이 40초와 전체 150초 제한을 분리했습니다.','CPU 예비는 최근 메시지 8개와 출력 320토큰으로 줄이고 배경 작업은 예비 전환하지 않습니다.','서버 로그로 원인을 확정하거나 개선 뒤 운영 시간을 재측정하지 못했습니다. api·ai 재배포가 필요합니다.'],{y:300,w:1100,size:26,gap:108});
for(const [src,title,notes] of [['framework-product.png','제품 프레임워크의 역할과 경계','apps/web · console · apps/api · services/ai'],['framework-portfolio.png','포트폴리오의 프레임워크와 콘텐츠 정본','PortFolio/frontend · server/backend · server/ai_services · scripts']]){
 s=slide('FRAMEWORK NOTES',title,notes);
 await image(s,`shots/${src}`,240,182,800,470);
}
s=slide('EVALUATION','작은 모델을 실제로 평가한 기록','docs/trainings/narration-and-reward.md · docs/plan/TESTING.md');
lines(s,['나레이션 7/12 → 48/48. 보상 장면 2/8 → 20/20. 2026-11-06 e4b 평가 결과입니다.','조건 판단을 코드로 옮기고 모델에는 선택된 장면과 형식 지시를 전달했습니다.','11월 11일 기록은 API 249개·AI 단위 92개입니다. 최근 전체 E2E에는 미해결 실패 3건이 있습니다.','호스팅 31B 품질과 최근 프롬프트 변경은 같은 조건으로 다시 평가해야 합니다.'],{w:1100,size:27,gap:103});
s=slide('OPERATIONS','코드 구현과 운영 반영 현황','docs/STATUS.md · docs/AGENT_HANDOVER.md · docs/web_management/oracle-backend.md');
lines(s,['제품 웹은 Vercel, API·DB·대화 AI는 Oracle ARM 서버에 배포했습니다.','포트폴리오 Rails·Flask는 11월 8일 배포 기록이 있습니다. 제품과 CPU Ollama를 공유합니다.','11월 11일 호스팅 스트리밍과 장애 대응은 코드 병합 후 서버 반영을 기다립니다.','GPU 그림 엔진·SMTP·운영 콘솔 연결·프리미엄 키는 준비가 남아 있습니다.'],{w:1100,size:27,gap:105});
s=slide('DOCUMENTS','한 정본에서 사이트와 파일을 갱신');
lines(s,['portfolio.json에서 사이트·API 데이터·RAG 자료·Word·PDF·발표자료를 생성합니다.','기획 스프레드시트 9개 시트와 ERD 원본은 각각 뷰어 데이터로 변환합니다.','프레임워크 소개와 개발 기록 페이지에서 선택 이유·실제 코드 위치·남은 한계를 함께 읽을 수 있습니다.'],{w:1100,size:28,gap:125});
s=slide('NEXT STEPS','공개를 위해 남은 검증','docs/TASKS.md · docs/AGENT_HANDOVER.md');
lines(s,c.pages.future.sections[0].bullets.slice(0,4),{w:1100,size:28,gap:105});
s=slide('PROJECT LINKS','프로젝트와 포트폴리오');
text(s,c.site.service,64,230,1150,85,32,copper,true);
text(s,'https://codicomperchat-portfolio.vercel.app',64,355,1150,85,29);
text(s,c.site.repo,64,475,1150,85,29);
for(let i=0;i<p.slides.items.length;i++){
 const png=await p.export({slide:p.slides.items[i],format:'png',scale:1});
 await fs.writeFile(path.join(qa,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
const candidate=path.join(qa,'candidate.pptx');
await(await PresentationFile.exportPptx(p)).save(candidate);
// 스킬 검증 도구는 환경변수로 주입한다. 일반 환경에서도 원본 정본으로 재생성 가능하다.
if(process.env.PRESENTATION_SKILL_DIR){
 const sd=process.env.PRESENTATION_SKILL_DIR;
 const {finalizePresentation}=await import(pathToFileURL(path.join(sd,'container_tools/artifact_tool_utils.mjs')).href);
 await fs.mkdir(path.join(qa,'export'),{recursive:true});
 const final=path.join(qa,'export',`final-${Date.now()}.pptx`);
 await finalizePresentation({workspaceDir:pf,candidatePath:candidate,finalPath:final,pythonExecutable:process.env.ARTIFACT_PYTHON,integrityValidatorPath:path.join(sd,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(sd,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],fontPolicy:{basis:'design',families:['Malgun Gothic']},verifyArtifactToolImport:true,receiptPath:path.join(qa,`validation-${Date.now()}.json`)});
 await fs.copyFile(final,path.join(pf,'PortFile/CodiComperChat_Portfolio.pptx'));
}else await fs.copyFile(candidate,path.join(pf,'PortFile/CodiComperChat_Portfolio.pptx'));
await fs.copyFile(path.join(pf,'PortFile/CodiComperChat_Portfolio.pptx'),path.join(pf,'frontend/public/files/CodiComperChat_Portfolio.pptx'));
console.log(`발표자료 ${p.slides.items.length}장 생성·렌더링`);
