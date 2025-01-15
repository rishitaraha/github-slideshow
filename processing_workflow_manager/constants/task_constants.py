from shared.constants import FileType

task_field_file_type_mapping = {
    FileType.OUTPUTS_FOLDER.value: "output_folder_path",
    FileType.PROJECT_FILE.value: "output_project_file_info",
    FileType.POINT_CLOUD.value: "output_dense_point_cloud_file_info",
    FileType.CAPTURED_DSM.value: "output_dem",
    FileType.CAPTURED_DSM_COG.value: "output_dem_cog",
    FileType.ORTHOMOSAIC.value: "output_ortho",
    FileType.ORTHOMOSAIC_COG.value: "output_ortho_cog",
    FileType.ORTHO_TILES.value: "output_ortho_tile_zip",
    FileType.REPORT.value: "output_report",
    FileType.ALL_OUTPUTS.value: "output_all_assets_zip",
}
