import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_DIR = os.path.join(BASE_DIR, "frontend", "templates")
STATIC_DIR = os.path.join(BASE_DIR, "frontend", "static")
UPLOAD_DIR = os.path.join(os.path.dirname(BASE_DIR), "backend", "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

EXTENSIONES_PERMITIDAS = {"png", "jpg", "jpeg", "pdf"}
TAMANO_MAX_MB = 5

TECNICOS = ["Bryan Cacsire", "Arin Azcona", "Marvin Machado", "Cristhian Rios", "Jose Cuenca"]

ESTADOS_VALIDOS = ["Pendiente", "En Proceso", "Resuelto", "Escalado"]
PRIORIDADES_VALIDAS = ["Alta", "Media", "Baja"]
CATEGORIAS_VALIDAS = ["ERP Corporativo", "Red / Internet", "Hardware", "Software", "Impresoras", "Otros"]
