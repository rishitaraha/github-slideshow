import os
import zipfile
from pathlib import Path
from typing import Dict, List, Tuple

import rasterio
from rio_tiler.io import Reader
from typing_extensions import TypedDict

from .. import logger


def download_cog_part(
    src, bounds: Tuple[float, float, float, float], output_file_path: str
):
    """
    The function `download_cog_part` downloads a part using bbox (Bounding Box) from a COG (Cloud Optimized Geotiff) using a given
    source and saves it to a file.

    Args:
        - src: The `src` parameter is the input file or dataset from which you want to download a
        part. It could be a file path or a URL to a remote file
        - bbox: The bbox parameter represents the bounding box of the area you want to download. It is
        typically defined as a list or tuple of four values: [minx, miny, maxx, maxy]. These values
        represent the minimum and maximum coordinates of the bounding box in the coordinate system of the
        source data
    """

    try:
        with Reader(src) as src:
            logger.info("Downloading cog part...")
            img = src.part(bounds, dst_crs=src.dataset.crs, buffer=2)
            metadata = {
                "driver": "GTiff",
                "height": img.height,
                "width": img.width,
                "count": img.count,
                "dtype": str(img.data.dtype),
                "crs": src.dataset.crs,
                "transform": img.transform,
                "nodata": src.dataset.nodatavals[0],
            }

        with rasterio.open(output_file_path, "w", **metadata) as dst:
            logger.info("Writing part to disk...")
            dst.write(img.data)

    except Exception:
        logger.exception("COG part download failed", exc_info=True)
    return output_file_path


def extract_zip_file(
    zip_file_path: str, output_dir: str, default_filename: str = None
) -> None:
    """
    Extracts all files from a ZIP archive. Optionally renames them to a default base filename.

    Args:
        zip_file_path : str
            The path to the ZIP file to be extracted.
        output_dir : str
            The directory where the extracted files will be saved.
        default_filename : str, optional
            The base name to assign to all extracted files (extensions will be preserved).
            If None, files will retain their original names.

    Returns:
        None
    """
    try:
        output_dir_path = Path(output_dir)
        output_dir_path.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(zip_file_path, "r") as zip_ref:
            for file_info in zip_ref.infolist():
                # Extract the file
                extracted_path = zip_ref.extract(file_info, output_dir_path)

                # If default_filename is provided, rename the file
                if default_filename:
                    # Get the original extension of the file
                    original_extension = Path(file_info.filename).suffix

                    # Construct the new filename
                    new_filename = f"{default_filename}{original_extension}"

                    # Rename the extracted file
                    new_file_path = output_dir_path / new_filename
                    Path(extracted_path).rename(new_file_path)

        logger.info(f"ZIP file extracted successfully to {output_dir}")
    except Exception as e:
        logger.error(f"An error occurred during zipfile extraction: {e}")


# TODO: Put this in the right place
class ZipShapefileGroupsResult(TypedDict):
    """
    TypedDict for the result of zip_shapefile_groups function.
    """

    zipped_files: Dict[str, str]
    missing_files: Dict[str, List[str]]


def zip_shapefile_groups(
    source_dir: str, output_dir: str, shapefile_groups: list[str]
) -> ZipShapefileGroupsResult:
    """
    Zips shapefiles based on their group names and returns a dictionary containing:
    1. A mapping of group names to ZIP file paths.
    2. A mapping of group names to missing shapefile components.

    Args:
        source_dir (str): Path to the folder containing shapefiles.
        output_dir (str): Path to save the output ZIP files.
        shapefile_groups (List[str]): List of shapefile group names to zip.

    Returns:
        ZipShapefileGroupsResult: A dictionary containing:
            - "zipped_files": Dictionary mapping group names to their corresponding ZIP file paths.
            - "missing_files": Dictionary mapping group names to missing components.
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # Standard shapefile components (mandatory and optional)
    mandatory_shapefile_exts = [".shp", ".shx", ".dbf", ".prj"]
    optional_shapefile_exts = [".cpg"]

    # Initialize dictionaries for results
    zip_mapping: Dict[str, str] = {}
    missing_files: Dict[str, List[str]] = {}

    # Process each shapefile group
    for group in shapefile_groups:
        output_zip = os.path.join(output_dir, f"{group}.zip")
        missing_components: List[str] = []

        with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zipf:
            # Check mandatory files
            for ext in mandatory_shapefile_exts:
                file_path = os.path.join(source_dir, f"{group}{ext}")
                if os.path.exists(file_path):
                    zipf.write(file_path, arcname=os.path.basename(file_path))
                else:
                    missing_components.append(f"{group}{ext}")

            # Check optional files and log warnings if missing
            for ext in optional_shapefile_exts:
                file_path = os.path.join(source_dir, f"{group}{ext}")
                if not os.path.exists(file_path):
                    logger.warning(
                        f"Optional file missing for group {group}: {group}{ext}"
                    )
                else:
                    zipf.write(file_path, arcname=os.path.basename(file_path))

        # If mandatory components are missing, add the group to missing_files
        if missing_components:
            missing_files[group] = missing_components
        else:
            zip_mapping[group] = output_zip
            logger.info(f"Created: {output_zip}")

        if missing_components:
            logger.warning(
                f"Missing mandatory files for group {group}: {missing_components}"
            )

    # Return both mappings in a single dictionary
    return {
        "zipped_files": zip_mapping,
        "missing_files": missing_files,
    }
