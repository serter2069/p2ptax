"""
Tests for specialist my-responses screen implementation.
Validates acceptance criteria by parsing the source files.
"""
import os
import re
import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MY_RESPONSES_PATH = os.path.join(ROOT, "app", "specialist", "my-responses.tsx")
LAYOUT_PATH = os.path.join(ROOT, "app", "specialist", "_layout.tsx")
COLORS_PATH = os.path.join(ROOT, "constants", "Colors.ts")

def read_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@pytest.fixture
def source():
    return read_file(MY_RESPONSES_PATH)

@pytest.fixture
def layout_source():
    return read_file(LAYOUT_PATH)

@pytest.fixture
def colors_source():
    return read_file(COLORS_PATH)

class TestRouteExists:
    def test_my_responses_file_exists(self):
        assert os.path.isfile(MY_RESPONSES_PATH), (
            "app/specialist/my-responses.tsx must exist"
        )

    def test_layout_file_exists(self):
        assert os.path.isfile(LAYOUT_PATH), (
            "app/specialist/_layout.tsx must exist"
        )

    def test_layout_uses_stack(self, layout_source):
        """Stack auto-discovers routes, so my-responses is registered."""
        assert "<Stack" in layout_source, (
            "_layout.tsx should use <Stack> for auto route discovery"
        )

class TestStatusChipColors:
    """sent=grey, viewed=blue, accepted=green, deactivated=red"""

    def test_sent_uses_neutral_grey(self, source):
        assert "Colors.statusBg.neutral" in source, (
            "sent status should use neutral (grey) background"
        )
        assert "Colors.statusNeutral" in source, (
            "sent status should use neutral (grey) text color"
        )

    def test_viewed_uses_blue_info(self, source):
        assert "Colors.statusBg.info" in source, (
            "viewed status should use info (blue) background"
        )
        assert "Colors.statusInfo" in source, (
            "viewed status should use info (blue) text color"
        )

    def test_accepted_uses_green_success(self, source):
        assert "Colors.statusBg.success" in source, (
            "accepted status should use success (green) background"
        )
        assert "Colors.statusSuccess" in source, (
            "accepted status should use success (green) text color"
        )

    def test_deactivated_uses_red_error(self, source):
        assert "Colors.statusBg.error" in source, (
            "deactivated status should use error (red) background"
        )
        assert "Colors.statusError" in source, (
            "deactivated status should use error (red) text color"
        )

    def test_neutral_color_defined(self, colors_source):
        assert "statusNeutral" in colors_source, (
            "Colors.ts must define statusNeutral"
        )
        assert "neutral" in colors_source, (
            "Colors.ts statusBg must include neutral"
        )

class TestDeactivateEndpoint:
    def test_deactivate_calls_correct_endpoint(self, source):
        assert "api.patch(`/responses/${" in source, (
            "Deactivate should call PATCH /responses/:id"
        )

    def test_deactivate_sends_status_deactivated(self, source):
        assert "{ status: 'deactivated' }" in source, (
            "Deactivate should send status=deactivated"
        )

    def test_no_old_endpoint(self, source):
        assert "/requests/responses/" not in source, (
            "Should not use old /requests/responses/ endpoint"
        )

class TestFilterTabs:
    def test_has_all_tab(self, source):
        assert "key: 'all'" in source

    def test_has_active_tab(self, source):
        assert "key: 'active'" in source

    def test_has_deactivated_tab(self, source):
        assert "key: 'deactivated'" in source

    def test_no_accepted_filter_tab(self, source):
        """Filter tabs should be All/Active/Deactivated only."""
        # Find the FILTER_TABS array definition
        match = re.search(
            r"const FILTER_TABS.*?\[(.+?)\];", source, re.DOTALL
        )
        assert match, "FILTER_TABS must be defined"
        tabs_content = match.group(1)
        assert "key: 'accepted'" not in tabs_content, (
            "FILTER_TABS should not include 'accepted' tab"
        )

class TestFlatListAndAPI:
    def test_uses_flatlist(self, source):
        assert "FlatList" in source

    def test_fetches_from_specialist_responses(self, source):
        assert "/specialist/responses" in source, (
            "Should fetch from GET /api/specialist/responses"
        )

    def test_pull_to_refresh(self, source):
        assert "RefreshControl" in source
        assert "onRefresh" in source

class TestEmptyState:
    def test_empty_state_message(self, source):
        assert "You haven't responded to any requests yet" in source, (
            "Empty state should show the required message"
        )

class TestCardNavigation:
    def test_card_navigates_to_request_detail(self, source):
        assert "router.push(" in source
        assert "/requests/" in source, (
            "Tapping card should navigate to request detail"
        )

    def test_card_is_touchable(self, source):
        assert "TouchableOpacity" in source

class TestDeactivateButton:
    def test_deactivate_button_for_sent_viewed(self, source):
        assert "item.status === 'sent' || item.status === 'viewed'" in source, (
            "Deactivate button should only show for sent/viewed responses"
        )
