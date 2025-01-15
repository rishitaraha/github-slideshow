import json
from collections import defaultdict

from django.db import models
from django.template.loader import render_to_string
from django.templatetags.static import static
from django.utils.safestring import mark_safe
from django_softdelete.models import DeletedManager, SoftDeleteManager, SoftDeleteModel

from iteration_manager.models import Iteration
from layer_manager.models import Feature, Layer
from org_manager.models import Organisation
from rainbow.env_variables import EnvVariable
from shared.models import BaseModel, BatchJob
from shared.validators import validate_color_field
from user_manager.models import CustomUser

from ..constants import HaulRoadLayerType, HaulRoadRiskAnalysisType, UnitOfRange
from ..helpers import get_haul_road_risk_category
from ..managers import HaulRoadRiskAnalysisSettingsManager
from ..schemas import HaulRoadAttributeSchema


class HaulRoadType(BaseModel):
    name = models.TextField()
    org = models.ForeignKey(Organisation, on_delete=models.DO_NOTHING)

    def __str__(self):
        return self.name

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "name",
                    "org",
                ],
                name="unique_haul_road_type",
            ),
        ]
        verbose_name = "Haul Road Type"
        verbose_name_plural = "Haul Road Types"


class HaulRoad(BaseModel, SoftDeleteModel):
    name = models.TextField(max_length=200)
    type = models.ForeignKey(HaulRoadType, on_delete=models.PROTECT)
    vehicle_width = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Vehicle width in meters."
    )
    chainage_interval = models.DecimalField(
        max_digits=5, decimal_places=2, help_text="Interval in meters."
    )
    batch_job = models.OneToOneField(BatchJob, on_delete=models.DO_NOTHING, null=True)
    iteration = models.ForeignKey(Iteration, on_delete=models.DO_NOTHING)
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.DO_NOTHING, related_name="created_haulroads"
    )
    updated_by = models.ForeignKey(
        CustomUser, on_delete=models.DO_NOTHING, related_name="updated_haulroads"
    )

    # Managers.
    objects = SoftDeleteManager()
    deleted_objects = DeletedManager()

    # Methods.
    def get_attributes(self) -> list[HaulRoadAttributeSchema]:
        """
        Returns the attributes of the haul road.
        """

        haul_road_layers = HaulRoadLayer.objects.filter(
            haul_road=self,
            type__in=[
                HaulRoadLayerType.GRADIENT_ANALYSIS.value,
                HaulRoadLayerType.WIDTH_ANALYSIS.value,
            ],
        ).select_related("layer")

        # Map layer types to their objects
        haul_road_layer_map = {
            haul_road_layer.type: haul_road_layer
            for haul_road_layer in haul_road_layers
        }

        # Fetch all features for the haul road gradient and width analysis layer.
        features_by_layer = {
            haul_road_layer.layer_id: Feature.objects.get_features_ordered_by_attribute(
                layer_id=haul_road_layer.layer_id, attribute_name="chain_id"
            )
            for haul_road_layer in haul_road_layers
        }

        # Fetch HRA risk ranges for both analysis types.
        org = self.iteration.site.project.org
        risk_ranges = {
            HaulRoadRiskAnalysisType.GRADIENT_ANALYSIS: HaulRoadRiskAnalysisSettings.objects.get_hra_risk_ranges(
                org=org,
                type=HaulRoadRiskAnalysisType.GRADIENT_ANALYSIS,
                haul_road_type=self.type,
                vehicle_width=self.vehicle_width,
            ),
            HaulRoadRiskAnalysisType.WIDTH_ANALYSIS: HaulRoadRiskAnalysisSettings.objects.get_hra_risk_ranges(
                org=org,
                type=HaulRoadRiskAnalysisType.WIDTH_ANALYSIS,
                haul_road_type=self.type,
                vehicle_width=self.vehicle_width,
            ),
        }

        # Merge attribute of haul road width and gradient analysis layers.
        haul_road_attributes_dict = defaultdict(dict)
        res_list = (
            []
        )  # This list will store references to the dicts in the order they appear.

        for feature in features_by_layer[
            haul_road_layer_map[HaulRoadLayerType.WIDTH_ANALYSIS.value].layer_id
        ]:
            chain_id = feature.attributes["chain_id"]
            res_list.append(haul_road_attributes_dict[chain_id])

            haul_road_attributes_dict[chain_id].update(
                feature.attributes,
                width_risk_category=get_haul_road_risk_category(
                    risk_ranges[HaulRoadRiskAnalysisType.WIDTH_ANALYSIS],
                    float(feature.attributes["chainwidth"]),
                ),
            )

        for feature in features_by_layer[
            haul_road_layer_map[HaulRoadLayerType.GRADIENT_ANALYSIS.value].layer_id
        ]:
            chain_id = feature.attributes["chain_id"]

            if chain_id not in haul_road_attributes_dict:
                res_list.append(haul_road_attributes_dict[chain_id])

            haul_road_attributes_dict[chain_id].update(
                feature.attributes,
                gradient_risk_category=get_haul_road_risk_category(
                    risk_ranges[HaulRoadRiskAnalysisType.GRADIENT_ANALYSIS],
                    float(feature.attributes["gradient"]),
                ),
            )

        return res_list


class HaulRoadLayer(BaseModel, SoftDeleteModel):
    haul_road = models.ForeignKey(HaulRoad, on_delete=models.CASCADE)
    layer = models.OneToOneField(Layer, on_delete=models.CASCADE)
    type = models.TextField(choices=HaulRoadLayerType.choices())

    # Managers.
    objects = SoftDeleteManager()
    deleted_objects = DeletedManager()

    # Properties.
    @property
    def can_edit_features(self) -> bool:
        return self.type not in [
            HaulRoadLayerType.GRADIENT_ANALYSIS.value,
            HaulRoadLayerType.WIDTH_ANALYSIS.value,
        ]

    # Methods.
    def mapbox_style_spec(self) -> dict | None:
        """
        Generate and return the Mapbox style specification for a haul road width and gradient analysis layers according to the risk settings of the org.
        """

        template_context = {
            "map_fonts_base_url": EnvVariable.API_ENGINE_DOMAIN.value
            + static("/map_assets/fonts/"),
        }

        if self.type == HaulRoadLayerType.GRADIENT_ANALYSIS.value:
            template_name = "mapbox_style_specs/hra_gradient_style_spec.json"
            template_context[
                "hra_risk_ranges"
            ] = HaulRoadRiskAnalysisSettings.objects.get_hra_risk_ranges(
                org=self.layer.site.project.org,
                type=HaulRoadRiskAnalysisType.GRADIENT_ANALYSIS,
                haul_road_type=self.haul_road.type,
                vehicle_width=self.haul_road.vehicle_width,
            )

        elif self.type == HaulRoadLayerType.WIDTH_ANALYSIS.value:
            template_name = "mapbox_style_specs/hra_width_style_spec.json"
            template_context[
                "hra_risk_ranges"
            ] = HaulRoadRiskAnalysisSettings.objects.get_hra_risk_ranges(
                org=self.layer.site.project.org,
                type=HaulRoadRiskAnalysisType.WIDTH_ANALYSIS,
                haul_road_type=self.haul_road.type,
                vehicle_width=self.haul_road.vehicle_width,
            )
        else:
            return None

        style_spec = render_to_string(
            template_name,
            template_context,
        )

        return json.loads(style_spec)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=[
                    "layer_id",
                    "haul_road_id",
                ],
                name="unique_haul_road_layer",
            ),
        ]


class HaulRoadRiskAnalysisSettings(BaseModel):
    org = models.ForeignKey(Organisation, on_delete=models.DO_NOTHING)
    type = models.TextField(choices=HaulRoadRiskAnalysisType.choices())
    haul_road_type = models.ForeignKey(HaulRoadType, on_delete=models.DO_NOTHING)
    min_range = models.TextField(
        help_text=mark_safe(
            "Enter a minimum risk value or formula. Use <strong>{vehicle_width}</strong> to represent vehicle width. For example: <strong>{vehicle_width} + 5</strong>."
        )
    )
    max_range = models.TextField(
        help_text=mark_safe(
            "Enter a maximum risk value or formula. Use <strong>{vehicle_width}</strong> to represent vehicle width. For example: <strong>{vehicle_width} * 2 + 5</strong>."
        )
    )
    risk_category = models.TextField()
    color = models.TextField(validators=[validate_color_field])
    unit_of_range = models.TextField(choices=UnitOfRange.choices())

    # Managers.
    objects = HaulRoadRiskAnalysisSettingsManager()

    def __str__(self):
        return f"{self.org.name}: {self.type}"

    class Meta:
        verbose_name = "HRA Risk Setting"
        verbose_name_plural = "HRA Risk Settings"
