"""Test that app/specialists/[nick].tsx has required react-native imports."""
import re

FILE_PATH = "app/specialists/[nick].tsx"

def read_file():
    with open(FILE_PATH, "r") as f:
        return f.read()

def test_stylesheet_imported():
    content = read_file()
    assert re.search(r"import\s*\{[^}]*StyleSheet[^}]*\}\s*from\s*['\"]react-native['\"]", content), \
        "StyleSheet must be imported from react-native"

def test_view_imported():
    content = read_file()
    assert re.search(r"import\s*\{[^}]*\bView\b[^}]*\}\s*from\s*['\"]react-native['\"]", content), \
        "View must be imported from react-native"

def test_text_imported():
    content = read_file()
    assert re.search(r"import\s*\{[^}]*\bText\b[^}]*\}\s*from\s*['\"]react-native['\"]", content), \
        "Text must be imported from react-native"

def test_activity_indicator_imported():
    content = read_file()
    assert re.search(r"import\s*\{[^}]*ActivityIndicator[^}]*\}\s*from\s*['\"]react-native['\"]", content), \
        "ActivityIndicator must be imported from react-native"

def test_safe_area_view_imported():
    content = read_file()
    assert re.search(r"import\s*\{[^}]*SafeAreaView[^}]*\}\s*from\s*['\"]react-native['\"]", content), \
        "SafeAreaView must be imported from react-native"

def test_stylesheet_used_after_import():
    """Ensure StyleSheet.create is present and would work with the import."""
    content = read_file()
    assert "StyleSheet.create(" in content, "StyleSheet.create() must be used in the file"
    # Verify import comes before usage
    import_pos = content.find("StyleSheet")
    create_pos = content.find("StyleSheet.create(")
    assert import_pos < create_pos, "StyleSheet import must come before StyleSheet.create()"
