"""
Tests for Request lifecycle: lastActivityAt, extensionsCount, CLOSING_SOON status, auto-close cron, extend endpoint.

Validates acceptance criteria from issue #681 QA follow-up.
"""

import re
import unittest

class TestSchemaPrisma(unittest.TestCase):
    """Validate schema.prisma changes."""

    def setUp(self):
        with open("/workspace/api/prisma/schema.prisma") as f:
            self.schema = f.read()

    def test_request_status_enum_has_closing_soon(self):
        """CLOSING_SOON must be in RequestStatus enum."""
        self.assertIn("CLOSING_SOON", self.schema)
        # Verify it's in the enum block
        enum_match = re.search(
            r"enum RequestStatus \{[^}]*CLOSING_SOON[^}]*\}", self.schema, re.DOTALL
        )
        self.assertIsNotNone(enum_match, "CLOSING_SOON not found in RequestStatus enum")

    def test_request_model_has_last_activity_at(self):
        """Request model must have lastActivityAt DateTime field."""
        self.assertIn("lastActivityAt", self.schema)
        # Check it's in the Request model
        request_match = re.search(
            r"model Request \{[^}]*lastActivityAt\s+DateTime[^}]*\}",
            self.schema,
            re.DOTALL,
        )
        self.assertIsNotNone(request_match, "lastActivityAt DateTime not found in Request model")

    def test_request_model_has_extensions_count(self):
        """Request model must have extensionsCount Int field with default 0."""
        self.assertIn("extensionsCount", self.schema)
        request_match = re.search(
            r"model Request \{[^}]*extensionsCount\s+Int\s+@default\(0\)[^}]*\}",
            self.schema,
            re.DOTALL,
        )
        self.assertIsNotNone(request_match, "extensionsCount Int @default(0) not found in Request model")

    def test_request_has_status_last_activity_index(self):
        """Request model must have index on (status, lastActivityAt) for cron queries."""
        self.assertIn("@@index([status, lastActivityAt])", self.schema)

    def test_enum_values_complete(self):
        """RequestStatus enum must have all four values."""
        enum_match = re.search(r"enum RequestStatus \{([^}]+)\}", self.schema)
        self.assertIsNotNone(enum_match)
        values = enum_match.group(1).split()
        self.assertEqual(set(values), {"OPEN", "CLOSING_SOON", "CLOSED", "CANCELLED"})

class TestMigration(unittest.TestCase):
    """Validate migration SQL file exists and has correct statements."""

    def test_migration_file_exists(self):
        import os
        migration_dir = "/workspace/api/prisma/migrations/20260414000000_add_request_lifecycle_fields"
        self.assertTrue(os.path.isdir(migration_dir), f"Migration directory not found: {migration_dir}")
        self.assertTrue(
            os.path.isfile(f"{migration_dir}/migration.sql"),
            "migration.sql not found"
        )

    def test_migration_adds_enum_value(self):
        with open("/workspace/api/prisma/migrations/20260414000000_add_request_lifecycle_fields/migration.sql") as f:
            sql = f.read()
        self.assertIn("CLOSING_SOON", sql)
        self.assertIn("ALTER TYPE", sql)

    def test_migration_adds_columns(self):
        with open("/workspace/api/prisma/migrations/20260414000000_add_request_lifecycle_fields/migration.sql") as f:
            sql = f.read()
        self.assertIn("lastActivityAt", sql)
        self.assertIn("extensionsCount", sql)

    def test_migration_creates_index(self):
        with open("/workspace/api/prisma/migrations/20260414000000_add_request_lifecycle_fields/migration.sql") as f:
            sql = f.read()
        self.assertIn("CREATE INDEX", sql)
        self.assertIn("lastActivityAt", sql)

class TestRequestsService(unittest.TestCase):
    """Validate requests.service.ts changes."""

    def setUp(self):
        with open("/workspace/api/src/requests/requests.service.ts") as f:
            self.service = f.read()

    def test_cron_import(self):
        """Cron decorator must be imported from @nestjs/schedule."""
        self.assertIn("import { Cron } from '@nestjs/schedule'", self.service)

    def test_max_extensions_constant(self):
        """MAX_EXTENSIONS constant must be defined."""
        self.assertIn("MAX_EXTENSIONS", self.service)

    def test_closing_soon_days_constant(self):
        """CLOSING_SOON_DAYS constant must be defined."""
        self.assertIn("CLOSING_SOON_DAYS", self.service)

    def test_auto_close_days_constant(self):
        """AUTO_CLOSE_DAYS constant must be defined."""
        self.assertIn("AUTO_CLOSE_DAYS", self.service)

    def test_extend_method_exists(self):
        """extend() method must exist."""
        self.assertIn("async extend(", self.service)

    def test_extend_checks_max_extensions(self):
        """extend() must check extensionsCount >= MAX_EXTENSIONS."""
        self.assertIn("extensionsCount >= MAX_EXTENSIONS", self.service)

    def test_extend_resets_last_activity_at(self):
        """extend() must reset lastActivityAt."""
        self.assertIn("lastActivityAt: new Date()", self.service)

    def test_extend_increments_extensions_count(self):
        """extend() must increment extensionsCount."""
        self.assertIn("extensionsCount: { increment: 1 }", self.service)

    def test_extend_sets_status_open(self):
        """extend() must set status back to OPEN."""
        self.assertIn("status: RequestStatus.OPEN", self.service)

    def test_mark_closing_soon_cron(self):
        """markClosingSoon() cron must exist with daily schedule."""
        self.assertIn("async markClosingSoon(", self.service)
        # Check it has @Cron decorator
        self.assertRegex(self.service, r"@Cron\(['\"].*['\"]\)\s*\n\s*async markClosingSoon")

    def test_mark_closing_soon_updates_status(self):
        """markClosingSoon() must set status to CLOSING_SOON."""
        self.assertIn("status: RequestStatus.CLOSING_SOON", self.service)

    def test_mark_closing_soon_sends_emails(self):
        """markClosingSoon() must send warning emails."""
        self.assertIn("notifyRequestClosingSoon", self.service)

    def test_auto_close_stale_cron(self):
        """autoCloseStale() cron must exist."""
        self.assertIn("async autoCloseStale(", self.service)

    def test_auto_close_sets_closed(self):
        """autoCloseStale() must set status to CLOSED."""
        self.assertIn("status: RequestStatus.CLOSED", self.service)

    def test_auto_close_handles_open_and_closing_soon(self):
        """autoCloseStale() must handle both OPEN and CLOSING_SOON statuses."""
        self.assertIn(
            "status: { in: [RequestStatus.OPEN, RequestStatus.CLOSING_SOON] }",
            self.service,
        )

    def test_respond_updates_last_activity_at(self):
        """respond() must update lastActivityAt on the request."""
        # Find the respond method and check it updates lastActivityAt
        respond_section = self.service[self.service.index("async respond("):]
        self.assertIn("lastActivityAt: new Date()", respond_section)

    def test_transition_matrix_includes_closing_soon(self):
        """Transition matrix must include CLOSING_SOON transitions."""
        self.assertIn("RequestStatus.CLOSING_SOON", self.service)
        # OPEN can transition to CLOSING_SOON
        self.assertIn(
            "[RequestStatus.OPEN]: [RequestStatus.CLOSING_SOON",
            self.service,
        )
        # CLOSING_SOON can transition to OPEN, CLOSED, CANCELLED
        self.assertIn(
            "[RequestStatus.CLOSING_SOON]: [RequestStatus.OPEN",
            self.service,
        )

    def test_find_feed_includes_closing_soon(self):
        """findFeed() must include CLOSING_SOON in status filter."""
        feed_section = self.service[self.service.index("async findFeed("):]
        self.assertIn("RequestStatus.CLOSING_SOON", feed_section)

    def test_find_recent_includes_closing_soon(self):
        """findRecent() must include CLOSING_SOON in status filter."""
        recent_section = self.service[self.service.index("async findRecent("):]
        self.assertIn("RequestStatus.CLOSING_SOON", recent_section)

    def test_respond_allows_closing_soon(self):
        """respond() must allow responding to CLOSING_SOON requests."""
        respond_section = self.service[self.service.index("async respond("):]
        self.assertIn("RequestStatus.CLOSING_SOON", respond_section)

class TestRequestsController(unittest.TestCase):
    """Validate requests.controller.ts changes."""

    def setUp(self):
        with open("/workspace/api/src/requests/requests.controller.ts") as f:
            self.controller = f.read()

    def test_extend_endpoint_exists(self):
        """PATCH /requests/:id/extend endpoint must exist."""
        self.assertIn("@Patch(':id/extend')", self.controller)

    def test_extend_requires_auth(self):
        """extend endpoint must require JWT auth and CLIENT role."""
        extend_section = self.controller[self.controller.index("@Patch(':id/extend')"):]
        self.assertIn("JwtAuthGuard", extend_section[:500])
        self.assertIn("Role.CLIENT", extend_section[:500])

    def test_extend_calls_service(self):
        """extend endpoint must call requestsService.extend."""
        self.assertIn("this.requestsService.extend", self.controller)

class TestEmailService(unittest.TestCase):
    """Validate email.service.ts changes."""

    def setUp(self):
        with open("/workspace/api/src/notifications/email.service.ts") as f:
            self.email = f.read()

    def test_notify_request_closing_soon_method(self):
        """notifyRequestClosingSoon() method must exist."""
        self.assertIn("notifyRequestClosingSoon(", self.email)

    def test_closing_soon_email_has_subject(self):
        """Warning email must have appropriate subject."""
        self.assertIn("Запрос будет закрыт", self.email)

    def test_closing_soon_email_mentions_3_days(self):
        """Warning email must mention 3 days."""
        self.assertIn("3 дня", self.email)

if __name__ == "__main__":
    unittest.main()
