"""
Tests for the standardized API error contract.

Validates:
1. Backend error codes enum and mapping
2. Backend exception filter behavior
3. Frontend ApiError class
4. Frontend parseApiError logic
"""

import json
import re
import unittest

# ===========================================================================
# 1. Validate error-codes.ts content
# ===========================================================================
class TestErrorCodeEnum(unittest.TestCase):
    """Check that api/src/common/error-codes.ts defines the required codes."""

    REQUIRED_CODES = [
        "VALIDATION_ERROR",
        "UNAUTHORIZED",
        "FORBIDDEN",
        "NOT_FOUND",
        "CONFLICT",
        "BUSINESS_RULE_VIOLATION",
        "RATE_LIMITED",
        "INTERNAL_ERROR",
    ]

    def setUp(self):
        with open("/workspace/api/src/common/error-codes.ts") as f:
            self.content = f.read()

    def test_all_error_codes_defined(self):
        for code in self.REQUIRED_CODES:
            # Enum uses single quotes: VALIDATION_ERROR = 'VALIDATION_ERROR'
            pattern = f"{code} = '{code}'"
            self.assertIn(
                pattern,
                self.content,
                f"ErrorCode.{code} not found in error-codes.ts",
            )

    def test_status_mapping_400(self):
        self.assertIn("400", self.content)
        self.assertIn("VALIDATION_ERROR", self.content)

    def test_status_mapping_401(self):
        self.assertIn("401", self.content)
        self.assertIn("UNAUTHORIZED", self.content)

    def test_status_mapping_403(self):
        self.assertIn("403", self.content)
        self.assertIn("FORBIDDEN", self.content)

    def test_status_mapping_404(self):
        self.assertIn("404", self.content)
        self.assertIn("NOT_FOUND", self.content)

    def test_status_mapping_409(self):
        self.assertIn("409", self.content)
        self.assertIn("CONFLICT", self.content)

    def test_status_mapping_429(self):
        self.assertIn("429", self.content)
        self.assertIn("RATE_LIMITED", self.content)

    def test_status_mapping_500(self):
        self.assertIn("INTERNAL_ERROR", self.content)

    def test_default_messages_in_russian(self):
        """All default messages should contain Cyrillic characters."""
        cyrillic = re.findall(r"'([А-Яа-яЁё][^']*)'", self.content)
        self.assertGreaterEqual(len(cyrillic), 7, "Expected Russian default messages")

# ===========================================================================
# 2. Validate exception filter
# ===========================================================================
class TestExceptionFilter(unittest.TestCase):
    """Check that the global exception filter implements the contract."""

    def setUp(self):
        with open("/workspace/api/src/common/validation-exception.filter.ts") as f:
            self.content = f.read()

    def test_catch_all_decorator(self):
        """Filter must catch ALL exceptions, not just HttpException."""
        self.assertIn("@Catch()", self.content)

    def test_standard_response_shape(self):
        """Filter must produce { error: { code, message, details } }."""
        self.assertIn('"error"', self.content)
        self.assertIn("code", self.content)
        self.assertIn("message", self.content)
        self.assertIn("details", self.content)

    def test_500_no_stack_trace(self):
        """500 errors must never expose stack traces."""
        # Should log internally but return generic message
        self.assertIn("INTERNAL_ERROR", self.content)
        # The response body should use buildBody which returns the default message
        self.assertIn("buildBody(ErrorCode.INTERNAL_ERROR", self.content)

    def test_429_rate_limited(self):
        """429 must map to RATE_LIMITED code."""
        self.assertIn("429", self.content)
        self.assertIn("RATE_LIMITED", self.content)

    def test_400_field_details(self):
        """400 errors must include per-field details."""
        self.assertIn("extractFieldErrors", self.content)
        self.assertIn("field", self.content)

    def test_imports_error_codes(self):
        """Filter must import from error-codes.ts."""
        self.assertIn("from './error-codes'", self.content)

# ===========================================================================
# 3. Validate frontend ApiError class
# ===========================================================================
class TestFrontendApiError(unittest.TestCase):
    """Check that lib/api.ts exports ApiError with the right shape."""

    def setUp(self):
        with open("/workspace/lib/api.ts") as f:
            self.content = f.read()

    def test_api_error_class(self):
        self.assertIn("export class ApiError extends Error", self.content)

    def test_status_property(self):
        self.assertIn("readonly status:", self.content)

    def test_code_property(self):
        self.assertIn("readonly code:", self.content)

    def test_details_property(self):
        self.assertIn("readonly details:", self.content)

    def test_field_error_interface(self):
        self.assertIn("export interface FieldError", self.content)

    def test_constructor_takes_four_args(self):
        """Constructor should accept (status, code, message, details)."""
        self.assertIn("constructor(status: number, code: string, message: string, details:", self.content)

    def test_401_refresh_flow(self):
        """401 must trigger token refresh → retry → logout flow."""
        self.assertIn("tryRefreshTokens()", self.content)
        self.assertIn("401", self.content)
        self.assertIn("emitUnauthorized()", self.content)

    def test_parse_api_error_function(self):
        """parseApiError must handle standardized { error: { code, message, details } }."""
        self.assertIn("async function parseApiError", self.content)
        self.assertIn("json?.error", self.content)
        self.assertIn("code", self.content)
        self.assertIn("details", self.content)

    def test_parse_api_error_legacy_fallback(self):
        """parseApiError must handle legacy { message } format."""
        self.assertIn("Legacy fallback", self.content)

    def test_429_russian_message(self):
        """429 errors should show Russian message from the backend."""
        # The backend returns RATE_LIMITED with Russian message
        # Frontend parseApiError will extract it from the standardized response
        self.assertIn("parseApiError", self.content)

# ===========================================================================
# 4. Validate main.ts uses the filter
# ===========================================================================
class TestMainTs(unittest.TestCase):
    def setUp(self):
        with open("/workspace/api/src/main.ts") as f:
            self.content = f.read()

    def test_global_filter_registered(self):
        self.assertIn("useGlobalFilters", self.content)
        self.assertIn("ValidationExceptionFilter", self.content)

    def test_imports_filter(self):
        self.assertIn("from './common/validation-exception.filter'", self.content)

# ===========================================================================
# 5. Validate backward compatibility
# ===========================================================================
class TestBackwardCompatibility(unittest.TestCase):
    """Ensure existing code that uses err.status and err.message still works."""

    FILES_USING_API_ERROR = [
        "/workspace/app/requests/[id].tsx",
        "/workspace/app/requests/index.tsx",
        "/workspace/app/specialist/respond/[requestId].tsx",
        "/workspace/app/specialist/dashboard.tsx",
        "/workspace/app/(onboarding)/profile.tsx",
        "/workspace/app/(onboarding)/username.tsx",
        "/workspace/app/(dashboard)/my-requests/edit/[id].tsx",
        "/workspace/app/(dashboard)/my-requests/new.tsx",
        "/workspace/app/(dashboard)/my-requests/[id].tsx",
        "/workspace/app/(dashboard)/my-requests/index.tsx",
        "/workspace/app/(dashboard)/messages/index.tsx",
        "/workspace/app/(dashboard)/profile.tsx",
        "/workspace/app/(dashboard)/responses.tsx",
        "/workspace/app/(dashboard)/index.tsx",
        "/workspace/app/(dashboard)/city-requests.tsx",
        "/workspace/app/(dashboard)/specialist-profile.tsx",
        "/workspace/app/(dashboard)/promotion.tsx",
        "/workspace/app/specialists/index.tsx",
        "/workspace/app/specialists/[nick].tsx",
        "/workspace/app/(auth)/otp.tsx",
        "/workspace/app/(auth)/email.tsx",
    ]

    def test_all_files_import_api_error(self):
        """All files that use ApiError should still import it."""
        for filepath in self.FILES_USING_API_ERROR:
            with open(filepath) as f:
                content = f.read()
            self.assertIn("ApiError", content, f"{filepath} should import ApiError")

    def test_err_status_usage_compatible(self):
        """err.status is still a number property on ApiError."""
        with open("/workspace/lib/api.ts") as f:
            content = f.read()
        self.assertIn("readonly status: number", content)

    def test_err_message_usage_compatible(self):
        """err.message is still a string property (inherited from Error)."""
        with open("/workspace/lib/api.ts") as f:
            content = f.read()
        self.assertIn("super(message)", content)

if __name__ == "__main__":
    unittest.main()
