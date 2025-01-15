class CRSNotFound(RuntimeError):
    def __init__(self):
        self.message = "crs not found"
        super().__init__(self.message)
