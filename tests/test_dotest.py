"""
Tests for the dotest / qa-vision pipeline.

Tests cover:
- pageRegistry.ts parsing
- qa-vision.py core logic
- Proto states page structure
"""

import json
import os
import re
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Ensure workspace root is on path
WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, WORKSPACE)

# Import qa_vision module (file has hyphen, use importlib)
import importlib.util
_spec = importlib.util.spec_from_file_location(
    "qa_vision", os.path.join(WORKSPACE, "qa-vision.py")
)
_qa_vision = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_qa_vision)

parse_page_registry_ts = _qa_vision.parse_page_registry_ts
PAGE_REGISTRY = _qa_vision.PAGE_REGISTRY
run_page_checks = _qa_vision.run_page_checks


class TestPageRegistryTs(unittest.TestCase):
    """Test parsing of constants/pageRegistry.ts."""

    def test_registry_file_exists(self):
        """pageRegistry.ts should exist at constants/pageRegistry.ts."""
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        self.assertTrue(os.path.exists(path), f"Missing {path}")

    def test_parse_actual_registry(self):
        """Parsing the actual pageRegistry.ts should return entries."""
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        pages = parse_page_registry_ts(path)
        self.assertGreater(len(pages), 0, "Should find at least one page entry")

    def test_all_entries_have_required_fields(self):
        """Each parsed entry must have id, title, route, stateCount, group."""
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        pages = parse_page_registry_ts(path)
        required_fields = {"id", "title", "route", "stateCount", "group"}
        for page in pages:
            self.assertEqual(required_fields, set(page.keys()),
                             f"Entry {page.get('id', '?')} missing fields")

    def test_all_ids_are_unique(self):
        """All page IDs must be unique."""
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        pages = parse_page_registry_ts(path)
        ids = [p["id"] for p in pages]
        self.assertEqual(len(ids), len(set(ids)), "Duplicate IDs found")

    def test_state_count_is_positive(self):
        """stateCount must be >= 1 for all pages."""
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        pages = parse_page_registry_ts(path)
        for page in pages:
            self.assertGreaterEqual(
                page["stateCount"], 1,
                f"Page {page['id']} has stateCount < 1",
            )

    def test_groups_are_valid(self):
        """All groups should be from the known set."""
        valid_groups = {"Auth", "Onboarding", "Dashboard", "Specialist", "Public", "Admin"}
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        pages = parse_page_registry_ts(path)
        for page in pages:
            self.assertIn(
                page["group"], valid_groups,
                f"Page {page['id']} has unknown group: {page['group']}",
            )

    def test_parse_missing_file_returns_fallback(self):
        """If file doesn't exist, should return fallback PAGE_REGISTRY."""
        pages = parse_page_registry_ts("/nonexistent/path/pageRegistry.ts")
        self.assertEqual(pages, PAGE_REGISTRY)

    def test_parse_empty_file_returns_fallback(self):
        """Empty file should return fallback."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".ts", delete=False) as f:
            f.write("// empty\n")
            f.flush()
            pages = parse_page_registry_ts(f.name)
        os.unlink(f.name)
        self.assertEqual(pages, PAGE_REGISTRY)

    def test_landing_page_exists(self):
        """A landing page entry should exist."""
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        pages = parse_page_registry_ts(path)
        landing = [p for p in pages if p["id"] == "landing"]
        self.assertEqual(len(landing), 1, "Should have exactly one 'landing' page")

    def test_auth_pages_exist(self):
        """Auth pages (auth-email, auth-otp) should exist."""
        path = os.path.join(WORKSPACE, "constants", "pageRegistry.ts")
        pages = parse_page_registry_ts(path)
        ids = {p["id"] for p in pages}
        self.assertIn("auth-email", ids)
        self.assertIn("auth-otp", ids)


class TestQaVisionCore(unittest.TestCase):
    """Test qa-vision.py core logic (no browser required)."""

    def test_fallback_registry_has_entries(self):
        """Fallback PAGE_REGISTRY should have multiple pages."""
        self.assertGreater(len(PAGE_REGISTRY), 5)

    def test_fallback_registry_fields(self):
        """Each fallback entry has required fields."""
        for page in PAGE_REGISTRY:
            self.assertIn("id", page)
            self.assertIn("title", page)
            self.assertIn("route", page)
            self.assertIn("stateCount", page)
            self.assertIn("group", page)
            self.assertIsInstance(page["stateCount"], int)
            self.assertGreaterEqual(page["stateCount"], 1)

    def test_run_page_checks_blank_page(self):
        """run_page_checks should detect blank page."""
        mock_page = MagicMock()
        mock_page.inner_text.return_value = ""
        entry = {"id": "test", "title": "Test", "stateCount": 1, "group": "Public"}
        issues = run_page_checks(mock_page, entry, "http://example.com")
        self.assertTrue(any(i["type"] == "blank_page" for i in issues))

    def test_run_page_checks_not_found(self):
        """run_page_checks should detect page not found."""
        mock_page = MagicMock()
        mock_page.inner_text.return_value = 'Page "test-page" not found in registry'
        entry = {"id": "test-page", "title": "Test", "stateCount": 1, "group": "Public"}
        issues = run_page_checks(mock_page, entry, "http://example.com")
        self.assertTrue(any(i["type"] == "page_not_found" for i in issues))


class TestProtoStatesRoute(unittest.TestCase):
    """Test that the proto states route file exists and is well-formed."""

    def test_states_route_exists(self):
        """app/proto/states/[id].tsx should exist."""
        path = os.path.join(WORKSPACE, "app", "proto", "states", "[id].tsx")
        self.assertTrue(os.path.exists(path), f"Missing {path}")

    def test_states_route_imports_pageRegistry(self):
        """States route should import from pageRegistry."""
        path = os.path.join(WORKSPACE, "app", "proto", "states", "[id].tsx")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn("pageRegistry", content)
        self.assertIn("useLocalSearchParams", content)

    def test_states_route_is_valid_tsx(self):
        """States route should have a default export."""
        path = os.path.join(WORKSPACE, "app", "proto", "states", "[id].tsx")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn("export default function", content)


class TestProtoIndexRoute(unittest.TestCase):
    """Test that the proto index is properly structured."""

    def test_proto_index_exists(self):
        """app/proto/index.tsx should exist."""
        path = os.path.join(WORKSPACE, "app", "proto", "index.tsx")
        self.assertTrue(os.path.exists(path))

    def test_proto_index_imports_registry(self):
        """Proto index should import pageRegistry and PAGE_GROUPS."""
        path = os.path.join(WORKSPACE, "app", "proto", "index.tsx")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn("pageRegistry", content)
        self.assertIn("PAGE_GROUPS", content)

    def test_proto_index_has_valid_stylesheet(self):
        """StyleSheet.create should be properly closed."""
        path = os.path.join(WORKSPACE, "app", "proto", "index.tsx")
        with open(path, "r") as f:
            content = f.read()
        # Count StyleSheet.create opens vs closes
        opens = content.count("StyleSheet.create({")
        closes = content.count("});")  # end of StyleSheet.create
        self.assertEqual(opens, 1, "Should have exactly one StyleSheet.create")
        # Check it's not corrupted with raw objects inside styles
        self.assertNotIn("steps: [", content.split("StyleSheet.create")[1])


class TestDotestScript(unittest.TestCase):
    """Test that the dotest script exists and is valid."""

    def test_dotest_exists(self):
        """dotest script should exist."""
        path = os.path.join(WORKSPACE, "dotest")
        self.assertTrue(os.path.exists(path))

    def test_dotest_calls_qa_vision(self):
        """dotest should reference qa-vision.py."""
        path = os.path.join(WORKSPACE, "dotest")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn("qa-vision.py", content)

    def test_dotest_references_github_labels(self):
        """dotest should support GitHub issue filing."""
        path = os.path.join(WORKSPACE, "dotest")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn("--github", content)


class TestQaVisionScript(unittest.TestCase):
    """Test that qa-vision.py is well-structured."""

    def test_qa_vision_exists(self):
        """qa-vision.py should exist."""
        path = os.path.join(WORKSPACE, "qa-vision.py")
        self.assertTrue(os.path.exists(path))

    def test_qa_vision_has_main(self):
        """qa-vision.py should have a main function."""
        path = os.path.join(WORKSPACE, "qa-vision.py")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn('if __name__ == "__main__"', content)
        self.assertIn("def main", content)

    def test_qa_vision_has_github_filing(self):
        """qa-vision.py should have GitHub issue filing logic."""
        path = os.path.join(WORKSPACE, "qa-vision.py")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn("file_github_issue", content)
        self.assertIn("bug,oh:ready", content)

    def test_qa_vision_has_screenshot_logic(self):
        """qa-vision.py should have screenshot functionality."""
        path = os.path.join(WORKSPACE, "qa-vision.py")
        with open(path, "r") as f:
            content = f.read()
        self.assertIn("screenshot", content)
        self.assertIn("run_visual_qa", content)


if __name__ == "__main__":
    unittest.main()
