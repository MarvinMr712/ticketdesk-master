from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
import database as db

auth_bp = Blueprint("auth", __name__)
sup = db.supabase


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip().lower()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Usuario y contrase\u00f1a son requeridos"}), 400

    # Buscar en las 3 tablas
    for tabla in ["usuarios", "tecnicos", "admin"]:
        result = sup.table(tabla).select("*").eq("username", username).execute()
        if result.data:
            user = result.data[0]
            if check_password_hash(user["password"], password):
                rol_map = {"usuarios": "usuario", "tecnicos": "tecnico", "admin": "admin"}
                return jsonify({
                    "username": user["username"],
                    "nombre": user["nombre"],
                    "rol": rol_map[tabla],
                    "area": user.get("area"),
                })
            else:
                return jsonify({"error": "Usuario o contrase\u00f1a incorrectos"}), 401

    return jsonify({"error": "Usuario o contrase\u00f1a incorrectos"}), 401
