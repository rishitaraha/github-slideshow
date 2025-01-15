import csv
from io import StringIO

from django.core.files.uploadedfile import SimpleUploadedFile


def create_test_production_kpi_csv():
    buffer = StringIO()
    writer = csv.writer(buffer)
    data = [
        [
            "Year(yyyy)",
            "Month(mm)",
            "Target OB Production(tonnes)",
            "Target Ore Production(tonnes)",
            "Actual OB Production(tonnes)",
            "Actual Ore Production(tonnes)",
        ],
        [2022, 2, 3000, 5000, 2000, 4000],
        [2023, 4, 100, 200, 300, 400],
    ]

    writer.writerows(data)
    buffer.seek(0)

    csv_file = SimpleUploadedFile(
        "production_target.csv",
        buffer.getvalue().encode("utf-8"),
        content_type="text/csv",
    )
    return csv_file
