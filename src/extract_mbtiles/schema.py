from pydantic import BaseModel


class ExtractMbtilesPayload(BaseModel):
    input_s3_uri: str
    output_s3_uri: str
    update_status_url: str
    update_properties_url: str
