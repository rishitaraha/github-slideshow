import os
import requests
import json

# Environment Variables mapping.
api_engine_url = os.environ["API_ENGINE_URL"]
input_s3_key = os.environ["INPUT_S3_KEY"]
output_s3_key = os.environ["OUTPUT_S3_KEY"]
resource_id = os.environ["RESOURCE_ID"]
update_status_url = os.environ["UPDATE_STATUS_URL"]
update_properties_url = os.environ["UPDATE_PROPERTIES_URL"]

# Variables

resource_file_local = f"./files/{resource_id}.gpkg"
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


def generate_mvt():
    # Update mvt status to processing.
    update_status("processing")

    # Debug.
    print("Generating MVT")

    # Download vector file from S3.
    os.system(f"aws s3 cp {s3_input_path} {resource_file_local}")

    # creating mvt.
    os.system(
        f"ogr2ogr -f MVT {output_files_path} {resource_file_local} -dsco MINZOOM=10 -dsco MAXZOOM=22 -progress"
    )
    print("MVT generated")
    if not os.path.isdir(output_files_path):
        # Update MVT status to failed.
        update_status("failed")
        print("MVT generation failed")

        exit(1)

    # Upload MVT to s3.
    os.system(f"aws s3 cp {output_files_path} {s3_output_path} --recursive")

    # Update MVT status to done.
    update_status("done")

    # Load metadata.json file
    metadata_file = open(f"{output_files_path}/metadata.json", "r")
    metadata = json.load(metadata_file)

    if bounds := metadata.get("bounds"):
        metadata["bounds"] = bounds.split(",")

    if center := metadata.get("center"):
        metadata["center"] = center.split(",")

    metadata.pop("json", None)
    metadata.pop("type", None)
    metadata.pop("name", None)
    metadata.pop("description", None)

    update_properties(metadata)

    # Closing file
    metadata_file.close()


if __name__ == "__main__":
    generate_mvt()
    exit(0)
