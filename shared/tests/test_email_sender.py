from unittest import TestCase, mock

from shared.helpers import send_email
from templates import EmailTemplatePath


class EmailTest(TestCase):
    def test_email_send(self):
        mock_email_message = mock.MagicMock()
        mock_email_message.send.return_value = True

        mocked_obj = mock.patch("shared.helpers.email_helper.EmailMessage").start()
        mocked_obj.return_value = mock_email_message

        # Arrange.
        subject = "Dataset test_iteration is ready for analytics"
        context = {
            "project_name": "test_project",
            "site_name": "test_site",
            "iteration_name": "test_iteration",
        }
        template_filename = EmailTemplatePath.DATASET_PROCESSING.value

        # Act.
        send_email(subject, ["test@aereo.io"], context, template_filename)

        # Assert.
        mock_email_message.send.assert_called()
