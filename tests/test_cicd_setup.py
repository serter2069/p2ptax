"""Tests for CI/CD project setup — verifies all required files and configs exist."""
import os
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def _read(path):
    with open(os.path.join(ROOT, path)) as f:
        return f.read()

def _read_json(path):
    return json.loads(_read(path))

# --- 1. Project structure ---

def test_readme_exists():
    assert os.path.isfile(os.path.join(ROOT, "README.md"))
    content = _read("README.md")
    assert "P2PTax" in content
    assert "Branch Strategy" in content

def test_gitignore_exists():
    assert os.path.isfile(os.path.join(ROOT, ".gitignore"))
    content = _read(".gitignore")
    assert "node_modules" in content

def test_env_example_exists():
    assert os.path.isfile(os.path.join(ROOT, ".env.example"))

def test_tsconfig_strict():
    tsconfig = _read_json("tsconfig.json")
    assert tsconfig["compilerOptions"]["strict"] is True

def test_package_json_scripts():
    pkg = _read_json("package.json")
    scripts = pkg["scripts"]
    assert "lint" in scripts
    assert "build:web" in scripts
    assert "format" in scripts
    assert "format:check" in scripts
    assert "typecheck" in scripts

# --- 2. CI/CD Pipeline ---

def test_deploy_workflow_exists():
    path = os.path.join(ROOT, ".github/workflows/deploy.yml")
    assert os.path.isfile(path)
    content = _read(".github/workflows/deploy.yml")
    assert "development" in content
    assert "lint" in content.lower()
    assert "build" in content.lower()
    assert "deploy" in content.lower()

def test_deploy_workflow_has_quality_gates():
    content = _read(".github/workflows/deploy.yml")
    assert "npm run lint" in content
    assert "npm run build:web" in content or "expo export" in content

def test_deploy_prod_workflow_exists():
    path = os.path.join(ROOT, ".github/workflows/deploy-prod.yml")
    assert os.path.isfile(path)
    content = _read(".github/workflows/deploy-prod.yml")
    assert "main" in content

def test_deploy_has_version_json():
    content = _read(".github/workflows/deploy.yml")
    assert "version.json" in content

# --- 3. Environment ---

def test_ecosystem_config_exists():
    path = os.path.join(ROOT, "ecosystem.config.js")
    assert os.path.isfile(path)
    content = _read("ecosystem.config.js")
    assert "p2ptax-api" in content

# --- 4. Quality gates ---

def test_eslint_config_exists():
    assert os.path.isfile(os.path.join(ROOT, "eslint.config.mjs"))
    content = _read("eslint.config.mjs")
    assert "typescript-eslint" in content

def test_prettier_config_exists():
    assert os.path.isfile(os.path.join(ROOT, ".prettierrc.json"))
    config = _read_json(".prettierrc.json")
    assert "semi" in config

# --- 5. Branch strategy ---

def test_deploy_workflow_branch_strategy():
    staging = _read(".github/workflows/deploy.yml")
    prod = _read(".github/workflows/deploy-prod.yml")
    assert "development" in staging
    assert "main" in prod
