"""Response and request helpers for the JSON APIs."""

from flask import jsonify, request


def json_error(message, status=400):
    return jsonify({"error": message}), status


def json_payload():
    return request.get_json() or {}


def row_to_dict(row, *, boolean_fields=()):
    data = dict(row)
    for field in boolean_fields:
        if field in data:
            data[field] = bool(data[field])
    return data
