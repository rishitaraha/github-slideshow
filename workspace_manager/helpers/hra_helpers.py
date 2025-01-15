import ast
import math
from decimal import Decimal
from typing import List, Optional

from ..schemas import HRARiskRangeSchema


def calculate_haul_road_risk_range(
    formula_or_value: str | int, vehicle_width: float
) -> float:
    """
    Calculate the haul road risk range based on a given formula and vehicle width.

    The formula may contain:
    - Basic arithmetic operators (+, -, *, /, **, %, //)
    - Parentheses
    - The variable "{vehicle_width}", which will be replaced by the variable vehicle_width.
    - Numeric literals

    If the formula represents infinity (e.g. "inf" or "infinity"),
    it returns float('inf').

    Safety:
    - The formula is parsed using `ast` and checked so that only
      arithmetic operations, numeric constants, and the `vehicle_width`
      variable are allowed.
    - No Python commands, functions, attributes, or other nodes are permitted.

    Args:
        formula (str): The formula to evaluate.
        vehicle_width (float): The width of the vehicle used in the formula.

    Returns:
        float: The evaluated risk range.

    Raises:
        ValueError: If the formula is invalid, unsafe, or cannot produce a numeric result.
    """

    if isinstance(formula_or_value, (int, float, Decimal)):
        return formula_or_value

    infinity_representation = ["inf", "infinity"]

    # Check for infinity representations
    if formula_or_value.lower().strip() in infinity_representation:
        return float("inf")

    # Replace placeholder with a variable name
    updated_formula = formula_or_value.replace("{vehicle_width}", "vehicle_width")

    # Parse the formula into an AST
    try:
        tree = ast.parse(updated_formula, mode="eval")
    except SyntaxError as e:
        raise ValueError(f"Invalid formula syntax: {formula_or_value}. Error: {e}")

    # Define allowed node types
    allowed_node_types = (
        ast.Expression,
        ast.BinOp,
        ast.UnaryOp,
        ast.Constant,
        ast.Name,
        ast.Load,
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.FloorDiv,
        ast.Mod,
        ast.Pow,
        ast.UAdd,
        ast.USub,
    )

    # Check all nodes in the AST for safety.
    for node in ast.walk(tree):
        if not isinstance(node, allowed_node_types):
            raise ValueError(f"Disallowed node in formula: {node.__class__.__name__}")

        # If it's a Name node, it must be 'vehicle_width'.
        if isinstance(node, ast.Name):
            if node.id != "vehicle_width":
                raise ValueError(f"Disallowed variable: {node.id}")

    # Evaluate the AST safely.
    # We'll provide a namespace with only `vehicle_width` and no built-ins.
    safe_locals = {"vehicle_width": vehicle_width}

    # Compile and evaluate the AST node.
    try:
        compiled = compile(tree, filename="<string>", mode="eval")
        result = eval(compiled, {}, safe_locals)
    except Exception as e:
        raise ValueError(f"Error evaluating formula '{formula_or_value}': {e}")

    # Ensure the result is numeric.
    if not isinstance(result, (int, float, Decimal)):
        raise ValueError(f"Formula did not produce a numeric result: {result}")

    return float(result)


def get_haul_road_risk_category(
    risk_ranges: List[HRARiskRangeSchema],
    value: float,
) -> Optional[str]:
    """
    Returns the risk category for the given value based on a list of HRARiskRangeSchema items.

    Each range has a min_value, max_value, and risk_category. The value is considered to belong to a
    range if min_value <= value < max_value. If a range's min_value or max_value is infinite, it is
    handled accordingly.

    Args:
        value (float): The numeric value whose risk category you want to determine.
        risk_ranges (List[HRARiskRangeSchema]): A list of risk range definitions,
            each having 'min_value', 'max_value', and 'risk_category'.

    Returns:
        Optional[str]: The matching risk category if found, otherwise None.

    Example:
        risk_ranges = [
            {'min_value': float('-inf'), 'max_value': 10.0, 'risk_category': 'LOW'},
            {'min_value': 10.0, 'max_value': 20.0, 'risk_category': 'MEDIUM'},
            {'min_value': 20.0, 'max_value': float('inf'), 'risk_category': 'HIGH'}
        ]
        print(get_risk_category(15, risk_ranges))  # "MEDIUM"
    """
    for risk_range in risk_ranges:
        min_val = risk_range["min_value"]
        max_val = risk_range["max_value"]

        # Check lower bound
        meets_min = (value >= min_val) if not math.isinf(min_val) else True
        # Check upper bound
        meets_max = (value < max_val) if not math.isinf(max_val) else True

        if meets_min and meets_max:
            return risk_range["risk_category"]

    # No matching category found
    return None
