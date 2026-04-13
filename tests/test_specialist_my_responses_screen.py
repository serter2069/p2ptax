"""
Tests for the actual specialist my-responses screen at app/specialist/my-responses.tsx.

Validates:
1. Route file exists with correct structure
2. Required imports are present
3. Filter tabs are defined (All, Active, Accepted, Deactivated)
4. Status badges for all ResponseStatus values
5. Deactivate functionality
6. Loading/error/empty states
7. Navigation link from dashboard
"""

import os
import re
import unittest

ROUTE_FILE = "app/specialist/my-responses.tsx"
DASHBOARD_FILE = "app/specialist/dashboard.tsx"

def read_file(path):
    with open(os.path.join("/workspace", path), "r") as f:
        return f.read()

class TestMyResponsesRouteFile(unittest.TestCase):
    """Validate the route file exists and has correct structure."""

    def setUp(self):
        self.content = read_file(ROUTE_FILE)

    def test_file_exists(self):
        self.assertTrue(
            os.path.exists(os.path.join("/workspace", ROUTE_FILE)),
            f"{ROUTE_FILE} must exist",
        )

    def test_default_export(self):
        self.assertIn(
            "export default function",
            self.content,
            "Must have a default export function",
        )

    def test_imports_react(self):
        self.assertRegex(
            self.content,
            r"import\s+React",
            "Must import React",
        )

    def test_imports_flatlist(self):
        self.assertRegex(
            self.content,
            r"import\s*\{[^}]*FlatList[^}]*\}\s*from\s*['\"]react-native['\"]",
            "Must import FlatList from react-native",
        )

    def test_imports_safe_area_view(self):
        self.assertRegex(
            self.content,
            r"import\s*\{[^}]*SafeAreaView[^}]*\}\s*from\s*['\"]react-native['\"]",
            "Must import SafeAreaView from react-native",
        )

    def test_imports_api(self):
        self.assertIn("from '../../lib/api'", self.content, "Must import api module")

    def test_imports_header(self):
        self.assertIn(
            "from '../../components/Header'",
            self.content,
            "Must import Header component",
        )

    def test_imports_empty_state(self):
        self.assertIn(
            "from '../../components/EmptyState'",
            self.content,
            "Must import EmptyState component",
        )

    def test_stylesheet_create(self):
        self.assertIn(
            "StyleSheet.create(",
            self.content,
            "Must use StyleSheet.create",
        )

class TestFilterTabs(unittest.TestCase):
    """Validate filter tabs are defined correctly."""

    def setUp(self):
        self.content = read_file(ROUTE_FILE)

    def test_all_tab(self):
        self.assertIn("'all'", self.content, "Must have 'all' filter tab")

    def test_active_tab(self):
        self.assertIn("'active'", self.content, "Must have 'active' filter tab")

    def test_accepted_tab(self):
        self.assertIn("'accepted'", self.content, "Must have 'accepted' filter tab")

    def test_deactivated_tab(self):
        self.assertIn("'deactivated'", self.content, "Must have 'deactivated' filter tab")

    def test_filter_function_exists(self):
        self.assertIn(
            "filterResponses",
            self.content,
            "Must have a filterResponses function",
        )

    def test_active_filter_includes_sent_and_viewed(self):
        # The active filter should match sent + viewed statuses
        self.assertIn("'sent'", self.content)
        self.assertIn("'viewed'", self.content)

class TestStatusBadges(unittest.TestCase):
    """Validate status configuration for all response statuses."""

    def setUp(self):
        self.content = read_file(ROUTE_FILE)

    def test_sent_status(self):
        self.assertIn("sent:", self.content, "Must have 'sent' status config")

    def test_viewed_status(self):
        self.assertIn("viewed:", self.content, "Must have 'viewed' status config")

    def test_accepted_status(self):
        self.assertIn("accepted:", self.content, "Must have 'accepted' status config")

    def test_deactivated_status(self):
        self.assertIn("deactivated:", self.content, "Must have 'deactivated' status config")

    def test_status_badge_style(self):
        self.assertIn("statusBadge", self.content, "Must have statusBadge style")

class TestDeactivateFeature(unittest.TestCase):
    """Validate deactivate button functionality."""

    def setUp(self):
        self.content = read_file(ROUTE_FILE)

    def test_deactivate_handler(self):
        self.assertIn(
            "handleDeactivate",
            self.content,
            "Must have handleDeactivate function",
        )

    def test_patch_api_call(self):
        self.assertIn(
            "/requests/responses/",
            self.content,
            "Must call PATCH /requests/responses/:id",
        )

    def test_deactivate_button(self):
        self.assertIn(
            "deactivateBtn",
            self.content,
            "Must have deactivate button style",
        )

    def test_can_deactivate_check(self):
        self.assertIn(
            "canDeactivate",
            self.content,
            "Must check if response can be deactivated",
        )

class TestStates(unittest.TestCase):
    """Validate loading, error, and empty states."""

    def setUp(self):
        self.content = read_file(ROUTE_FILE)

    def test_loading_state(self):
        self.assertIn("loading", self.content, "Must track loading state")

    def test_skeleton_cards(self):
        self.assertIn("skeleton", self.content.lower(), "Must have skeleton loading cards")

    def test_error_state(self):
        self.assertIn("error", self.content, "Must track error state")

    def test_retry_button(self):
        # EmptyState with ctaLabel for retry
        self.assertIn("Повторить", self.content, "Must have retry button text")

    def test_empty_state_cta(self):
        self.assertIn(
            "Смотреть запросы",
            self.content,
            "Empty state must have CTA to browse requests",
        )

    def test_api_endpoint(self):
        self.assertIn(
            "/specialist/responses",
            self.content,
            "Must fetch from GET /specialist/responses",
        )

class TestDashboardNavigation(unittest.TestCase):
    """Validate navigation link from specialist dashboard."""

    def setUp(self):
        self.content = read_file(DASHBOARD_FILE)

    def test_my_responses_link(self):
        self.assertIn(
            "/specialist/my-responses",
            self.content,
            "Dashboard must have navigation link to /specialist/my-responses",
        )

    def test_my_responses_label(self):
        self.assertIn(
            "Мои отклики",
            self.content,
            "Dashboard must have 'Мои отклики' label for the nav link",
        )

class TestResponseInterface(unittest.TestCase):
    """Validate the ResponseItem interface has required fields."""

    def setUp(self):
        self.content = read_file(ROUTE_FILE)

    def test_price_field(self):
        self.assertIn("price", self.content, "ResponseItem must have price field")

    def test_deadline_field(self):
        self.assertIn("deadline", self.content, "ResponseItem must have deadline field")

    def test_status_field(self):
        self.assertIn("status", self.content, "ResponseItem must have status field")

    def test_request_title_field(self):
        self.assertIn("title", self.content, "ResponseItem.request must have title field")

if __name__ == "__main__":
    unittest.main()
