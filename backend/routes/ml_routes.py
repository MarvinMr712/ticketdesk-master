from flask import Blueprint, request, jsonify
from services.ml_service import ml_service

ml_bp = Blueprint("ml", __name__)


@ml_bp.route("/api/ml/resumen", methods=["GET", "POST"])
def resumen():
    data = request.get_json() if request.method == "POST" else {}
    resultado = ml_service.resumen_ml(
        data.get("features_clasif"),
        data.get("features_reg"),
        data.get("features_rf"),
    )
    return jsonify(resultado)


@ml_bp.route("/api/ml/predecir_tiempo", methods=["POST"])
def predecir_tiempo():
    data = request.get_json()
    resultado = ml_service.predecir_tiempo(
        data.get("categoria", "ERP Corporativo"),
        data.get("prioridad", "Media"),
    )
    return jsonify(resultado)


@ml_bp.route("/api/ml/predecir_arbol", methods=["POST"])
def predecir_arbol():
    data = request.get_json()
    resultado = ml_service.predecir_arbol(
        data.get("categoria", "ERP Corporativo"),
        data.get("area", "Administración"),
        data.get("prioridad", "Media"),
    )
    return jsonify(resultado)


@ml_bp.route("/api/ml/predecir_rf", methods=["POST"])
def predecir_rf():
    data = request.get_json()
    resultado = ml_service.predecir_rf(
        data.get("categoria", "ERP Corporativo"),
        data.get("area", "Administración"),
    )
    return jsonify(resultado)
