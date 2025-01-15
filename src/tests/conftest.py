from unittest.mock import MagicMock

import pytest
from pytest_mock.plugin import MockerFixture


@pytest.fixture(autouse=True)
def mock_postgres(mocker: MockerFixture):
    mocker.patch("src.db.postgres_manager.AsyncConnectionPool", MagicMock)
