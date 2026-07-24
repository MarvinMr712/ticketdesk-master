from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
import database as db
from utils.validators import require_fields

usuarios_bp = Blueprint("usuarios", __name__)
sup = db.supabase

TABLA_POR_ROL = {"usuario": "usuarios", "tecnico": "tecnicos", "admin": "admin"}
TABLAS = {"usuarios": "usuario", "tecnicos": "tecnico", "admin": "admin"}


@usuarios_bp.route("/api/usuarios", methods=["GET"])
def listar():
    todos = []
    for tabla, rol in TABLAS.items():
        result = sup.table(tabla).select("id,username,nombre,area").order("nombre").execute()
        for u in result.data:
            u["rol"] = rol
            u["tabla"] = tabla
            todos.append(u)
    return jsonify(todos)


@usuarios_bp.route("/api/usuarios", methods=["POST"])
def crear():
    data = request.get_json() or {}
    error = require_fields(data, ["username", "password", "nombre", "rol"])
    if error:
        return jsonify({"error": error}), 400

    if data["rol"] not in TABLA_POR_ROL:
        return jsonify({"error": "Rol inv\u00e1lido. Debe ser: usuario, tecnico o admin"}), 400

    tabla = TABLA_POR_ROL[data["rol"]]
    username = data["username"].strip().lower()

    existe = sup.table(tabla).select("id").eq("username", username).execute()
    if existe.data:
        return jsonify({"error": "El usuario ya existe"}), 409

    sup.table(tabla).insert({
        "username": username,
        "password": generate_password_hash(data["password"]),
        "nombre": data["nombre"].strip(),
        "area": data.get("area") or None,
    }).execute()

    return jsonify({"mensaje": "Usuario creado exitosamente"}), 201


@usuarios_bp.route("/api/usuarios/<tabla>/<int:user_id>", methods=["PUT"])
def actualizar(tabla, user_id):
    if tabla not in TABLAS:
        return jsonify({"error": "Tabla inv\u00e1lida"}), 400

    data = request.get_json() or {}
    result = sup.table(tabla).select("id").eq("id", user_id).execute()
    if not result.data:
        return jsonify({"error": "Usuario no encontrado"}), 404

    updates = {}
    if data.get("nombre"):
        updates["nombre"] = data["nombre"].strip()
    if data.get("password"):
        updates["password"] = generate_password_hash(data["password"])
    if data.get("area") is not None:
        updates["area"] = data["area"].strip() or None

    if not updates:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    sup.table(tabla).update(updates).eq("id", user_id).execute()
    return jsonify({"mensaje": "Usuario actualizado correctamente"})


@usuarios_bp.route("/api/usuarios/<tabla>/<int:user_id>", methods=["DELETE"])
def eliminar(tabla, user_id):
    if tabla not in TABLAS:
        return jsonify({"error": "Tabla inv\u00e1lida"}), 400

    result = sup.table(tabla).select("id").eq("id", user_id).execute()
    if not result.data:
        return jsonify({"error": "Usuario no encontrado"}), 404

    sup.table(tabla).delete().eq("id", user_id).execute()
    return jsonify({"mensaje": "Usuario eliminado"})
