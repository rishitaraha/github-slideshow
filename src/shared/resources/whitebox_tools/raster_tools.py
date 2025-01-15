from ...helpers import run_command
from .constants import ResamplingAlgorithm


def resample_raster(
    input_file_path,
    output_path,
    reference_file_path,
    resampling_algorithm=ResamplingAlgorithm.NEAREST_NEIGHBOR.value,
):
    """
    Changes the resolution of a raster.
    """

    command = [
        "whitebox_tools",
        "-r=Resample",
        "-v",
        f"-i={input_file_path}",
        f"-o={output_path}",
        f"--base={reference_file_path}",
        f"--method={resampling_algorithm}",
    ]

    run_command(command)
