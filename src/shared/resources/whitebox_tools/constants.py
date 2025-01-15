from enum import Enum


class ResamplingAlgorithm(Enum):
    BILINEAR = "bilinear"
    CUBIC_CONVOLUTION = "cc"
    NEAREST_NEIGHBOR = "nn"
