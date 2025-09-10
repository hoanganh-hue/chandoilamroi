from setuptools import setup, find_packages
import os

# Read README
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

# Read requirements
with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

# Read version from package
def get_version():
    version_file = os.path.join("src", "thongtindoanhnghiep", "__init__.py")
    with open(version_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("__version__"):
                return line.split("=")[1].strip().strip('"').strip("'")
    return "1.0.0"

setup(
    name="thongtindoanhnghiep-api-client",
    version=get_version(),
    author="API Development Team",
    author_email="dev@example.com",
    description="Python client for ThongTinDoanhNghiep.co API",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/your-username/API-thongtindoanhnghiep",
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Internet :: WWW/HTTP :: Dynamic Content",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "responses>=0.23.0",
            "flake8>=5.0.0",
            "black>=22.0.0",
            "mypy>=1.0.0",
            "bandit>=1.7.0",
            "safety>=2.0.0",
        ],
        "test": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "responses>=0.23.0",
        ],
    },
    include_package_data=True,
    package_data={
        "thongtindoanhnghiep": ["py.typed"],
    },
    project_urls={
        "Bug Reports": "https://github.com/your-username/API-thongtindoanhnghiep/issues",
        "Source": "https://github.com/your-username/API-thongtindoanhnghiep",
        "Documentation": "https://github.com/your-username/API-thongtindoanhnghiep#readme",
    },
    keywords="api client thongtindoanhnghiep business information vietnam",
    zip_safe=False,
)