from pathlib import Path
from typing import List, Tuple, Union

import numpy as np
from osgeo.gdal import (
    Band,
    Dataset,
    Driver,
    GDT_Float32,
    GetDriverByName,
    Grid,
    GridOptions,
    Open,
    Warp,
    WarpOptions,
)
from osgeo.osr import SpatialReference
from osgeo_utils.samples.gdallocationinfo import gdallocationinfo_util

from .schemas import RasterInfoSchema


def get_elevation(
    file_path_or_ds: Union[Dataset, str],
    xy_coordinates: List[Tuple[int, int]],
    input_epsg=4326,
    axis_order=0,
    allow_xy_outside_extent=False,
    new_nodata_value=None,
) -> List[int]:
    """
    This function will return a list of elevation of all points respectively.

    Arguments:
        - file_path_or_ds: It can be path of dsm or gdal dataset
        - xy: A list of tuples with x and y coordinate, i.e [(x, y)]
        - input_epsg: epsg value of xy crs
        - axis_order: https://gdal.org/tutorials/osr_api_tut.html#crs-and-axis-order
    """

    # Separating x and y into two lists.
    x, y = zip(*xy_coordinates)

    try:
        # https://gdal.org/programs/gdallocationinfo.html
        elevation = gdallocationinfo_util(
            file_path_or_ds,
            x,
            y,
            srs=f"EPSG:{input_epsg}",
            band_nums=1,
            axis_order=axis_order,
            allow_xy_outside_extent=allow_xy_outside_extent,
        )[0]

        if new_nodata_value is not None:
            if isinstance(file_path_or_ds, Dataset):
                band = file_path_or_ds.GetRasterBand(1)
                nodata_value = band.GetNoDataValue()
            else:
                dataset = Open(file_path_or_ds)
                band = dataset.GetRasterBand(1)
                nodata_value = band.GetNoDataValue()
                del dataset

            elevation[elevation == nodata_value] = new_nodata_value

        return elevation.tolist()

    except Exception as exc:
        raise exc


def grid_creation(
    input_file: str,
    output_path: str,
    output_shape: Tuple[int, int],
    output_bound: Tuple[int, int, int, int],
    output_srs: int,
    no_data_value: int = -32767,
) -> Dataset:
    """
    Creates grid using Linear Interpolation algorithm.
    Creating grid means creating another dsm from some known points.
    Ref: https://gdal.org/tutorials/gdal_grid_tut.html

    Args:
        input_file: Input file with some known elevation points
        output_path: Path where output is going to save
        output_shape: tuple of width and height, i.e: (width, height)
        output_bound: bound of output i.e: (upper_left_x, upper_left_y, lower_right_x, lower_right_y)
        output_srs: crs of output.
        no_data_value: no data value.
    """
    grid_options = GridOptions(
        format="GTiff",
        algorithm="linear",
        outputBounds=output_bound,
        width=output_shape[0],
        height=output_shape[1],
        outputSRS=f"EPSG:{output_srs}",
        noData=no_data_value,
    )

    output_ds = Grid(output_path, input_file, options=grid_options)
    return output_ds


def get_raster_info(dataset: Dataset) -> RasterInfoSchema:
    """
    Returns shape and bounds of dataset.

    Args:
        - dataset: gdal dataset
    """

    x_size = dataset.RasterXSize
    y_size = dataset.RasterYSize

    (
        upper_left_x,
        pixel_resolution_x,
        _,
        upper_left_y,
        _,
        pixel_resolution_y,
    ) = dataset.GetGeoTransform()

    lower_right_x = upper_left_x + x_size * pixel_resolution_x
    lower_right_y = upper_left_y + y_size * pixel_resolution_y

    bounds = (upper_left_x, upper_left_y, lower_right_x, lower_right_y)

    raster_info: RasterInfoSchema = {
        "shape": (x_size, y_size),
        "bounds": bounds,
        "resolution": (pixel_resolution_x, pixel_resolution_y),
        "epsg": dataset.GetSpatialRef().GetAttrValue("AUTHORITY", 1),
        "unit": dataset.GetSpatialRef().GetAttrValue("UNIT"),
        "gsd": pixel_resolution_x,
        "nodata_value": dataset.GetRasterBand(1).GetNoDataValue(),
        "geo_transform": dataset.GetGeoTransform(),
        "projection": dataset.GetProjection(),
        "srs": dataset.GetSpatialRef(),
        "metadata": dataset.GetMetadata(),
    }

    return raster_info


def crop_raster(
    raster_ds_or_path: Union[Dataset, str],
    geometry_file_path: str,
    output_path: str = None,
    nodata_value: float = 0,
    destination_srs: SpatialReference = None,
) -> Dataset:
    """
    Crop the raster with geometry.

    Args:
        - raster_ds_or_path: It can be path of raster or gdal dataset
        - geometry_file_path: Path of geometry vector file
        - output_path: Path where output is going to save
        - nodata_value: nodata_value of output file
        - destination_srs: CRS of output file
    """

    warp_options = WarpOptions(
        cutlineDSName=geometry_file_path,
        cropToCutline=True,
        copyMetadata=True,
        dstNodata=nodata_value,
        format="GTiff" if output_path else "vrt",
        dstSRS=destination_srs,
    )

    crop_dataset = Warp(output_path or "", raster_ds_or_path, options=warp_options)
    return crop_dataset


def create_dsm_geotiff(
    dataset_array: np.ndarray,
    output_path: str,
    dsm_info: RasterInfoSchema,
):
    """
    Creates dsm geotiff file from a numpy array.

    Args:
       - dataset_array: numpy array of elevation
       - output_path: Path where geotiff file is going to save.
       - dsm_info: Info of output file.
    """

    # Creating output dir if not exists.
    output_directory = output_path.rsplit("/", 1)[0]
    Path(output_directory).mkdir(parents=True, exist_ok=True)

    # Creating a single band raster dataset.
    driver: Driver = GetDriverByName("GTiff")
    raster: Dataset = driver.Create(
        output_path,
        dsm_info["shape"][0],
        dsm_info["shape"][1],
        1,
        GDT_Float32,
    )

    # Assigning metadata.
    raster.SetGeoTransform(dsm_info["geo_transform"])
    raster.SetMetadata(dsm_info["metadata"])
    raster.SetSpatialRef(dsm_info["srs"])
    raster.SetProjection(dsm_info["projection"])

    # Adding dataset_array to band 1.
    band: Band = raster.GetRasterBand(1)
    band.WriteArray(dataset_array)
    band.SetNoDataValue(dsm_info["nodata_value"])

    del band
    del raster
