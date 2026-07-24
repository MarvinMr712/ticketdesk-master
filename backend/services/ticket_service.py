from datetime import datetime
import database as db
import config

sup = db.supabase

def generar_numero():
    result = sup.table("tickets").select("id", count="exact").execute()
    count = result.count or 0
    return f"TKT-2026-{count + 1:04d}"

def asignar_tecnico_auto(index):
    return config.TECNICOS[index % len(config.TECNICOS)]

def crear(data, nombre_adjunto=None):
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    numero = generar_numero()
    index = sup.table("tickets").select("id", count="exact").execute().count or 0
    tecnico = asignar_tecnico_auto(index)

    ticket = {
        "numero": numero,
        "descripcion": data["descripcion"],
        "categoria": data["categoria"],
        "area": data["area"],
        "sistema": data.get("sistema", ""),
        "prioridad": data["prioridad"],
        "estado": "Pendiente",
        "tecnico": tecnico,
        "usuario": data["usuario"],
        "fecha_creacion": ahora,
        "adjunto": nombre_adjunto,
    }

    result = sup.table("tickets").insert(ticket).execute()
    ticket_id = result.data[0]["id"]

    historial = [
        {"ticket_id": ticket_id, "evento": f"Ticket creado por {data['usuario']}", "fecha": ahora},
        {"ticket_id": ticket_id, "evento": f"Asignado automáticamente a {tecnico}", "fecha": ahora},
    ]
    if nombre_adjunto and data.get("archivo_filename"):
        historial.append({"ticket_id": ticket_id, "evento": f"Archivo adjuntado: {data['archivo_filename']}", "fecha": ahora})

    sup.table("historial").insert(historial).execute()

    return ticket_id, numero, tecnico

def cerrar(ticket_id, diagnostico, solucion):
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    sup.table("tickets").update({
        "estado": "Resuelto",
        "diagnostico": diagnostico,
        "solucion": solucion,
        "fecha_cierre": ahora,
    }).eq("id", ticket_id).execute()

    sup.table("historial").insert({
        "ticket_id": ticket_id,
        "evento": "Ticket cerrado y solución documentada en Base de Conocimiento",
        "fecha": ahora,
    }).execute()

    ticket = sup.table("tickets").select("*").eq("id", ticket_id).execute().data
    if ticket:
        sup.table("base_conocimiento").insert({
            "categoria": ticket[0]["categoria"],
            "titulo": ticket[0]["descripcion"],
            "descripcion": diagnostico,
            "solucion": solucion,
            "usos": 0,
        }).execute()

def escalar(ticket_id, tecnico_destino):
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sup.table("tickets").update({"estado": "Escalado", "tecnico": tecnico_destino}).eq("id", ticket_id).execute()
    sup.table("historial").insert({
        "ticket_id": ticket_id,
        "evento": f"Ticket escalado a {tecnico_destino}",
        "fecha": ahora,
    }).execute()

def asignar(ticket_id, tecnico):
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sup.table("tickets").update({"tecnico": tecnico}).eq("id", ticket_id).execute()
    sup.table("historial").insert({
        "ticket_id": ticket_id,
        "evento": f"Asignado a {tecnico}",
        "fecha": ahora,
    }).execute()

def actualizar_estado(ticket_id, updates):
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    sup.table("tickets").update(updates).eq("id", ticket_id).execute()

    eventos = []
    for campo, valor in updates.items():
        label = campo.capitalize()
        eventos.append(f"{label} actualizado a {valor}")

    sup.table("historial").insert({
        "ticket_id": ticket_id,
        "evento": " - ".join(eventos),
        "fecha": ahora,
    }).execute()
