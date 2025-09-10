from typing import List, Dict, Any, Optional
import pandas as pd
from pathlib import Path

# Define a more specific type hint for a row of data
RowData = Dict[str, Any]

def read_excel_data(file_path: str) -> Optional[List[RowData]]:
    """
    Reads data from an Excel file and returns it as a list of dictionaries.

    Each dictionary represents a row, with column headers as keys.
    All data is read as strings to preserve formatting (e.g., leading zeros).

    Args:
        file_path: The path to the Excel file.

    Returns:
        A list of dictionaries representing the rows, or None if the file
        cannot be read.
    """
    path = Path(file_path)
    if not path.exists() or not path.is_file():
        print(f"Error: Input file not found at '{file_path}'")
        return None

    try:
        # Use dtype=str to ensure all data, like CCCD or phone numbers with leading zeros, is preserved as text.
        df = pd.read_excel(path, dtype=str)
        
        # Fill NaN values (empty cells) with empty strings for consistency
        df = df.fillna('')
        
        # Convert the DataFrame to a list of dictionaries
        return df.to_dict(orient='records')
    except Exception as e:
        print(f"Error reading Excel file '{file_path}': {e}")
        return None


def write_data_to_excel(data: List[RowData], output_path: str, original_headers: List[str]) -> bool:
    """
    Writes a list of dictionaries to a new Excel file.

    This function writes all data in a single operation to prevent file corruption
    and race conditions that can occur with row-by-row writing.

    Args:
        data: A list of dictionaries, where each dictionary is a row.
        output_path: The path for the output Excel file.
        original_headers: The list of original column headers to ensure order.

    Returns:
        True if the write operation was successful, False otherwise.
    """
    if not data:
        print("Warning: No data provided to write to Excel.")
        return True # Considered successful as there's nothing to do.

    output_file = Path(output_path)
    
    # Ensure the parent directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        df = pd.DataFrame(data)

        # Reorder columns to match the original input file's structure
        # and add new columns if they are not in the original headers.
        final_headers = original_headers + [col for col in df.columns if col not in original_headers]
        df = df[final_headers]
        
        # Write the DataFrame to an Excel file
        # 'index=False' prevents pandas from writing row indices into the file.
        df.to_excel(output_file, index=False, engine='openpyxl')
        print(f"Successfully wrote {len(data)} rows to '{output_path}'")
        return True
    except Exception as e:
        print(f"Error writing to Excel file '{output_path}': {e}")
        return False
