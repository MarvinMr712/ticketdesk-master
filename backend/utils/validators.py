def require_fields(data, fields):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        return f"Campos requeridos: {', '.join(missing)}"
    return None

def validate_in(value, valid_options, label="Valor"):
    if value and value not in valid_options:
        return f"{label} inválido. Opciones: {', '.join(valid_options)}"
    return None