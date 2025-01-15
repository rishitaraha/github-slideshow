from .base_tests import TestCanGenerateHaulRoads, TestListHaulRoadTypes


class TestHaulRoadForOrgAdmin(TestCanGenerateHaulRoads, TestListHaulRoadTypes):
    def setUp(self):
        self.api_authentication(self.org_admin)
