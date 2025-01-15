import os
import requests
import json
import sys
from subprocess import PIPE, CalledProcessError, run
import shlex


# To log command output into a file.
def run_command(command: str) -> int:
    try:
        output = run(
            shlex.split(command),
            stdout=PIPE,
            stderr=PIPE,
            check=True,
            universal_newlines=True,
        )
        print(output.stdout)
    except CalledProcessError as cpe:
        print(cpe.stderr)
        sys.exit(cpe.returncode)


# Environment Variables mapping.
api_engine_url = os.environ["API_ENGINE_URL"]
input_s3_key = os.environ["INPUT_S3_KEY"]
output_s3_key = os.environ["OUTPUT_S3_KEY"]
resource_id = os.environ["RESOURCE_ID"]
update_status_url = os.environ["UPDATE_STATUS_URL"]

# Variables
resource_file_local = f"./files/{resource_id}.tif"
slope_map_file_path = f"./files/{resource_id}_slope_map.tif"
slope_map_cog_file_path = f"./files/{resource_id}_slope_map_cog.tif"
s3_input_path = f"s3://{input_s3_key}"
s3_output_path = f"s3://{output_s3_key}"


# API call to update status of the resource's progress.
def update_status(status: str):
    response = requests.patch(
        f"{api_engine_url}/{update_status_url}",
        headers={"Content-Type": "application/json"},
        data=json.dumps({"status": status}),
    )
    print(response.text)
    print("Status updated to " + status)


def generate_slope_map():
    # Start memory, cpu and storage monitoring.
    os.system("sh ./monitor.sh &")

    # Update slope map status to processing.
    update_status("processing")

    # Debug.
    print("Generating Slope Map")

    # Download DSM from S3.
    run_command(f"aws s3 cp {s3_input_path} {resource_file_local}")

    # Creating Slope Map.
    run_command(f"gdaldem slope {resource_file_local} {slope_map_file_path}")
    print("Slope map generated")

    print("Generating Overviews...")

    # gdaladdo to add overviews.
    run_command(f"gdaladdo -r cubic {slope_map_file_path} 2 4 8 16 32")

    # Creating Slope Map Cog.
    print("Generating slope map cog")
    run_command(
        f"gdal_translate {slope_map_file_path} {slope_map_cog_file_path} -of COG -co COPY_SRC_OVERVIEWS=YES -co COMPRESS=LZW -co NUM_THREADS=ALL_CPUS -co BIGTIFF=YES --config GDAL_CACHEMAX 512",
    )

    print("Slope map cog generated")

    if not os.path.exists(slope_map_cog_file_path):
        # Update slope map status to failed.
        update_status("failed")
        print("slope map generation failed")

        exit(1)

    # Upload slope map to s3.
    run_command(
        f"aws s3 cp {slope_map_cog_file_path} {s3_output_path} --storage-class STANDARD_IA"
    )

    # Update slope map status to done.
    update_status("done")


if __name__ == "__main__":
    generate_slope_map()
    exit(0)
