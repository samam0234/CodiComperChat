import { proClickOpen } from './pro-click.js';

describe('눌러서 프로로 바꾸기', () => {
  it('개발 환경은 기본으로 열리고, 운영은 on일 때만 열린다', () => {
    expect(proClickOpen({}, null)).toBe(true);
    expect(proClickOpen({ NODE_ENV: 'production' }, null)).toBe(false);
    expect(proClickOpen({ NODE_ENV: 'production', PRO_CLICK: 'on' }, null)).toBe(true);
  });

  it('off면 어디서든 닫힌다', () => {
    expect(proClickOpen({ PRO_CLICK: 'off' }, 'mock')).toBe(false);
    expect(proClickOpen({ NODE_ENV: 'production', PRO_CLICK: 'off' }, null)).toBe(false);
  });

  it('토스 결제가 켜져 있으면 on이어도 닫힌다', () => {
    expect(proClickOpen({ PRO_CLICK: 'on' }, 'toss')).toBe(false);
    expect(proClickOpen({}, 'toss')).toBe(false);
  });
});
