from flask import jsonify

class AppError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code

def error_response(message, status_code):
    return jsonify({"error": message}), status_code

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return error_response("Solicitud inválida", 400)

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Recurso no encontrado", 404)

    @app.errorhandler(500)
    def server_error(e):
        return error_response("Error interno del servidor", 500)