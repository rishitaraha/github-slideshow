import smtplib

from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import get_template

from rainbow import logger


def send_email(
    subject,
    recipient_list: list,
    template_context,
    template_filename,
    host_email=settings.EMAIL_HOST_USER,
    attachment=None,
):
    email_template = get_template(template_filename)
    html_content = email_template.render(template_context)

    message = EmailMessage(
        subject,
        body=html_content,
        from_email=host_email,
        to=recipient_list,
    )
    message.content_subtype = "html"

    if attachment:
        message.attach(*attachment)

    try:
        message.send()
    except smtplib.SMTPException as exc:
        logger.exception(exc)
