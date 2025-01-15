import os
from typing import Dict
import requests
import json

# Sentry init
if os.environ["SENTRY_DSN"] and os.environ["ENVIRONMENT"] in ["uat", "production"]:
    import sentry_sdk

    sentry_sdk.init(
        dsn="https://34176f9fb63248ab81cf7d7752e53d0c@o1240330.ingest.sentry.io/4504173921173504",
        # Set traces_sample_rate to 1.0 to capture 100%
        # of transactions for performance monitoring.
        # We recommend adjusting this value in production.
        traces_sample_rate=1.0,
    )

# Environment Variables mapping.
api_engine_url = os.environ["API_ENGINE_URL"]
input_s3_key = os.environ["INPUT_S3_KEY"]
output_s3_key = os.environ["OUTPUT_S3_KEY"]
resource_id = os.environ["RESOURCE_ID"]
update_status_url = os.environ["UPDATE_STATUS_URL"]
update_properties_url = os.environ["UPDATE_PROPERTIES_URL"]

# Variables
resource_file_local = f"./files/{resource_id}.mbtiles"
output_files_path = f"./files/{resource_id}"
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


# API call to update/add to properties of the resource.
def update_properties(properties: dict):
    response = requests.patch(
        f"{api_engine_url}{update_properties_url}",
        headers={"Content-Type": "application/json"},
        data=json.dumps({"properties": properties}),
    )
    print(response.text)
    print("Properties added/updated with " + str(properties))


if __name__ == "__main__":
    # Start memory, cpu and storage monitoring.
    os.system("sh ./monitor.sh &")

    # Update mbtiles status to processing.
    update_status("processing")

    # Debug.
    print("Extracting mbtiles......")

    # Download mbtiles file from S3.
    os.system(f"aws s3 cp {s3_input_path} {resource_file_local}")

    # Extract mbtiles from mbtiles file.
    os.system(f"mb-util {resource_file_local} {output_files_path}")

    if not os.path.isdir(output_files_path):
        # Update mbtiles status to failed.
        update_status("failed")
        print("Mbtiles extraction failed")

        exit(1)

    # Upload mbtiles to s3.
    os.system(f"aws s3 cp {output_files_path} {s3_output_path} --recursive")

    # Update mbtiles status to done.
    update_status("done")

    # Load metadata.json file
    f = open(f"{output_files_path}/metadata.json")
    data = json.load(f)
    updated_properties = {}
    if bounds := data["bounds"]:
        updated_properties["bounds"] = bounds.split(",")
    else:
        print("Bounds not found in metadata")

    if minZoom := data.get("minzoom"):
        updated_properties["minzoom"] = minZoom
    if maxZoom := data.get("maxzoom"):
        updated_properties["maxzoom"] = maxZoom

    update_properties(updated_properties)

    # Closing file
    f.close()

    # Delete all temp files.
    os.system(f"rm -rv {output_files_path} {resource_file_local}")

    exit(0)
