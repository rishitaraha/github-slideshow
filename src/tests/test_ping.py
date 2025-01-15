from fastapi import status
from fastapi.testclient import TestClient

from ..main import app

client = TestClient(app)


def test_ping():
    # Act.
    response = client.get("/ping/")
    response_data = response.json()

    # Assert.
    assert response.status_code == status.HTTP_200_OK
    assert response_data["data"] == "pong"
