.PHONY: help install install-dev test test-unit test-integration lint format clean build docs

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install the package
	pip install -e .

install-dev: ## Install the package with development dependencies
	pip install -e ".[dev]"

test: ## Run all tests
	python -m pytest

test-unit: ## Run unit tests only
	python -m pytest tests/test_thongtindoanhnghiep_api_client.py -v

test-integration: ## Run integration tests only
	python -m pytest tests/test_all_endpoints.py -v

test-coverage: ## Run tests with coverage report
	python -m pytest --cov=src/thongtindoanhnghiep --cov-report=html --cov-report=term

lint: ## Run linting
	flake8 src/ tests/ examples/
	mypy src/

format: ## Format code
	black src/ tests/ examples/
	isort src/ tests/ examples/

clean: ## Clean build artifacts
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .mypy_cache/
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

build: ## Build the package
	python -m build

docs: ## Generate documentation
	@echo "Documentation is available in docs/ directory"

security: ## Run security checks
	bandit -r src/
	safety check

ci: ## Run CI pipeline locally
	make lint
	make test
	make security

run-example: ## Run example script
	python examples/check_business.py

check-all: ## Run all checks (lint, test, security)
	make lint
	make test
	make security