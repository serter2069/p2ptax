"""
Tests for Request file upload feature:
- Frontend has file picker UI (DocumentPicker + ImagePicker)
- Selected files shown as chips with remove button
- Files uploaded after request creation via POST /requests/:id/documents
- Validation: max 5 files, pdf/jpg/png only, max 10MB each
"""

import re
import unittest

class TestFrontendFilePickerImports(unittest.TestCase):
    """Validate new.tsx imports DocumentPicker and ImagePicker."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_document_picker_imported(self):
        """Must import expo-document-picker."""
        self.assertIn("import * as DocumentPicker from 'expo-document-picker'", self.form)

    def test_image_picker_imported(self):
        """Must import expo-image-picker."""
        self.assertIn("import * as ImagePicker from 'expo-image-picker'", self.form)

class TestFrontendFilePickerConstants(unittest.TestCase):
    """Validate file upload constants are defined."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_max_files_constant(self):
        """MAX_FILES must be 5."""
        self.assertIn("const MAX_FILES = 5", self.form)

    def test_max_file_size_constant(self):
        """MAX_FILE_SIZE must be 10 MB."""
        self.assertIn("const MAX_FILE_SIZE = 10 * 1024 * 1024", self.form)

    def test_allowed_mime_types(self):
        """ALLOWED_MIME_TYPES must include pdf, jpeg, png."""
        self.assertIn("'application/pdf'", self.form)
        self.assertIn("'image/jpeg'", self.form)
        self.assertIn("'image/png'", self.form)

    def test_allowed_extensions(self):
        """ALLOWED_EXTENSIONS must include pdf, jpg, jpeg, png."""
        self.assertIn("'pdf'", self.form)
        self.assertIn("'jpg'", self.form)
        self.assertIn("'png'", self.form)

class TestFrontendFilePickerState(unittest.TestCase):
    """Validate file picker state management."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_selected_files_state(self):
        """Must have selectedFiles state."""
        self.assertIn("const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])", self.form)

    def test_file_error_state(self):
        """Must have fileError state."""
        self.assertIn("const [fileError, setFileError] = useState", self.form)

    def test_selected_file_interface(self):
        """Must define SelectedFile interface with uri, name, mimeType, size."""
        self.assertIn("interface SelectedFile", self.form)
        self.assertIn("uri: string", self.form)
        self.assertIn("name: string", self.form)
        self.assertIn("mimeType: string", self.form)
        self.assertIn("size: number", self.form)

class TestFrontendFilePickerFunctions(unittest.TestCase):
    """Validate file picker functions exist."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_pick_document_function(self):
        """Must have pickDocument function using DocumentPicker."""
        self.assertIn("async function pickDocument()", self.form)
        self.assertIn("DocumentPicker.getDocumentAsync", self.form)

    def test_pick_image_function(self):
        """Must have pickImage function using ImagePicker."""
        self.assertIn("async function pickImage()", self.form)
        self.assertIn("ImagePicker.launchImageLibraryAsync", self.form)

    def test_add_files_function(self):
        """Must have addFiles function with validation."""
        self.assertIn("function addFiles(", self.form)

    def test_remove_file_function(self):
        """Must have removeFile function."""
        self.assertIn("function removeFile(", self.form)

    def test_add_files_validates_max_count(self):
        """addFiles must check MAX_FILES limit."""
        # Find addFiles function body
        idx = self.form.index("function addFiles(")
        section = self.form[idx:idx + 600]
        self.assertIn("MAX_FILES", section)

    def test_add_files_validates_mime_type(self):
        """addFiles must validate MIME types."""
        idx = self.form.index("function addFiles(")
        section = self.form[idx:idx + 600]
        self.assertIn("ALLOWED_MIME_TYPES", section)

    def test_add_files_validates_file_size(self):
        """addFiles must validate file size."""
        idx = self.form.index("function addFiles(")
        section = self.form[idx:idx + 900]
        self.assertIn("MAX_FILE_SIZE", section)

class TestFrontendFileUploadOnSubmit(unittest.TestCase):
    """Validate files are uploaded after request creation."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_upload_files_function(self):
        """Must have uploadFiles function."""
        self.assertIn("async function uploadFiles(requestId: string)", self.form)

    def test_upload_uses_form_data(self):
        """uploadFiles must use FormData."""
        idx = self.form.index("async function uploadFiles(")
        section = self.form[idx:idx + 400]
        self.assertIn("new FormData()", section)

    def test_upload_calls_api_upload(self):
        """uploadFiles must call api.upload with /requests/:id/documents."""
        idx = self.form.index("async function uploadFiles(")
        section = self.form[idx:idx + 400]
        self.assertIn("api.upload", section)
        self.assertIn("/documents", section)

    def test_submit_calls_upload_files(self):
        """handleSubmit must call uploadFiles after creating request."""
        idx = self.form.index("async function handleSubmit()")
        section = self.form[idx:idx + 800]
        self.assertIn("uploadFiles(", section)

    def test_submit_gets_request_id(self):
        """handleSubmit must capture created request id."""
        idx = self.form.index("async function handleSubmit()")
        section = self.form[idx:idx + 800]
        self.assertIn("api.post<{ id: string }>", section)

    def test_upload_error_does_not_block_navigation(self):
        """Upload failure should not prevent navigation."""
        idx = self.form.index("async function handleSubmit()")
        section = self.form[idx:idx + 1200]
        # Should have try/catch around uploadFiles
        self.assertIn("catch (uploadErr)", section)
        self.assertIn("router.replace", section)

class TestFrontendFilePickerUI(unittest.TestCase):
    """Validate file picker UI elements exist."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_pdf_button_exists(self):
        """Must have a button to pick PDF documents."""
        self.assertIn("onPress={pickDocument}", self.form)
        self.assertIn("PDF", self.form)

    def test_image_button_exists(self):
        """Must have a button to pick images."""
        self.assertIn("onPress={pickImage}", self.form)

    def test_file_chips_rendered(self):
        """Selected files must be rendered as chips."""
        self.assertIn("fileChip", self.form)
        self.assertIn("fileChipText", self.form)

    def test_remove_button_on_chips(self):
        """Each file chip must have a remove button."""
        self.assertIn("removeFile(index)", self.form)
        self.assertIn("fileChipRemove", self.form)

    def test_file_error_displayed(self):
        """File error must be displayed."""
        self.assertIn("fileError", self.form)

    def test_documents_label_exists(self):
        """Must have a label for the documents section."""
        self.assertIn("Документы", self.form)

    def test_file_hint_exists(self):
        """Must show allowed formats hint."""
        self.assertIn("PDF, JPG, PNG", self.form)
        self.assertIn("10 МБ", self.form)

    def test_buttons_disabled_at_max(self):
        """File picker buttons must be disabled when MAX_FILES reached."""
        self.assertIn("disabled={selectedFiles.length >= MAX_FILES}", self.form)

class TestFrontendFilePickerStyles(unittest.TestCase):
    """Validate file picker styles are defined."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_file_button_style(self):
        self.assertIn("fileButton:", self.form)

    def test_file_button_text_style(self):
        self.assertIn("fileButtonText:", self.form)

    def test_file_chips_row_style(self):
        self.assertIn("fileChipsRow:", self.form)

    def test_file_chip_style(self):
        self.assertIn("fileChip:", self.form)

    def test_file_chip_text_style(self):
        self.assertIn("fileChipText:", self.form)

    def test_file_chip_remove_style(self):
        self.assertIn("fileChipRemove:", self.form)

class TestBackendUploadEndpoint(unittest.TestCase):
    """Validate backend has the upload endpoint."""

    def setUp(self):
        with open("/workspace/api/src/requests/requests.controller.ts") as f:
            self.controller = f.read()

    def test_upload_endpoint_exists(self):
        """POST /requests/:id/documents endpoint must exist."""
        self.assertIn("@Post(':id/documents')", self.controller)

    def test_upload_uses_file_interceptor(self):
        """Upload endpoint must use file interceptor."""
        self.assertIn("AnyFilesInterceptor", self.controller)

    def test_max_file_size_10mb(self):
        """Max file size must be 10 MB."""
        self.assertIn("10 * 1024 * 1024", self.controller)

    def test_max_files_5(self):
        """Max files must be 5."""
        self.assertIn("MAX_REQUEST_DOCUMENTS = 5", self.controller)

    def test_allowed_mime_types(self):
        """Must validate PDF, JPG, PNG MIME types."""
        self.assertIn("application/pdf", self.controller)
        self.assertIn("image/jpeg", self.controller)
        self.assertIn("image/png", self.controller)

class TestPackageDependencies(unittest.TestCase):
    """Validate required packages are in package.json."""

    def setUp(self):
        with open("/workspace/package.json") as f:
            self.pkg = f.read()

    def test_expo_document_picker_installed(self):
        self.assertIn("expo-document-picker", self.pkg)

    def test_expo_image_picker_installed(self):
        self.assertIn("expo-image-picker", self.pkg)

if __name__ == "__main__":
    unittest.main()
