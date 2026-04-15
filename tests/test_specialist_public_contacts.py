"""Test that specialist public profile has structured contacts visible to all users."""
import re

FILE_PATH = "app/specialists/[nick].tsx"

def read_file():
    with open(FILE_PATH, "r") as f:
        return f.read()

def _get_interface_body():
    """Extract the full SpecialistProfile interface body, handling nested braces."""
    content = read_file()
    start = content.find("interface SpecialistProfile")
    assert start != -1, "SpecialistProfile interface must exist"
    brace_start = content.index("{", start)
    depth = 0
    for i in range(brace_start, len(content)):
        if content[i] == "{":
            depth += 1
        elif content[i] == "}":
            depth -= 1
            if depth == 0:
                return content[brace_start + 1 : i]
    raise AssertionError("Could not find closing brace for SpecialistProfile interface")

# --- Interface no longer has single contacts string ---

def test_no_single_contacts_string_in_interface():
    """The SpecialistProfile interface should NOT have a 'contacts: string' field."""
    body = _get_interface_body()
    assert "contacts:" not in body, \
        "SpecialistProfile should not have a single 'contacts' field; use structured fields instead"

# --- Structured contact fields exist in interface ---

def test_phone_field_in_interface():
    body = _get_interface_body()
    assert "phone:" in body, "SpecialistProfile must have 'phone' field"

def test_telegram_field_in_interface():
    body = _get_interface_body()
    assert "telegram:" in body, "SpecialistProfile must have 'telegram' field"

def test_whatsapp_field_in_interface():
    body = _get_interface_body()
    assert "whatsapp:" in body, "SpecialistProfile must have 'whatsapp' field"

def test_office_address_field_in_interface():
    body = _get_interface_body()
    assert "officeAddress:" in body, "SpecialistProfile must have 'officeAddress' field"

def test_working_hours_field_in_interface():
    body = _get_interface_body()
    assert "workingHours:" in body, "SpecialistProfile must have 'workingHours' field"

# --- Clickable links ---

def test_phone_tel_link():
    """Phone should use tel: link."""
    content = read_file()
    assert "tel:" in content, "Phone contact must use tel: link"

def test_telegram_link():
    """Telegram should link to t.me/."""
    content = read_file()
    assert "t.me/" in content, "Telegram contact must link to t.me/"

def test_whatsapp_link():
    """WhatsApp should link to wa.me/."""
    content = read_file()
    assert "wa.me/" in content, "WhatsApp contact must link to wa.me/"

# --- Contacts visible to all (no auth guard) ---

def test_contacts_not_gated_by_auth():
    """Contacts section must NOT be wrapped in a user/auth check."""
    content = read_file()
    contacts_block_match = re.search(
        r"\{.*?profile\.phone.*?profile\.telegram.*?profile\.whatsapp.*?profile\.officeAddress.*?profile\.workingHours.*?\}",
        content,
        re.DOTALL,
    )
    assert contacts_block_match, "Contacts section with structured fields must exist"
    block = contacts_block_match.group(0)
    first_line = block.split("\n")[0]
    assert "user" not in first_line, \
        "Contacts section condition must not check for user auth — contacts are PUBLIC"

def test_no_old_contacts_string_rendering():
    """Ensure old profile.contacts string rendering is removed."""
    content = read_file()
    assert "profile.contacts" not in content, \
        "Old profile.contacts string rendering must be removed"
