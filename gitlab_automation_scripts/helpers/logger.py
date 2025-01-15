# Ref: https://stackoverflow.com/a/287944.
class LogColors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


class logger:
    def bold(message: str, *args, **kwargs):
        print(LogColors.BOLD + message + LogColors.ENDC, *args, **kwargs)

    def fail(message: str, *args, **kwargs):
        print(LogColors.FAIL + message + LogColors.ENDC, *args, **kwargs)

    def header(message: str, *args, **kwargs):
        print(LogColors.HEADER + message + LogColors.ENDC, *args, **kwargs)

    def info(message: str, *args, **kwargs):
        print(LogColors.OKCYAN + message + LogColors.ENDC, *args, **kwargs)

    def success(message: str, *args, **kwargs):
        print(LogColors.OKGREEN + message + LogColors.ENDC, *args, **kwargs)

    def info_underlined(message: str, *args, **kwargs):
        print(
            LogColors.UNDERLINE
            + LogColors.OKCYAN
            + message
            + LogColors.ENDC
            + LogColors.ENDC,
            *args,
            **kwargs
        )
