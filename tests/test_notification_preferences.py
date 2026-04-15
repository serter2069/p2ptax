"""
Tests for per-event notification preferences UI.

Validates that issue #763 requirements are met:
- Dashboard settings uses per-event notification toggles (new_responses, new_messages)
- Tabs settings uses per-event notification toggles (new_responses, new_messages)
- Both files call /users/me/notification-settings endpoint
- Autoclose toggle is present and always ON (disabled)
- Old single emailNotifications toggle is removed
- Endpoints file has getNotificationSettings/updateNotificationSettings
"""

import re
import unittest

class TestDashboardSettingsNotificationPreferences(unittest.TestCase):
    """Validate app/(dashboard)/settings.tsx has per-event notification toggles."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/settings.tsx") as f:
            self.source = f.read()

    def test_no_single_email_notifications_toggle(self):
        """Old single emailNotifications toggle must be removed."""
        self.assertNotIn("emailNotifications", self.source)

    def test_no_old_notif_key(self):
        """Old NOTIF_KEY constant must be removed."""
        # Should not have the old single key, only the per-event keys
        self.assertNotIn("@p2ptax_email_notif'", self.source)

    def test_uses_notification_settings_endpoint(self):
        """Must call /users/me/notification-settings endpoint."""
        self.assertIn("/users/me/notification-settings", self.source)

    def test_new_responses_toggle_exists(self):
        """new_responses toggle must exist."""
        self.assertIn("new_responses", self.source)

    def test_new_messages_toggle_exists(self):
        """new_messages toggle must exist."""
        self.assertIn("new_messages", self.source)

    def test_new_responses_label(self):
        """Must show 'Новые отклики' label."""
        self.assertIn("Новые отклики", self.source)

    def test_new_messages_label(self):
        """Must show 'Новые сообщения' label."""
        self.assertIn("Новые сообщения", self.source)

    def test_autoclose_toggle_exists(self):
        """Autoclose toggle must exist."""
        self.assertIn("Автозакрытие", self.source)

    def test_autoclose_is_disabled(self):
        """Autoclose toggle must be disabled (always ON)."""
        # The Switch for autoclose should have disabled={true}
        self.assertIn("disabled={true}", self.source)

    def test_notif_settings_state(self):
        """Must use notifSettings state with new_responses and new_messages."""
        self.assertIn("notifSettings", self.source)
        self.assertIn("setNotifSettings", self.source)

    def test_no_old_email_notif_state(self):
        """Old emailNotif state must be removed."""
        self.assertNotIn("setEmailNotif", self.source)
        # Check there's no useState(true) for emailNotif
        self.assertNotRegex(self.source, r"emailNotif.*useState")

class TestTabsSettingsNotificationPreferences(unittest.TestCase):
    """Validate app/(tabs)/settings.tsx has per-event notification toggles."""

    def setUp(self):
        with open("/workspace/app/(tabs)/settings.tsx") as f:
            self.source = f.read()

    def test_no_single_email_notifications_toggle(self):
        """Old single emailNotifications toggle must be removed."""
        self.assertNotIn("emailNotifications", self.source)

    def test_uses_notification_settings_endpoint(self):
        """Must call getNotificationSettings from endpoints."""
        self.assertIn("getNotificationSettings", self.source)

    def test_new_responses_toggle_exists(self):
        """new_responses toggle must exist."""
        self.assertIn("new_responses", self.source)

    def test_new_messages_toggle_exists(self):
        """new_messages toggle must exist."""
        self.assertIn("new_messages", self.source)

    def test_new_responses_label(self):
        """Must show 'Новые отклики' label."""
        self.assertIn("Новые отклики", self.source)

    def test_new_messages_label(self):
        """Must show 'Новые сообщения' label."""
        self.assertIn("Новые сообщения", self.source)

    def test_autoclose_toggle_exists(self):
        """Autoclose toggle must exist."""
        self.assertIn("Автозакрытие", self.source)

    def test_autoclose_is_disabled(self):
        """Autoclose toggle must be disabled."""
        self.assertIn('disabled', self.source)

    def test_no_old_email_notif_state(self):
        """Old emailNotif/pushNotif state must be removed."""
        self.assertNotIn("setEmailNotif", self.source)
        self.assertNotIn("setPushNotif", self.source)
        self.assertNotIn("handleToggleEmail", self.source)
        self.assertNotIn("handleTogglePush", self.source)

    def test_notif_settings_state(self):
        """Must use notifSettings state."""
        self.assertIn("notifSettings", self.source)
        self.assertIn("setNotifSettings", self.source)

class TestEndpointsNotificationSettings(unittest.TestCase):
    """Validate lib/api/endpoints.ts has notification-settings methods."""

    def setUp(self):
        with open("/workspace/lib/api/endpoints.ts") as f:
            self.source = f.read()

    def test_get_notification_settings_exists(self):
        """getNotificationSettings method must exist."""
        self.assertIn("getNotificationSettings", self.source)

    def test_update_notification_settings_exists(self):
        """updateNotificationSettings method must exist."""
        self.assertIn("updateNotificationSettings", self.source)

    def test_notification_settings_endpoint(self):
        """Must use /users/me/notification-settings endpoint."""
        self.assertIn("/users/me/notification-settings", self.source)

    def test_new_responses_param(self):
        """Must reference new_responses parameter."""
        self.assertIn("new_responses", self.source)

    def test_new_messages_param(self):
        """Must reference new_messages parameter."""
        self.assertIn("new_messages", self.source)

if __name__ == "__main__":
    unittest.main()
