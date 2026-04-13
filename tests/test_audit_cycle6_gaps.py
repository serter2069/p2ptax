"""
Tests verifying the gaps found in audit cycle 6.
These tests check the current state of the codebase to confirm issues exist.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read_file(rel_path: str) -> str:
    with open(os.path.join(ROOT, rel_path), "r") as f:
        return f.read()

# --- #749: Specialist respond screen missing price/deadline inputs ---

def test_respond_screen_missing_price_field():
    """Frontend respond screen should have price input but currently doesn't."""
    content = read_file("app/specialist/respond/[requestId].tsx")
    # The screen currently has no price field - this confirms the gap
    has_price = "price" in content.lower()
    # This test documents the gap: price is missing
    # When fixed, this test should be updated to assert has_price is True
    assert not has_price, "Price field found — issue #749 may be fixed, update this test"

def test_respond_screen_missing_deadline_field():
    """Frontend respond screen should have deadline input but currently doesn't."""
    content = read_file("app/specialist/respond/[requestId].tsx")
    has_deadline = "deadline" in content.lower()
    assert not has_deadline, "Deadline field found — issue #749 may be fixed, update this test"

def test_respond_dto_requires_price_and_deadline():
    """Backend DTO requires price and deadline, confirming frontend is out of sync."""
    content = read_file("api/src/requests/dto/respond-request.dto.ts")
    assert "price" in content
    assert "deadline" in content

# --- #750: Thread created on respond (should only be on accept) ---

def test_respond_creates_thread():
    """respond() currently creates a thread — SA says it should not."""
    content = read_file("api/src/requests/requests.service.ts")
    # Find the respond method and check if it has thread upsert
    respond_match = re.search(r'async respond\(.*?\n(.*?)(?=\n  async |\n  /\*\*)', content, re.DOTALL)
    assert respond_match, "respond() method not found"
    respond_body = respond_match.group(1)
    has_thread = "thread" in respond_body.lower() and "upsert" in respond_body.lower()
    assert has_thread, "Thread creation not found in respond() — issue #750 may be fixed"

# --- #751: Specialist catalog doesn't filter by isAvailable ---

def test_catalog_missing_is_available_filter():
    """getCatalog() should filter by isAvailable but currently doesn't."""
    content = read_file("api/src/specialists/specialists.service.ts")
    # Find getCatalog method
    catalog_match = re.search(r'async getCatalog\(.*?\n(.*?)(?=\n  async |\n  /\*\*)', content, re.DOTALL)
    assert catalog_match, "getCatalog() method not found"
    catalog_body = catalog_match.group(1)
    has_available_filter = "isAvailable" in catalog_body
    assert not has_available_filter, "isAvailable filter found — issue #751 may be fixed"

# --- #752: Specialist my-responses route missing ---

def test_specialist_my_responses_route_missing():
    """No actual route file exists for specialist my-responses."""
    route_path = os.path.join(ROOT, "app", "specialist", "my-responses.tsx")
    route_path2 = os.path.join(ROOT, "app", "specialist", "my-responses", "index.tsx")
    assert not os.path.exists(route_path) and not os.path.exists(route_path2), \
        "my-responses route found — issue #752 may be fixed"

# --- #753: Specialist public profile hides contacts from guests ---

def test_specialist_profile_hides_contacts():
    """getProfile() conditionally hides contacts from unauthenticated users."""
    content = read_file("api/src/specialists/specialists.service.ts")
    # Check for the conditional contacts inclusion
    has_conditional = "requestingUser ? { contacts }" in content or "requestingUser ?" in content
    assert has_conditional, "Conditional contacts not found — issue #753 may be fixed"

# --- #754: No specialist dashboard stats endpoint ---

def test_specialist_dashboard_endpoint_missing():
    """No GET /specialist/dashboard endpoint exists."""
    content = read_file("api/src/specialists/specialist-portal.controller.ts")
    has_dashboard = "'dashboard'" in content or '"dashboard"' in content
    assert not has_dashboard, "Dashboard endpoint found — issue #754 may be fixed"
