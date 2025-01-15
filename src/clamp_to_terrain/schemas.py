from typing import Tuple

from pydantic import BaseModel, field_validator

from ..shared.helpers import unwrap_list


class ClampToTerrainPayload(BaseModel):
    layer_id: str
    dsm_cog_s3_key: str
    bounds: Tuple[float, float, float, float]
    update_status_url: str

    @field_validator("bounds", mode="before")
    def validate_bounds(cls, value):
        bounds = unwrap_list(value)

        # Converting the list items to floats.
        bounds = list(map(float, bounds))

        if len(bounds) != 4:
            raise ValueError("Invalid bound")

        return bounds
