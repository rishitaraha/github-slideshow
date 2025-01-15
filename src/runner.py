# https://docs.python.org/3/library/inspect.html#introspecting-callables-with-the-signature-object
import inspect
from typing import Callable, Dict

from pydantic import BaseModel


# TODO: Make a python library for this.
class OperationRunner:
    def __init__(self, operations: Dict[str, Callable] = {}):
        self.operations = operations

    def add_operation(self, name, func: Callable):
        if self.operations.get(name, False):
            raise Exception(f"Operation with name {name} already exists")

        self.operations[name] = func

    def remove_operation(self, name: str):
        self.operations.pop(name)

    def update_operation_func(self, name: str, func: Callable):
        if not self.operations.get(name, False):
            raise Exception(f"Operation with name {name} does not exists")

        self.operations[name] = func

    def validate_operation(self, name):
        if name not in self.operations:
            raise ValueError(f"Invalid operation: {name}")

    def run(self, *, operation: str, payload: dict):
        # Validate operation.
        self.validate_operation(operation)

        # Get the corresponding operation function.
        operation_function = self.operations[operation]

        # Extracting function parameters.
        func_signature = inspect.signature(operation_function)
        func_params = func_signature.parameters

        if len(func_params) == 1:
            # If there's only one parameter, assume it's the payload
            param_name = next(iter(func_params))
            param: inspect.Parameter = func_params.get(param_name)

            # Extract parameter type.
            ParamTypeClass = param.annotation

            if issubclass(ParamTypeClass, BaseModel):
                # If the parameter type is a Pydantic BaseModel, create an instance and run the operation function.
                # Pydantic will handle the validation of the payload so no need to validate.
                typed_payload = ParamTypeClass(**payload)
                operation_function(typed_payload)
            else:
                raise ValueError("Parameter type must be a Pydantic Model")
        else:
            raise ValueError("Operation function must have only one parameter")
