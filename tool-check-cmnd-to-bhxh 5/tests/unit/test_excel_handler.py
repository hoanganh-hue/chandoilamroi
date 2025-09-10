import pytest
import pandas as pd
from pathlib import Path
from src.core.excel_handler import read_excel_data, write_data_to_excel

# Use a temporary directory provided by pytest for test artifacts
@pytest.fixture
def temp_dir(tmp_path: Path) -> Path:
    """Creates a temporary directory for test files."""
    return tmp_path

@pytest.fixture
def sample_excel_file(temp_dir: Path) -> str:
    """Creates a sample Excel file for testing the read function."""
    file_path = str(temp_dir / "test_input.xlsx")
    data = {
        "Số CCCD": ["012345678901", "098765432109"],
        "HỌ VÀ TÊN": ["Nguyễn Văn A", "Trần Thị B"],
        "ĐỊA CHỈ": ["Số 1, Hà Nội", "Số 2, TPHCM"]
    }
    df = pd.DataFrame(data)
    df.to_excel(file_path, index=False, engine='openpyxl')
    return file_path

def test_read_excel_data_success(sample_excel_file: str):
    """
    Tests successful reading of a valid Excel file.
    """
    # Act
    data = read_excel_data(sample_excel_file)

    # Assert
    assert data is not None
    assert isinstance(data, list)
    assert len(data) == 2
    # Check if data is read as strings
    assert data[0]["Số CCCD"] == "012345678901"
    assert data[1]["HỌ VÀ TÊN"] == "Trần Thị B"

def test_read_excel_data_file_not_found():
    """
    Tests the case where the input file does not exist.
    """
    # Act
    data = read_excel_data("non_existent_file.xlsx")

    # Assert
    assert data is None

def test_read_excel_empty_file(temp_dir: Path):
    """
    Tests reading an empty Excel file.
    """
    file_path = str(temp_dir / "empty.xlsx")
    pd.DataFrame([]).to_excel(file_path, index=False)
    
    # Act
    data = read_excel_data(file_path)

    # Assert
    assert data == []

def test_write_data_to_excel_success(temp_dir: Path):
    """
    Tests successful writing of data to an Excel file.
    """
    # Arrange
    output_path = str(temp_dir / "test_output.xlsx")
    sample_data = [
        {"HỌ VÀ TÊN": "Nguyễn Văn A", "MÃ BHXH": "1234567890", "NGÀY SINH": "01/01/1990"},
        {"HỌ VÀ TÊN": "Trần Thị B", "MÃ BHXH": "0987654321", "NGÀY SINH": "02/02/1992"}
    ]
    original_headers = ["HỌ VÀ TÊN", "MÃ BHXH", "NGÀY SINH"]

    # Act
    success = write_data_to_excel(sample_data, output_path, original_headers)
    
    # Assert
    assert success is True
    assert Path(output_path).exists()
    
    # Verify content
    df = pd.read_excel(output_path)
    assert len(df) == 2
    assert df.columns.tolist() == original_headers
    assert df.iloc[0]["MÃ BHXH"] == 1234567890 # Note: pandas may read numbers as numeric types

def test_write_data_empty_list(temp_dir: Path):
    """
    Tests writing an empty list of data. Should be a successful no-op.
    """
    # Arrange
    output_path = str(temp_dir / "empty_output.xlsx")
    
    # Act
    success = write_data_to_excel([], output_path, [])

    # Assert
    assert success is True
    assert not Path(output_path).exists() # File should not be created for empty data

def test_write_data_permission_error(temp_dir: Path, mocker):
    """
    Tests handling of a permission error during writing.
    This requires mocking the to_excel method to raise an exception.
    """
    # Arrange
    output_path = str(temp_dir / "protected_output.xlsx")
    sample_data = [{"col1": "val1"}]
    
    # Mock DataFrame.to_excel to raise a PermissionError
    mocker.patch(
        'pandas.DataFrame.to_excel',
        side_effect=PermissionError("Permission denied")
    )

    # Act
    success = write_data_to_excel(sample_data, output_path, ["col1"])
    
    # Assert
    assert success is False
