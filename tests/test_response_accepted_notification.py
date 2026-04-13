"""
Tests for acceptResponse() sending RESPONSE_ACCEPTED email notification.

Validates acceptance criteria from the SA gap issue:
1. acceptResponse() calls emailService.notifyResponseAccepted()
2. Email only sent if specialist has notifyNewResponses: true
3. Email contains request title and client info
"""

import unittest

class TestAcceptResponseNotification(unittest.TestCase):
    """Validate that acceptResponse() in requests.service.ts sends notification."""

    def setUp(self):
        with open("/workspace/api/src/requests/requests.service.ts") as f:
            self.service = f.read()

    def _get_accept_response_section(self):
        start = self.service.index("async acceptResponse(")
        # Find the next method (async patchResponse)
        end = self.service.index("async patchResponse(", start)
        return self.service[start:end]

    def test_accept_response_includes_specialist_in_query(self):
        """acceptResponse() must include specialist data in the findUnique query."""
        section = self._get_accept_response_section()
        self.assertIn("specialist:", section)
        self.assertIn("email: true", section)
        self.assertIn("notifyNewResponses: true", section)

    def test_accept_response_includes_request_title_in_query(self):
        """acceptResponse() must include request title in the findUnique query."""
        section = self._get_accept_response_section()
        self.assertIn("title: true", section)

    def test_accept_response_calls_notify_response_accepted(self):
        """acceptResponse() must call emailService.notifyResponseAccepted()."""
        section = self._get_accept_response_section()
        self.assertIn("notifyResponseAccepted", section)

    def test_accept_response_checks_notification_preference(self):
        """acceptResponse() must check specialist's notifyNewResponses before sending."""
        section = self._get_accept_response_section()
        self.assertIn("specialist.notifyNewResponses", section)

    def test_accept_response_passes_specialist_email(self):
        """acceptResponse() must pass specialist email to notifyResponseAccepted."""
        section = self._get_accept_response_section()
        self.assertIn("response.specialist.email", section)

    def test_accept_response_passes_request_title(self):
        """acceptResponse() must pass request title to notifyResponseAccepted."""
        section = self._get_accept_response_section()
        self.assertIn("response.request.title", section)

    def test_accept_response_passes_client_name(self):
        """acceptResponse() must pass client name to notifyResponseAccepted."""
        section = self._get_accept_response_section()
        self.assertIn("clientName", section)

    def test_accept_response_fetches_client_info(self):
        """acceptResponse() must fetch client firstName/lastName for the email."""
        section = self._get_accept_response_section()
        self.assertIn("firstName", section)
        self.assertIn("lastName", section)

    def test_notification_is_after_transaction(self):
        """Notification must be sent after the transaction completes (not inside it)."""
        section = self._get_accept_response_section()
        tx_end = section.index("return { response: updated, thread };")
        notify_pos = section.index("notifyResponseAccepted")
        self.assertGreater(notify_pos, tx_end,
                           "notifyResponseAccepted must be called after the transaction")

class TestEmailServiceResponseAccepted(unittest.TestCase):
    """Validate notifyResponseAccepted() exists in email.service.ts."""

    def setUp(self):
        with open("/workspace/api/src/notifications/email.service.ts") as f:
            self.email = f.read()

    def test_notify_response_accepted_method_exists(self):
        """notifyResponseAccepted() method must exist."""
        self.assertIn("notifyResponseAccepted(", self.email)

    def test_notify_response_accepted_has_subject(self):
        """Email must have appropriate subject."""
        self.assertIn("Ваш отклик принят", self.email)

    def test_notify_response_accepted_mentions_client(self):
        """Email body must mention the client."""
        self.assertIn("clientName", self.email)

    def test_notify_response_accepted_mentions_request_title(self):
        """Email body must mention the request title."""
        self.assertIn("requestTitle", self.email)

    def test_notify_response_accepted_dev_log(self):
        """Dev mode must log RESPONSE_ACCEPTED type."""
        self.assertIn("notifyResponseAccepted", self.email)

if __name__ == "__main__":
    unittest.main()
