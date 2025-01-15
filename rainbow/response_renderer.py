from rest_framework.renderers import JSONRenderer


class CustomJsonRender(JSONRenderer):
    # This function renders a JSON output which is received from view response or exception_handler.
    def render(self, response_body, accepted_media_type=None, renderer_context=None):
        response_instance = renderer_context["response"]
        request = renderer_context["request"]

        response = {
            "data": {},
            "meta": {
                "success": "",
                "status_code": response_instance.status_code,
                "message": "",
                "slug": "",
                "type": "",
                "details": {},
                "request_id": "",
            },
        }

        if response_instance.status_code == 204:
            return super().render(None, accepted_media_type, renderer_context)

        if isinstance(response_body, dict) and len(response_body) > 0:
            response["data"] = response_body.pop("data", response["data"])
            response["meta"] = response_body.pop("meta", response["meta"])

            if status_code := response_body.pop("status_code", None):
                response["meta"]["status_code"] = status_code
                response_instance.status_code = status_code

            response["meta"]["success"] = response_body.pop(
                "success",
                not response_instance.exception
                and response["meta"]["status_code"] < 400,
            )

            response["meta"]["message"] = response_body.pop(
                "message", response["meta"]["message"]
            )
            response["meta"]["slug"] = response_body.pop(
                "slug", response["meta"]["slug"]
            )
            response["meta"]["type"] = response_body.pop(
                "type", response["meta"]["type"]
            )
            response["meta"]["details"] = response_body.pop(
                "details", response["meta"]["details"]
            )
            response["meta"]["request_id"] = request.headers.get("X-REQUEST-ID")
            if isinstance(response["data"], dict):
                response["data"] = {**response["data"], **response_body}
        elif response_body is not None:
            response["data"] = response_body

        return super().render(response, accepted_media_type, renderer_context)
