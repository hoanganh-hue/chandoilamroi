# Contributing to ThongTinDoanhNghiep API Client

Thank you for your interest in contributing to this project! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Code of Conduct

This project follows a code of conduct. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/API-thongtindoanhnghiep.git`
3. Create a new branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## Development Setup

### Prerequisites

- Python 3.8 or higher
- pip
- git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/API-thongtindoanhnghiep.git
cd API-thongtindoanhnghiep
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install the package in development mode:
```bash
pip install -e ".[dev]"
```

4. Install pre-commit hooks:
```bash
pre-commit install
```

## Making Changes

### Project Structure

```
API-thongtindoanhnghiep/
├── src/
│   └── thongtindoanhnghiep/          # Main package
│       ├── __init__.py
│       ├── thongtindoanhnghiep_api_client.py
│       ├── config.py
│       └── py.typed
├── tests/                            # Test files
│   ├── __init__.py
│   ├── test_thongtindoanhnghiep_api_client.py
│   └── test_all_endpoints.py
├── examples/                         # Example scripts
│   ├── __init__.py
│   └── check_business.py
├── docs/                            # Documentation
│   ├── reports/                     # Project reports
│   └── *.md
├── scripts/                         # Utility scripts
│   ├── __init__.py
│   ├── api_performance_analysis.csv
│   └── api_test_log.txt
├── .github/
│   └── workflows/
│       └── ci.yml                   # CI/CD pipeline
├── README.md
├── LICENSE
├── requirements.txt
├── setup.py
├── pyproject.toml
├── pytest.ini
├── tox.ini
├── Makefile
└── .pre-commit-config.yaml
```

### Adding New Features

1. Create a new branch from `main`
2. Add your feature to the appropriate module
3. Add tests for your feature
4. Update documentation if needed
5. Run all tests to ensure nothing is broken
6. Submit a pull request

### Bug Fixes

1. Create a new branch from `main`
2. Fix the bug
3. Add tests to prevent regression
4. Update documentation if needed
5. Run all tests
6. Submit a pull request

## Testing

### Running Tests

```bash
# Run all tests
make test

# Run unit tests only
make test-unit

# Run integration tests only
make test-integration

# Run tests with coverage
make test-coverage

# Run specific test file
pytest tests/test_thongtindoanhnghiep_api_client.py -v
```

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Aim for high test coverage

### Test Structure

```python
def test_function_name_should_expected_behavior():
    """Test description."""
    # Arrange
    client = ThongTinDoanhNghiepAPIClient()
    
    # Act
    result = client.some_method()
    
    # Assert
    assert result is not None
    assert result.status == "success"
```

## Code Style

### Python Style

We use the following tools to maintain code quality:

- **Black**: Code formatting
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking

### Running Style Checks

```bash
# Format code
make format

# Run linting
make lint

# Run all checks
make check-all
```

### Style Guidelines

- Follow PEP 8
- Use type hints
- Write docstrings for all public functions
- Keep functions small and focused
- Use meaningful variable names
- Add comments for complex logic

## Submitting Changes

### Pull Request Process

1. Ensure all tests pass
2. Run code style checks
3. Update documentation if needed
4. Add changelog entry
5. Submit pull request with clear description

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Changelog updated
```

## Release Process

1. Update version in `src/thongtindoanhnghiep/__init__.py`
2. Update `CHANGELOG.md`
3. Create release tag
4. Build and publish package

## Getting Help

- Check existing issues
- Create a new issue for bugs
- Use discussions for questions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.