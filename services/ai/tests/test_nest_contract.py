"""Nest가 부르는 FastAPI 경로가 빠지거나, 그 요청이 500대로 죽지 않는지 본다.

규율:
- 웹은 이 서비스를 부르지 않는다. 호출은 apps/api의 postToAi · getFromAi · streamFromAi · vector-rag 뿐이다.
- 그 경로가 앱에 없거나, 스키마에 맞는 요청이 500대면 이 시험이 실패한다.
- routes 아래 파일에 적은 경로는 기능 라우터에 올라가 있어야 한다.
"""

import json
import os
import re
import tempfile
import unittest
from pathlib import Path

# 앱을 불러오기 전에 고정한다. .env는 이미 있는 값을 덮지 않는다.
os.environ["LLM_FAKE"] = "1"
os.environ["IMAGE_FAKE"] = "1"
os.environ["CHROMA_DIR"] = tempfile.mkdtemp(prefix="chroma-contract-")
os.environ["AI_SERVICE_TOKEN"] = "t" * 32

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

API_SRC = Path(__file__).resolve().parents[3] / "apps" / "api" / "src"
ROUTES = Path(__file__).resolve().parents[1] / "app" / "routes"
TOKEN = os.environ["AI_SERVICE_TOKEN"]
# 1x1 PNG. 검수 가짜 경로는 바이트만 본다.
PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
CALL = re.compile(
    r"\b(?:postToAi|getFromAi|streamFromAi)\b(?:\s*<[^>]{0,300}>)?\s*\(\s*(?:\n\s*)?['\"](/[^'\"]+)['\"]",
    re.M,
)
RAG_POST = re.compile(r"\bpost\(\s*['\"](/[^'\"]+)['\"]")
DECORATOR = re.compile(r"@router\.(get|post|put|delete)\(\s*['\"]([^'\"]+)['\"]")


def nest_calls() -> set[tuple[str, str]]:
    found: set[tuple[str, str]] = set()
    for path in API_SRC.rglob("*.ts"):
        if path.name.endswith(".spec.ts"):
            continue
        text = path.read_text(encoding="utf-8")
        for match in CALL.finditer(text):
            name = match.group(0)
            method = "GET" if name.startswith("getFromAi") or "\ngetFromAi" in name else "POST"
            if "getFromAi" in name[:20]:
                method = "GET"
            found.add((method, match.group(1)))
        if path.name == "vector-rag.ts":
            for match in RAG_POST.finditer(text):
                found.add(("POST", match.group(1)))
    return found


def declared_routes() -> set[tuple[str, str]]:
    found: set[tuple[str, str]] = set()
    for path in ROUTES.rglob("*.py"):
        if path.name == "__init__.py":
            continue
        text = path.read_text(encoding="utf-8")
        for method, route in DECORATOR.findall(text):
            found.add((method.upper(), route))
    return found


def mounted_routes() -> set[tuple[str, str]]:
    # include_router 결과는 app.routes에 경로가 안 드러난다. OpenAPI가 실제로 열린 경로다.
    found: set[tuple[str, str]] = set()
    for path, methods in app.openapi()["paths"].items():
        for method in methods:
            if method in {"get", "post", "put", "delete"}:
                found.add((method.upper(), path))
    return found


def _example(schema: dict, components: dict, depth: int = 0):
    if depth > 10:
        return None
    if "$ref" in schema:
        name = schema["$ref"].rsplit("/", 1)[-1]
        return _example(components[name], components, depth + 1)
    for key in ("allOf",):
        if key in schema:
            merged: dict = {}
            for part in schema[key]:
                value = _example(part, components, depth + 1)
                if isinstance(value, dict):
                    merged.update(value)
            return merged
    for key in ("anyOf", "oneOf"):
        if key in schema:
            for part in schema[key]:
                if part.get("type") == "null":
                    continue
                return _example(part, components, depth + 1)
            return None
    if "enum" in schema:
        return schema["enum"][0]
    kind = schema.get("type")
    if kind == "string":
        if schema.get("format") == "byte" or schema.get("maxLength", 0) > 10_000:
            return PNG
        need = max(1, int(schema.get("minLength") or 1))
        return "가" * need
    if kind in {"integer", "number"}:
        low = schema.get("minimum", 0)
        high = schema.get("maximum")
        value = low if isinstance(low, (int, float)) else 0
        if isinstance(high, (int, float)) and value > high:
            value = high
        return int(value) if kind == "integer" else value
    if kind == "boolean":
        return False
    if kind == "array":
        count = max(1, int(schema.get("minItems") or 1)) if schema.get("minItems") else 1
        item = schema.get("items") or {}
        return [_example(item, components, depth + 1) for _ in range(count)]
    props = schema.get("properties") or {}
    required = set(schema.get("required") or [])
    if kind == "object" or props or required:
        body = {}
        keys = required or set(props)
        for name in keys:
            if name not in props:
                continue
            if name == "image":
                body[name] = PNG
                continue
            body[name] = _example(props[name], components, depth + 1)
        return body
    return "가"


def _body(method: str, path: str, spec: dict) -> dict | None:
    if method == "GET":
        return None
    operation = spec["paths"][path][method.lower()]
    content = (operation.get("requestBody") or {}).get("content") or {}
    json_body = content.get("application/json")
    if not json_body:
        return {}
    body = _example(json_body["schema"], spec.get("components", {}).get("schemas", {}))
    if path == "/webtoon/plan" and isinstance(body, dict):
        # 가짜 모델이 돌려주는 이름과 같아야 외모 고정이 된다. 명단이 비면 502다.
        body["cast"] = [{"name": "민준", "role": "character"}]
        body["panels"] = 2
    if path == "/rag/personal" and isinstance(body, dict):
        body["items"] = [{"id": "m1", "text": "민준은 새벽 달리기를 한다"}]
    if path == "/webtoon/panel" and isinstance(body, dict):
        # 콘티가 넘기는 컷 설계. 사람이 없으면 400이라 연결 시험이 핸들러까지 못 간다.
        body["plan"] = {
            "people": [{"name": "가", "gender": "female", "look": "black hair", "expression": "smile", "pose": "standing"}],
            "setting": "room",
            "action": "standing",
            "lighting": "soft",
            "shot": "upper body",
            "rating": "safe",
        }
    return body if isinstance(body, dict) else {}


class NestContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.client.__enter__()
        cls.spec = app.openapi()

    @classmethod
    def tearDownClass(cls):
        cls.client.__exit__(None, None, None)

    def test_route_files_are_mounted(self):
        missing = sorted(declared_routes() - mounted_routes())
        self.assertEqual(missing, [], "라우트 파일에만 있고 앱에 없는 경로")

    def test_nest_paths_are_mounted(self):
        missing = sorted(nest_calls() - mounted_routes())
        self.assertEqual(missing, [], "Nest가 부르는데 FastAPI에 없는 경로")

    def test_nest_calls_do_not_500(self):
        failures = []
        for method, path in sorted(nest_calls()):
            body = _body(method, path, self.spec)
            headers = {"X-AI-Token": TOKEN, "X-AI-Priority": "foreground"}
            if method == "GET":
                res = self.client.get(path, headers=headers)
            else:
                res = self.client.post(path, headers=headers, json=body)
            detail = res.text[:400]
            if res.status_code >= 400:
                failures.append(f"{method} {path} -> {res.status_code} {detail}")
                continue
            if path.endswith("/stream"):
                for line in res.text.splitlines():
                    if not line.strip():
                        continue
                    parsed = json.loads(line)
                    if "error" in parsed:
                        failures.append(f"{method} {path} stream {parsed}")
        self.assertEqual(failures, [])


if __name__ == "__main__":
    unittest.main()
