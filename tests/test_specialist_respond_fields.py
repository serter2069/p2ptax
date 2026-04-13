"""Test that specialist respond screen has price, deadline, and comment fields."""
import re

FILE_PATH = "app/specialist/respond/[requestId].tsx"

def read_file():
    with open(FILE_PATH, "r") as f:
        return f.read()

def test_price_state_exists():
    content = read_file()
    assert "useState('')" in content or "useState('" in content
    assert re.search(r"const\s*\[price,\s*setPrice\]", content), \
        "price state variable must exist"

def test_deadline_state_exists():
    content = read_file()
    assert re.search(r"const\s*\[deadline,\s*setDeadline\]", content), \
        "deadline state variable must exist"

def test_comment_state_exists():
    content = read_file()
    assert re.search(r"const\s*\[comment,\s*setComment\]", content), \
        "comment state variable must exist"

def test_no_message_state():
    content = read_file()
    assert not re.search(r"const\s*\[message,\s*setMessage\]", content), \
        "old message state should be removed"

def test_price_label():
    content = read_file()
    assert "Предлагаемая цена, руб." in content, \
        "Price field label must be present"

def test_deadline_label():
    content = read_file()
    assert "Срок выполнения" in content, \
        "Deadline field label must be present"

def test_price_input_exists():
    content = read_file()
    assert 'testID="price-input"' in content, \
        "Price input with testID must exist"

def test_deadline_input_exists():
    content = read_file()
    assert 'testID="deadline-input"' in content, \
        "Deadline input with testID must exist"

def test_comment_input_exists():
    content = read_file()
    assert 'testID="comment-input"' in content, \
        "Comment input with testID must exist"

def test_api_payload_sends_comment():
    content = read_file()
    assert re.search(r"comment:\s*comment\.trim\(\)", content), \
        "API call must send comment field"

def test_api_payload_sends_price():
    content = read_file()
    assert re.search(r"price:\s*parseInt\(price", content), \
        "API call must send price as parseInt"

def test_api_payload_sends_deadline():
    content = read_file()
    # deadline should be sent in the API payload object
    assert re.search(r"deadline[,\s\n\r}]", content), \
        "API call must send deadline field"

def test_no_message_in_api_payload():
    content = read_file()
    # The old { message: message.trim() } pattern should not exist
    assert not re.search(r"message:\s*message", content), \
        "API call should not send old 'message' field"

def test_price_validation_non_negative():
    content = read_file()
    assert re.search(r"parsedPrice\s*<\s*0", content), \
        "Validation must check price >= 0"

def test_comment_validation_min_length():
    content = read_file()
    assert re.search(r"trimmed\.length\s*<\s*10", content), \
        "Validation must check comment min length of 10"

def test_comment_validation_max_length():
    content = read_file()
    assert re.search(r"trimmed\.length\s*>\s*500", content), \
        "Validation must check comment max length of 500"

def test_deadline_validation_future():
    content = read_file()
    assert re.search(r"deadline\s*<\s*getTomorrowDate", content), \
        "Validation must check deadline is in the future"

def test_keyboard_type_numeric_for_price():
    content = read_file()
    # Find the price input section and check keyboardType
    assert 'keyboardType="numeric"' in content, \
        "Price input must have numeric keyboard type"

def test_field_label_style_exists():
    content = read_file()
    assert "fieldLabel:" in content, \
        "fieldLabel style must be defined"

def test_input_style_exists():
    content = read_file()
    # Check for input style definition (not just usage)
    assert re.search(r"input:\s*\{", content), \
        "input style must be defined"
