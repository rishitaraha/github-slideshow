from .base_tests import (
    TestCanDownloadBaseDsm,
    TestCanDownloadCapturedDsm,
    TestCanDownloadLayer,
)


class TestDownloadFileForOrgAdmin(
    TestCanDownloadBaseDsm, TestCanDownloadCapturedDsm, TestCanDownloadLayer
):
    def setUp(self):
        self.api_authentication(self.org_admin)
