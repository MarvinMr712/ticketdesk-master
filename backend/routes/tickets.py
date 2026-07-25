from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import database as db
import config
import services.ticket_service as ticket_svc
import ml_model as ml
from utils.validators import require_fields, validate_in

tickets_bp = Blueprint("tickets", __name__)
sup = db.supabase


@tickets_bp.route("/api/tickets", methods=["GET"])
def listar():
    estado = request.args.get("estado")
    categoria = request.args.get("categoria")
    usuario = request.args.get("usuario")
    tecnico = request.args.get("tecnico")
    equipo = request.args.get("equipo")
    limit = request.args.get("limit", 50, type=int)

    query = sup.table("tickets").select("*")
    if estado:
        query = query.eq("estado", estado)
    if categoria:
        query = query.eq("categoria", categoria)
    if usuario:
        query = query.eq("usuario", usuario)
    if tecnico:
        query = query.eq("tecnico", tecnico)
    if equipo and equipo == "Area TI":
        miembros = sup.table("area_ti").select("nombre").execute().data
        nombres = [m["nombre"] for m in miembros] + ["Area TI", "\u00c1rea TI"]
        query = query.in_("tecnico", nombres)
    query = query.order("fecha_creacion", desc=True).limit(limit)

    return jsonify(query.execute().data)


@tickets_bp.route("/api/tickets/<int:ticket_id>", methods=["GET"])
def detalle(ticket_id):
    ticket = sup.table("tickets").select("*").eq("id", ticket_id).execute().data
    if not ticket:
        return jsonify({"error": "Ticket no encontrado"}), 404

    historial = sup.table("historial").select("*").eq("ticket_id", ticket_id).order("fecha").execute().data
    return jsonify({"ticket": ticket[0], "historial": historial})


@tickets_bp.route("/api/tickets", methods=["POST"])
def crear():
    es_multipart = request.content_type and "multipart/form-data" in request.content_type
    data = request.form.to_dict() if es_multipart else (request.get_json() or {})
    archivo = request.files.get("archivo") if es_multipart else None

    error = require_fields(data, ["descripcion", "categoria", "area", "prioridad", "usuario"])
    if error:
        return jsonify({"error": error}), 400

    error = validate_in(data["categoria"], config.CATEGORIAS_VALIDAS, "Categoría")
    if error:
        return jsonify({"error": error}), 400
    error = validate_in(data["prioridad"], config.PRIORIDADES_VALIDAS, "Prioridad")
    if error:
        return jsonify({"error": error}), 400

    nombre_guardado = None
    if archivo and archivo.filename:
        ext = archivo.filename.rsplit(".", 1)[-1].lower() if "." in archivo.filename else ""
        if ext not in config.EXTENSIONES_PERMITIDAS:
            return jsonify({"error": "Formato no permitido. Usa PNG, JPG o PDF"}), 400
        archivo.seek(0, os.SEEK_END)
        if archivo.tell() / (1024 * 1024) > config.TAMANO_MAX_MB:
            return jsonify({"error": f"El archivo supera el máximo de {config.TAMANO_MAX_MB}MB"}), 400
        archivo.seek(0)
        marca = datetime.now().strftime("%Y%m%d%H%M%S")
        nombre_guardado = f"{marca}_{secure_filename(archivo.filename)}"
        archivo.save(os.path.join(config.UPLOAD_DIR, nombre_guardado))
        data["archivo_filename"] = archivo.filename

    ticket_id, numero, tecnico = ticket_svc.crear(data, nombre_guardado)
    pred = ml.predecir_tiempo(data["categoria"], data["prioridad"])

    return jsonify({
        "mensaje": "Ticket creado exitosamente",
        "numero": numero,
        "ticket_id": ticket_id,
        "tecnico_asignado": tecnico,
        "prediccion_ml": {
            "horas_estimadas": pred["horas_estimadas"],
            "texto": f"\u23f1 El modelo predice resoluci\u00f3n en ~{pred['horas_estimadas']} horas",
        },
    }), 201


@tickets_bp.route("/api/tickets/<int:ticket_id>/cerrar", methods=["PUT"])
def cerrar(ticket_id):
    data = request.get_json() or {}
    if not data.get("solucion"):
        return jsonify({"error": "La solución es requerida"}), 400

    ticket_svc.cerrar(ticket_id, data.get("diagnostico", ""), data["solucion"])
    return jsonify({"mensaje": "Ticket cerrado y solución guardada en Base de Conocimiento"})


@tickets_bp.route("/api/tickets/<int:ticket_id>/escalar", methods=["PUT"])
def escalar(ticket_id):
    data = request.get_json(silent=True) or {}
    destino = (data.get("tecnico") or "").strip() or "Área TI"
    ticket_svc.escalar(ticket_id, destino)
    return jsonify({"mensaje": f"Ticket escalado a {destino}"})


@tickets_bp.route("/api/tickets/<int:ticket_id>/asignar", methods=["PUT"])
def asignar(ticket_id):
    data = request.get_json(silent=True) or {}
    tecnico = data.get("tecnico")
    if not tecnico:
        return jsonify({"error": "Técnico requerido"}), 400
    ticket_svc.asignar(ticket_id, tecnico)
    return jsonify({"mensaje": f"Ticket asignado a {tecnico}"})


@tickets_bp.route("/api/tickets/<int:ticket_id>/estado", methods=["PUT"])
def actualizar_estado(ticket_id):
    data = request.get_json(silent=True) or {}
    updates = {}

    if data.get("estado"):
        error = validate_in(data["estado"], config.ESTADOS_VALIDOS, "Estado")
        if error:
            return jsonify({"error": error}), 400
        updates["estado"] = data["estado"]
    if data.get("prioridad"):
        error = validate_in(data["prioridad"], config.PRIORIDADES_VALIDAS, "Prioridad")
        if error:
            return jsonify({"error": error}), 400
        updates["prioridad"] = data["prioridad"]
    if data.get("categoria"):
        error = validate_in(data["categoria"], config.CATEGORIAS_VALIDAS, "Categoría")
        if error:
            return jsonify({"error": error}), 400
        updates["categoria"] = data["categoria"]

    if not updates:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    ticket_svc.actualizar_estado(ticket_id, updates)
    return jsonify({"mensaje": "Ticket actualizado correctamente"})
