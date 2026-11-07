// 콘텐츠 정본(PortFolio/shared/content/portfolio.json의 복사본)을 타입과 함께 읽는다.
// build_data.py가 src/data/ 로 복사한다. 정적 빌드라 화면은 Rails 없이도 그려지고, 챗봇·검색만 Rails를 부른다.
import portfolio from "../data/portfolio.json";
import sheets from "../data/sheets.json";
import erd from "../data/erd.json";

export type Image = { src: string; caption: string };
export type Section = { id: string; title: string; body?: string; bullets?: string[]; table?: string[][]; images?: Image[] };
export type Page = { title: string; kicker: string; summary: string; sections: Section[] };
export type TocItem = { slug: string; no: string; title: string; sub: string };

export const site = portfolio.site;
export const project = portfolio.project;
export const toc = portfolio.toc as TocItem[];
export const pages = portfolio.pages as Record<string, Page>;
export const sheetList = sheets as Sheet[];
export const erdData = erd as Erd;

export type Sheet = {
  id: string;
  name: string;
  title: string;
  meta: string[];
  kind: "table" | "gantt" | "text";
  header?: string[];
  rows?: string[][];
  bars?: { start: string; end: string }[];
  lines?: string[];
};

export type Erd = {
  counts: { tables: number; relations: number };
  groups: { key: string; title: string; mermaid: string }[];
  tables: { name: string; group: string; columns: { name: string; type: string; keys: string[]; note: string }[] }[];
  relations: { parent: string; child: string; card: string; fk: string; onDelete: string }[];
};

// 배포 주소: 빌드 환경변수 PUBLIC_API_BASE (예: https://portfolio-api.example.com). 비우면 로컬 Rails
export const API_BASE = (import.meta.env.PUBLIC_API_BASE as string | undefined) || "http://localhost:3000";

export const detailPages = ["frontend", "console", "backend", "ai", "future"] as const;
