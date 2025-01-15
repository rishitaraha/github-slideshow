import time
from decimal import Decimal

from psycopg2 import connect, sql

from processing_workflow_manager.constants import PG_DEFAULT_DATABASE_PARAMS
from rainbow import logger


def update_task_geotag_errors(task, geotags_error_data, average_errors):
    start_task_geotags_fetching = time.time()
    task_geotags = list(task.taskgeotagimages.all())
    total_time_task_geotags_fetching = time.time() - start_task_geotags_fetching

    geotags_to_update = []
    start_geotags_to_update = time.time()
    for task_geotag in task_geotags:
        geotag_error = geotags_error_data.get(task_geotag.filename)
        if not geotag_error:
            logger.info(f"Geotag Error not found for {task_geotag.filename}")
            continue

        geotags_to_update.append(
            (
                task_geotag.id,
                Decimal(geotag_error["error_x"]),
                Decimal(geotag_error["error_y"]),
                Decimal(geotag_error["error_z"]),
                Decimal(geotag_error["norm_error"]),
            )
        )
    total_time_for_creating_geotags_to_update = time.time() - start_geotags_to_update

    if average_errors:
        task.x_average_error = Decimal(average_errors["x_avg_error"])
        task.y_average_error = Decimal(average_errors["y_avg_error"])
        task.z_average_error = Decimal(average_errors["z_avg_error"])

    start_task_geotags_update = time.time()

    task_geotag_update_query = sql.SQL(
        """
        UPDATE {table_name} SET
        {error_x_col} = {new_values_alias}.{error_x_col},
        {error_y_col} = {new_values_alias}.{error_y_col},
        {altitude_error_col} = {new_values_alias}.{altitude_error_col},
        {norm_error_col} = {new_values_alias}.{norm_error_col}
        FROM (VALUES {placeholders_for_values})
        AS {new_values_alias}({id_col}, {error_x_col}, {error_y_col}, {altitude_error_col}, {norm_error_col})
        WHERE {new_values_alias}.{id_col} = {table_name}.{id_col};
        """
    ).format(
        table_name=sql.Identifier("processing_workflow_manager_taskgeotagimage"),
        new_values_alias=sql.Identifier("taskgeotag_new"),
        id_col=sql.Identifier("id"),
        error_x_col=sql.Identifier("error_x"),
        error_y_col=sql.Identifier("error_y"),
        altitude_error_col=sql.Identifier("error_z"),
        norm_error_col=sql.Identifier("norm_error"),
        placeholders_for_values=sql.SQL(",").join(
            [sql.Placeholder()] * len(geotags_to_update)
        ),
    )

    connection = connect(**PG_DEFAULT_DATABASE_PARAMS)
    cursor = connection.cursor()
    cursor.execute(
        task_geotag_update_query,
        geotags_to_update,
    )
    connection.commit()
    connection.close()

    task.save()
    total_time_for_task_geotags_update = time.time() - start_task_geotags_update
    data_to_log = {
        "geotags_count": len(geotags_to_update),
        "query_fetching_time [Query] -> task.taskgeotag_set: ": f"{total_time_task_geotags_fetching:.3f} sec",
        "array_creation_time [For Loop] -> geotags_to_update: ": f"{total_time_for_creating_geotags_to_update:.3f} sec",
        "query_execution_time [Query] -> task_geotags_update: ": f"{total_time_for_task_geotags_update:.3f} sec",
    }

    logger.info(data_to_log)
