"""
Tests for Request title field: separate title and description in creation, storage, and display.

Validates acceptance criteria from the SA gap issue.
"""

import re
import unittest

class TestCreateRequestDto(unittest.TestCase):
    """Validate create-request.dto.ts has separate title and description validation."""

    def setUp(self):
        with open("/workspace/api/src/requests/dto/create-request.dto.ts") as f:
            self.dto = f.read()

    def test_title_field_is_required(self):
        """title must be a required field with IsNotEmpty."""
        self.assertIn("@IsNotEmpty({ message: 'title is required' })", self.dto)

    def test_title_min_length_3(self):
        """title must have MinLength(3)."""
        self.assertIn("@MinLength(3", self.dto)

    def test_title_max_length_100(self):
        """title must have MaxLength(100)."""
        self.assertIn("@MaxLength(100, { message: 'title must be at most 100 characters' })", self.dto)

    def test_title_is_not_optional(self):
        """title must not use ValidateIf or be optional."""
        # Should not have ValidateIf on title
        self.assertNotIn("@ValidateIf((o) => !o.description)", self.dto)

    def test_description_field_is_required(self):
        """description must be a required field with IsNotEmpty."""
        self.assertIn("@IsNotEmpty({ message: 'description is required' })", self.dto)

    def test_description_min_length_10(self):
        """description must have MinLength(10)."""
        self.assertIn("@MinLength(10", self.dto)

    def test_description_max_length_2000(self):
        """description must have MaxLength(2000)."""
        self.assertIn("@MaxLength(2000", self.dto)

    def test_description_is_not_optional(self):
        """description must not use ValidateIf or be optional."""
        self.assertNotIn("@ValidateIf((o) => !o.title)", self.dto)

    def test_both_fields_use_non_null_assertion(self):
        """Both title and description should use ! (required) not ? (optional)."""
        self.assertIn("title!: string;", self.dto)
        self.assertIn("description!: string;", self.dto)

class TestRequestsServiceCreate(unittest.TestCase):
    """Validate requests.service.ts create() stores both title and description."""

    def setUp(self):
        with open("/workspace/api/src/requests/requests.service.ts") as f:
            self.service = f.read()

    def test_no_title_to_description_alias(self):
        """create() must NOT alias title to description."""
        self.assertNotIn("dto.description || dto.title", self.service)

    def test_title_stored_in_create_data(self):
        """create() must include title in prisma.request.create data."""
        # Find the create() method and check it has title in data
        create_section = self.service[self.service.index("async create(clientId"):]
        create_section = create_section[:create_section.index("return created;")]
        self.assertIn("title,", create_section)
        self.assertIn("title", create_section)

    def test_description_stored_separately(self):
        """create() must include description in prisma.request.create data."""
        create_section = self.service[self.service.index("async create(clientId"):]
        create_section = create_section[:create_section.index("return created;")]
        self.assertIn("description,", create_section)

    def test_title_validation_in_create(self):
        """create() must validate title separately."""
        create_section = self.service[self.service.index("async create(clientId"):]
        create_section = create_section[:create_section.index("return created;")]
        self.assertIn("title", create_section)
        self.assertIn("title.trim().length < 3", create_section)

    def test_description_validation_in_create(self):
        """create() must validate description separately."""
        create_section = self.service[self.service.index("async create(clientId"):]
        create_section = create_section[:create_section.index("return created;")]
        self.assertIn("description.trim().length < 10", create_section)

    def test_find_recent_includes_title(self):
        """findRecent() must include title in select."""
        recent_section = self.service[self.service.index("async findRecent("):]
        recent_section = recent_section[:recent_section.index("async create")]
        self.assertIn("title: true", recent_section)

    def test_find_public_by_id_includes_title(self):
        """findPublicById() must include title in select."""
        public_section = self.service[self.service.index("async findPublicById("):]
        self.assertIn("title: true", public_section[:500])

    def test_find_my_responses_includes_title(self):
        """findMyResponses() must include title in request select."""
        responses_section = self.service[self.service.index("async findMyResponses("):]
        responses_section = responses_section[:500]
        self.assertIn("title: true", responses_section)

class TestFrontendNewRequestForm(unittest.TestCase):
    """Validate frontend form has separate title and description fields."""

    def setUp(self):
        with open("/workspace/app/(dashboard)/my-requests/new.tsx") as f:
            self.form = f.read()

    def test_title_state_exists(self):
        """Form must have title state variable."""
        self.assertIn("const [title, setTitle] = useState('')", self.form)

    def test_title_input_exists(self):
        """Form must have a Title input field."""
        self.assertIn('label="Заголовок"', self.form)

    def test_title_in_request_body(self):
        """handleSubmit must include title in request body."""
        self.assertIn("title: title.trim()", self.form)

    def test_title_validation(self):
        """validate() must check title length >= 3."""
        self.assertIn("title.trim().length < 3", self.form)

    def test_description_validation_min_10(self):
        """validate() must check description length >= 10."""
        self.assertIn("description.trim().length < 10", self.form)

    def test_title_error_state(self):
        """Error state must include title field."""
        self.assertIn("title?: string", self.form)

class TestFeedDisplaysTitle(unittest.TestCase):
    """Validate public feed shows title as heading."""

    def setUp(self):
        with open("/workspace/app/requests/index.tsx") as f:
            self.feed = f.read()

    def test_request_item_has_title(self):
        """RequestItem interface must have title field."""
        self.assertIn("title?: string;", self.feed)

    def test_title_rendered_in_card(self):
        """Card must render item.title."""
        self.assertIn("item.title", self.feed)

    def test_card_title_style_exists(self):
        """cardTitle style must be defined."""
        self.assertIn("cardTitle:", self.feed)

    def test_title_shown_as_heading(self):
        """Title must be rendered with cardTitle style (heading)."""
        self.assertIn("styles.cardTitle", self.feed)

class TestPrismaSchemaHasTitleField(unittest.TestCase):
    """Validate Prisma schema has title field on Request model."""

    def setUp(self):
        with open("/workspace/api/prisma/schema.prisma") as f:
            self.schema = f.read()

    def test_request_model_has_title(self):
        """Request model must have title String field."""
        request_match = re.search(
            r"model Request \{[^}]*title\s+String[^}]*\}",
            self.schema,
            re.DOTALL,
        )
        self.assertIsNotNone(request_match, "title String not found in Request model")

    def test_request_model_has_description(self):
        """Request model must have description String field."""
        request_match = re.search(
            r"model Request \{[^}]*description\s+String[^}]*\}",
            self.schema,
            re.DOTALL,
        )
        self.assertIsNotNone(request_match, "description String not found in Request model")

if __name__ == "__main__":
    unittest.main()
