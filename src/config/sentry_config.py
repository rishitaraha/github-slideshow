import os

import sentry_sdk


def setup_sentry():
    if os.environ.get("SENTRY_DSN") and os.environ.get("ENVIRONMENT") in [
        "uat",
        "production",
    ]:
        sentry_sdk.init(
            dsn=os.environ["SENTRY_DSN"],
            traces_sample_rate=1.0,
        )
