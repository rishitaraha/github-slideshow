# Generator function to simulate the S3 response
def mock_get_objects_in_s3_folder():
    mock_s3_objects = [
        {"Key": "file1.txt", "Size": 123},
        {"Key": "file2.txt", "Size": 456},
    ]
    for obj in mock_s3_objects:
        yield obj
