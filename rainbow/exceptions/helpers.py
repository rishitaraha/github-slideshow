import json


def is_json_string(json_string):
    try:
        json.loads(json_string)
        return True
    except:
        return False
