from flask import Blueprint, jsonify, request
from datetime import datetime
import database as db

kpis_bp = Blueprint("kpis", __name__)
sup = db.supabase


@kpis_bp.route("/api/kpis", methods=["GET"])
def kpis():
    ahora = datetime.now()
    tecnico = request.args.get("tecnico")
    equipo = request.args.get("equipo")
    tickets = sup.table("tickets").select("*").execute().data

    if tecnico:
        tickets = [t for t in tickets if t.get("tecnico") == tecnico]
    if equipo and equipo == "Area TI":
        miembros = sup.table("area_ti").select("nombre").execute().data
        nombres = [m["nombre"] for m in miembros] + ["Area TI", "\u00c1rea TI"]
        tickets = [t for t in tickets if t.get("tecnico") in nombres]

    abiertos = sum(1 for t in tickets if t["estado"] != "Resuelto")
    total = len(tickets)

    cerrados_hoy = sum(
        1 for t in tickets
        if t["estado"] == "Resuelto" and t.get("fecha_cierre")
        and t["fecha_cierre"][:10] == ahora.strftime("%Y-%m-%d")
    )

    tiempos = []
    for t in tickets:
        if t["estado"] == "Resuelto" and t.get("fecha_cierre"):
            try:
                fc = datetime.strptime(t["fecha_creacion"][:19], "%Y-%m-%d %H:%M:%S")
                fi = datetime.strptime(t["fecha_cierre"][:19], "%Y-%m-%d %H:%M:%S")
                tiempos.append((fi - fc).total_seconds() / 3600)
            except Exception:
                pass
    tpo_prom = round(sum(tiempos) / len(tiempos), 1) if tiempos else 0

    cats = {}
    tecs = {}
    ests = {}
    for t in tickets:
        cats[t["categoria"]] = cats.get(t["categoria"], 0) + 1
        tec = t.get("tecnico")
        if tec and tec not in ("Area TI", ""):
            tecs[tec] = tecs.get(tec, 0) + 1
        ests[t["estado"]] = ests.get(t["estado"], 0) + 1

    alta_prio = sum(1 for t in tickets if t.get("prioridad") == "Alta" and t["estado"] != "Resuelto")

    recientes = sorted(tickets, key=lambda t: t["fecha_creacion"], reverse=True)[:8]

    return jsonify({
        "abiertos": abiertos,
        "cerrados_hoy": cerrados_hoy,
        "tpo_prom_horas": tpo_prom,
        "satisfaccion": 87,
        "total": total,
        "alta_prioridad": alta_prio,
        "por_categoria": [{"categoria": k, "total": v} for k, v in sorted(cats.items(), key=lambda x: -x[1])],
        "por_tecnico": [{"tecnico": k, "total": v} for k, v in sorted(tecs.items(), key=lambda x: -x[1])],
        "por_estado": [{"estado": k, "total": v} for k, v in ests.items()],
        "recientes": recientes,
    })
