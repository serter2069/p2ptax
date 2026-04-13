"""
Tests for unsubscribe link presence in all email templates.

Validates that issue #722 / #704 requirements are met:
- Every marketing/notification email includes an unsubscribe link in HTML body
- Every marketing/notification email includes an unsubscribe link in plain text
- List-Unsubscribe header is set in the send() method
"""

import re
import unittest

class TestUnsubscribeLinkInEmailService(unittest.TestCase):
    """Validate email.service.ts has unsubscribe links in all templates."""

    def setUp(self):
        with open("/workspace/api/src/notifications/email.service.ts") as f:
            self.source = f.read()

    def test_generate_unsubscribe_token_exists(self):
        """generateUnsubscribeToken() method must exist."""
        self.assertIn("generateUnsubscribeToken(", self.source)

    def test_get_unsubscribe_url_exists(self):
        """getUnsubscribeUrl() method must exist."""
        self.assertIn("getUnsubscribeUrl(", self.source)

    def test_wrap_with_footer_exists(self):
        """wrapWithFooter() method must exist to add HTML unsubscribe footer."""
        self.assertIn("wrapWithFooter(", self.source)

    def test_append_text_footer_exists(self):
        """appendTextFooter() method must exist to add plain-text unsubscribe link."""
        self.assertIn("appendTextFooter(", self.source)

    def test_html_footer_contains_unsubscribe_link(self):
        """HTML footer must contain an <a> tag with unsubscribe URL."""
        footer_match = re.search(
            r"wrapWithFooter.*?return\s*`(.*?)`\s*;",
            self.source,
            re.DOTALL,
        )
        self.assertIsNotNone(footer_match, "wrapWithFooter method body not found")
        body = footer_match.group(1)
        self.assertIn("unsubscribeUrl", body)
        self.assertRegex(body, r'<a\s+href=.*unsubscribeUrl')

    def test_text_footer_contains_unsubscribe_url(self):
        """Plain-text footer must contain the unsubscribe URL."""
        footer_match = re.search(
            r"appendTextFooter.*?return\s*\((.*?)\)\s*;",
            self.source,
            re.DOTALL,
        )
        self.assertIsNotNone(footer_match, "appendTextFooter method body not found")
        body = footer_match.group(1)
        self.assertIn("unsubscribeUrl", body)

    def test_send_method_calls_wrap_with_footer(self):
        """send() must call wrapWithFooter to add HTML unsubscribe footer."""
        send_match = re.search(
            r"private async send\(.*?\{(.*?)\n  \}",
            self.source,
            re.DOTALL,
        )
        self.assertIsNotNone(send_match, "send() method not found")
        send_body = send_match.group(1)
        self.assertIn("wrapWithFooter", send_body)

    def test_send_method_calls_append_text_footer(self):
        """send() must call appendTextFooter to add plain-text unsubscribe link."""
        send_match = re.search(
            r"private async send\(.*?\{(.*?)\n  \}",
            self.source,
            re.DOTALL,
        )
        self.assertIsNotNone(send_match, "send() method not found")
        send_body = send_match.group(1)
        self.assertIn("appendTextFooter", send_body)

    def test_send_method_has_list_unsubscribe_header(self):
        """send() must include List-Unsubscribe header for RFC 8058 compliance."""
        send_match = re.search(
            r"private async send\(.*?\{(.*?)\n  \}",
            self.source,
            re.DOTALL,
        )
        self.assertIsNotNone(send_match, "send() method not found")
        send_body = send_match.group(1)
        self.assertIn("List-Unsubscribe", send_body)

    def test_send_method_has_list_unsubscribe_post_header(self):
        """send() must include List-Unsubscribe-Post header for one-click unsubscribe."""
        send_match = re.search(
            r"private async send\(.*?\{(.*?)\n  \}",
            self.source,
            re.DOTALL,
        )
        self.assertIsNotNone(send_match, "send() method not found")
        send_body = send_match.group(1)
        self.assertIn("List-Unsubscribe-Post", send_body)

    def test_all_notification_methods_pass_user_id(self):
        """All notification methods (except sendOtp) must accept and pass userId."""
        notification_methods = [
            "notifyNewResponse",
            "notifyNewMessage",
            "notifyResponseAccepted",
            "notifyNewRequestInCity",
            "notifyPromotionExpiringSoon",
            "notifyRequestClosingSoon",
        ]
        for method in notification_methods:
            self.assertIn(
                f"userId",
                self.source[self.source.index(f"{method}("):],
                f"{method} must accept userId parameter",
            )

    def test_send_otp_has_no_unsubscribe(self):
        """sendOtp is transactional and should NOT go through send() with unsubscribe footer."""
        otp_section = self.source[self.source.index("async sendOtp("):]
        otp_section = otp_section[: otp_section.index("\n  }") + 4]
        self.assertNotIn("wrapWithFooter", otp_section)
        self.assertNotIn("appendTextFooter", otp_section)

    def test_unsubscribe_url_uses_token(self):
        """Unsubscribe URL must use a JWT token for security."""
        url_match = re.search(
            r"getUnsubscribeUrl.*?\{(.*?)\}",
            self.source,
            re.DOTALL,
        )
        self.assertIsNotNone(url_match, "getUnsubscribeUrl method not found")
        body = url_match.group(1)
        self.assertIn("token", body)
        self.assertIn("generateUnsubscribeToken", body)

if __name__ == "__main__":
    unittest.main()
