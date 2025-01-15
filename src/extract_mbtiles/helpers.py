import os

from ..shared import logger


def extract_mbtiles(input_file_path: str, output_dir_path: str) -> None:
    """
    Extract MBTiles to a specified output directory.

    Args:
        input_file_path: The input path to the MBTiles file to be extracted.
        output_dir_path: The output directory path where the extracted files will be stored.

    Returns:
        None

    Raises:
        Exception: If the MBTiles file does not exist or if the extraction process fails.
    """
    # Check if input file exists.
    if not os.path.exists(input_file_path):
        logger.error(f"Input file {input_file_path} does not exist")
        raise Exception(f"Input file {input_file_path} does not exist")

    # Running mb-util command to extract mbtiles.
    logger.info(f"Extracting mbtiles from {input_file_path} to {output_dir_path}")
    result = os.system(f"mb-util {input_file_path} {output_dir_path}")

    if result != 0:
        logger.error("Mbtiles extraction failed")
        raise Exception("Mbtiles extraction failed")

    logger.info("Mbtiles extracted successfully")
