"""Test that CI/CD project setup is complete and correct."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read_file(path):
    with open(os.path.join(ROOT, path), "r") as f:
        return f.read()

def test_readme_exists():
    assert os.path.isfile(os.path.join(ROOT, "README.md"))

def test_readme_has_content():
    content = read_file("README.md")
    assert "P2PTax" in content
    assert "Branch Strategy" in content
    assert "CI/CD Pipeline" in content

def test_gitignore_exists():
    assert os.path.isfile(os.path.join(ROOT, ".gitignore"))

def test_env_example_exists():
    assert os.path.isfile(os.path.join(ROOT, ".env.example"))

def test_tsconfig_strict():
    content = read_file("tsconfig.json")
    assert '"strict": true' in content

def test_package_json_has_lint_scripts():
    pkg = json.loads(read_file("package.json"))
    scripts = pkg.get("scripts", {})
    assert "lint" in scripts
    assert "lint:fix" in scripts
    assert "format" in scripts
    assert "format:check" in scripts
    assert "build:web" in scripts
    assert "typecheck" in scripts

def test_eslint_config_exists():
    assert os.path.isfile(os.path.join(ROOT, "eslint.config.mjs"))

def test_prettier_config_exists():
    assert os.path.isfile(os.path.join(ROOT, ".prettierrc"))

def test_prettier_ignore_exists():
    assert os.path.isfile(os.path.join(ROOT, ".prettierignore"))

def test_deploy_workflow_exists():
    assert os.path.isfile(os.path.join(ROOT, ".github", "workflows", "deploy.yml"))

def test_deploy_workflow_has_lint_job():
    content = read_file(".github/workflows/deploy.yml")
    assert "lint:" in content
    assert "npm run lint" in content

def test_deploy_workflow_has_build_job():
    content = read_file(".github/workflows/deploy.yml")
    assert "build:" in content
    assert "expo export --platform web" in content

def test_deploy_workflow_has_validate_job():
    content = read_file(".github/workflows/deploy.yml")
    assert "validate:" in content
    assert "npm run build" in content

def test_deploy_workflow_pipeline_order():
    """lint -> validate -> build -> deploy."""
    content = read_file(".github/workflows/deploy.yml")
    assert "needs: lint" in content
    assert "needs: validate" in content
    assert "needs: build" in content

def test_deploy_prod_workflow_exists():
    assert os.path.isfile(os.path.join(ROOT, ".github", "workflows", "deploy-prod.yml"))

def test_ecosystem_config_exists():
    assert os.path.isfile(os.path.join(ROOT, "ecosystem.config.js"))

def test_ecosystem_config_has_app():
    content = read_file("ecosystem.config.js")
    assert "p2ptax-api" in content
    assert "dist/main.js" in content

def test_nginx_config_exists():
    assert os.path.isfile(os.path.join(ROOT, "docs", "nginx.conf"))

def test_nginx_config_has_proxy():
    content = read_file("docs/nginx.conf")
    assert "proxy_pass" in content
    assert "p2ptax.smartlaunchhub.com" in content

def test_branch_development_trigger():
    content = read_file(".github/workflows/deploy.yml")
    assert "development" in content

def test_branch_main_trigger():
    content = read_file(".github/workflows/deploy-prod.yml")
    assert "main" in content

def test_version_json_in_deploy():
    content = read_file(".github/workflows/deploy.yml")
    assert "version.json" in content

def test_eslint_devdeps():
    pkg = json.loads(read_file("package.json"))
    dev = pkg.get("devDependencies", {})
    assert "eslint" in dev
    assert "@typescript-eslint/eslint-plugin" in dev
    assert "@typescript-eslint/parser" in dev
    assert "prettier" in dev
