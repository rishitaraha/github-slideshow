# Custom Migration script to make all iterations with self hosted terrain.

from django.db import migrations


def create_terrain_tile_batch_jobs(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        (
            "iteration_manager",
            "0008_rename_volume_heapboundary_cut_volume_and_more",
        ),
        (
            "shared",
            "0012_rename_filename_fileinfo_name_and_more",
        ),
    ]

    operations = [
        migrations.RunPython(create_terrain_tile_batch_jobs),
    ]
