from django.conf import settings
from django.template.loader import get_template
from weasyprint import HTML, default_url_fetcher


# Custom weasyprint url fetcher.
# Ref: https://doc.courtbouillon.org/weasyprint/latest/api_reference.html#weasyprint.HTML.write_pdf
def custom_url_fetcher(url, *args, **kwargs):
    url = url.replace(settings.STATIC_URL, f"{settings.STATIC_ROOT}/")
    return default_url_fetcher(url, *args, **kwargs)


def render_pdf(template_name: str, params):
    """
    Creates pdf from django templates.
    """
    template = get_template(template_name)
    rendered_template = template.render(params)

    pdf_file = HTML(
        string=rendered_template,
        base_url=str(settings.BASE_DIR),
        url_fetcher=custom_url_fetcher,
    ).write_pdf()

    return pdf_file
