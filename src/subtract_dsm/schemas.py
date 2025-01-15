from pydantic import BaseModel, Field


class SubtractDsmPayload(BaseModel):
    first_dsm_s3_key: str
    second_dsm_s3_key: str
    output_dsm_s3_key: str
    threshold_value: float = Field(
        ge=0, description="The threshold value must be greater than or equal to 0"
    )
    update_status_url: str
