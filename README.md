# Tile Server

A microservice for serving the map tiles

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Development Guide](#development-guide)

## Requirements

- Linux/Mac/Windows with at least 2 GB memory
- Docker Engine v20.x and docker-compose v1.29.x

## Installation

The development server can be brought up with

```bash
sudo docker-compose up
```

Run this in the base directory where `docker-compose.yml` file is present.

This command will spin the container.

Once the services are up. You can access the API using http://localhost:8000

If for some reason you need to rebuild your images then use this command.

```bash
sudo docker-compose up --build
```

**_You can reference the `env.sample` file for the required environment variables and create a `.env.local` file that contains all the variables listed in the `.env.sample` file._**

### Required DB changes for vector tile

Please don't forget to create the `get_tile` postgres function in your database to enable dynamic vector tile functionality.

#### Function Description

The function is designed to generate Mapbox Vector Tiles (MVT) for a specified target layer, zoom level, and tile coordinates.

#### Function Parameters

- `target_layer_id`: A UUID representing the target layer.
- `zoom_level`: An integer indicating the zoom level.
- `tile_x`: An integer representing the tile's X-coordinate.
- `tile_y`: An integer representing the tile's Y-coordinate.

#### How to Create and Use the Function

1. **Connect to your PostGIS database.**

2. **Create the function** using the provided SQL query:

   ```sql
    CREATE OR REPLACE FUNCTION get_tile(target_layer_id UUID, zoom_level INT, tile_x INT, tile_y INT)
    RETURNS TABLE (tile bytea) AS $$
    DECLARE
    bounds geometry;
    BEGIN
    RETURN QUERY
    -- Convert ZXY coordinates to bounding box coordinates.
    WITH bounds AS (
        SELECT ST_TileEnvelope(zoom_level, tile_x, tile_y) AS geom,
            ST_TileEnvelope(zoom_level, tile_x, tile_y)::box2d AS b2d
    ),

    -- Transform and filter geometries that intersect with the bounding box.
    mvtgeom AS (
        -- TODO: Remove ST_Force2D when this issue get fixed in GEOS. See https://trac.osgeo.org/postgis/ticket/4690

        -- Add attributes with geometry.
        SELECT ST_AsMVTGeom(ST_Transform(ST_Force2D(feature_table.geometry), 3857), bounds.b2d) AS geom, feature_table.id, feature_table.type, feature_table.properties->>'text' as textbox_text
        FROM layer_manager_feature feature_table, bounds
        WHERE ST_Intersects(feature_table.geometry, ST_Transform(bounds.geom, 4326)) AND feature_table.layer_id = target_layer_id
    )

    -- Generate Mapbox Vector Tiles (MVT) from the filtered geometries.
    SELECT ST_AsMVT(mvtgeom.*) FROM mvtgeom;
    END;
    $$ LANGUAGE plpgsql;
   ```

#### Note

Please ensure that your database is properly configured with PostGIS.

## Development Guide

Before starting the development on the repo. Please run the following command to install the necessary pre-commit hook for git, for proper formatting of code.

```bash
pre-commit install
```

### Run Test

```bash
coverage run -m  pytest -v && coverage report -m
```

### Upgrade Packages (Dependency Update)

```bash
pip list --format=freeze | grep -v '^\-e' | cut -d = -f 1  | xargs -n1 pip install -U
```

```bash
pip freeze > requirements.txt
```
