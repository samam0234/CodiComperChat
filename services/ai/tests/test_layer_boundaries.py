"""라우트는 오케스트레이션만, 서비스는 라우트를 부르지 않는지 본다."""

import ast
import unittest
from pathlib import Path

APP = Path(__file__).resolve().parents[1] / "app"

# 한 층이 알아도 되는 다른 층. 여기 없으면 그 층은 그 폴더를 부르면 안 된다.
ALLOWED = {
    "routes": {"orchestration", "schemas"},
    "orchestration": {"services", "modules", "repositories", "schemas"},
    "services": {"services", "modules", "repositories", "schemas"},
    "modules": {"modules", "schemas"},
    "repositories": {"modules", "repositories", "schemas"},
}


def _imports(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    found: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module and node.module.startswith("app."):
            found.add(node.module.split(".")[1])
        elif isinstance(node, ast.Import):
            for name in node.names:
                if name.name.startswith("app."):
                    found.add(name.name.split(".")[1])
    return found


class LayerBoundaryTest(unittest.TestCase):
    def test_layers_only_call_the_next_layer(self) -> None:
        leaks = []
        shared = {"internal_auth", "request_priority"}
        for layer, allowed in ALLOWED.items():
            root = APP / layer
            for path in root.rglob("*.py"):
                outside = _imports(path) - allowed - {layer} - shared
                for target in sorted(outside):
                    if target in ALLOWED:
                        leaks.append(f"{path.relative_to(APP)} -> app.{target}")
        self.assertEqual(leaks, [])


if __name__ == "__main__":
    unittest.main()
