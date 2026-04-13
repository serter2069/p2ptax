"""
Tests for specialist-my-responses route registration.

Validates that the SpecialistMyResponses page has:
1. A States component file
2. An import and STATE_MAP entry in [page].tsx
3. A pageRegistry entry
4. An entry in SPECIALIST_ONLY_PAGES
"""

import unittest

class TestSpecialistMyResponsesRoute(unittest.TestCase):
    """Validate specialist-my-responses is fully wired as a route."""

    def setUp(self):
        with open("/workspace/app/proto/states/[page].tsx") as f:
            self.page_tsx = f.read()
        with open("/workspace/constants/pageRegistry.ts") as f:
            self.registry = f.read()
        with open("/workspace/components/proto/states/SpecialistMyResponsesStates.tsx") as f:
            self.states_tsx = f.read()

    def test_states_component_exists_and_exports(self):
        """SpecialistMyResponsesStates must be exported from the States file."""
        self.assertIn(
            "export function SpecialistMyResponsesStates",
            self.states_tsx,
            "SpecialistMyResponsesStates export not found in States file",
        )

    def test_page_tsx_imports_states_component(self):
        """[page].tsx must import SpecialistMyResponsesStates."""
        self.assertIn(
            "import { SpecialistMyResponsesStates }",
            self.page_tsx,
            "SpecialistMyResponsesStates import missing from [page].tsx",
        )

    def test_page_tsx_state_map_entry(self):
        """STATE_MAP must contain 'specialist-my-responses' key."""
        self.assertIn(
            "'specialist-my-responses': SpecialistMyResponsesStates",
            self.page_tsx,
            "specialist-my-responses not found in STATE_MAP",
        )

    def test_page_registry_entry_exists(self):
        """pageRegistry must have an entry with id 'specialist-my-responses'."""
        self.assertIn(
            "id: 'specialist-my-responses'",
            self.registry,
            "specialist-my-responses not found in pageRegistry",
        )

    def test_page_registry_has_route(self):
        """pageRegistry entry must define a route."""
        self.assertIn(
            "route: '/specialist/my-responses'",
            self.registry,
            "Route not defined for specialist-my-responses in pageRegistry",
        )

    def test_page_registry_has_state_count(self):
        """pageRegistry entry must have stateCount matching the States file."""
        self.assertIn(
            "stateCount: 3",
            self.registry.split("id: 'specialist-my-responses'")[1].split("},")[0],
            "stateCount should be 3 (POPULATED, EMPTY, LOADING)",
        )

    def test_page_registry_has_test_scenarios(self):
        """pageRegistry entry must have testScenarios."""
        entry_section = self.registry.split("id: 'specialist-my-responses'")[1].split("{ id:")[0]
        self.assertIn("testScenarios:", entry_section)

    def test_specialist_only_pages_includes_entry(self):
        """SPECIALIST_ONLY_PAGES must include specialist-my-responses."""
        self.assertIn(
            "'specialist-my-responses'",
            self.registry,
            "specialist-my-responses not in SPECIALIST_ONLY_PAGES",
        )
        # More specific: check it's in the SPECIALIST_ONLY_PAGES array
        specialist_section = self.registry.split("SPECIALIST_ONLY_PAGES")[1].split("] as const")[0]
        self.assertIn(
            "specialist-my-responses",
            specialist_section,
            "specialist-my-responses not in SPECIALIST_ONLY_PAGES array",
        )

if __name__ == "__main__":
    unittest.main()
