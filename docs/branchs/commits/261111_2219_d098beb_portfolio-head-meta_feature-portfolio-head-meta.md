# 빠져 있던 head 태그와 404·robots·sitemap을 채우다

| 항목 | 내용 |
|------|------|
| Subject | `fix(portfolio): 빠져 있던 head 태그와 404·robots·sitemap을 채우다` |
| Full SHA | `d098beb9168ad83934273d20d8b65c834be822ba` |
| Short SHA | `d098beb` |
| Branch | `feature/portfolio-head-meta` |
| Parent | `9848ea3` |
| Date | 2026-11-11 22:19:28 +0900 |

## 주 내용

- 포트폴리오 사이트의 `<head>`에 빠져 있던 태그를 채웠다: `canonical`, `og:type`·`og:url`·`og:site_name`·`og:locale`·`og:image:alt`, `twitter:card`(큰 이미지)와 제목·설명·이미지, `theme-color`(밝은·어두운), `color-scheme`, `author`, `robots`. 주소는 `astro.config.mjs`의 `site`로 한 곳에서 만든다(표지 이미지 주소도 하드코딩에서 바꿈).
- 없던 `404` 페이지, `robots.txt`, `sitemap.xml`(목차에서 만든다)을 더했다.
- `astro build` 13페이지 통과, 만들어진 HTML에서 태그와 sitemap을 확인했다.

## 주의

- 본문·화면 구조는 바꾸지 않았다. 배포는 Git 연동이 없어 직접 다시 올려야 반영된다.
