from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
import config
from utils.errors import register_error_handlers
from routes.auth import auth_bp
from routes.tickets import tickets_bp
from routes.kpis import kpis_bp
from routes.ml_routes import ml_bp
from routes.usuarios import usuarios_bp

app = Flask(__name__, template_folder=config.TEMPLATE_DIR, static_folder=config.STATIC_DIR)
CORS(app)

register_error_handlers(app)

app.register_blueprint(auth_bp)
app.register_blueprint(tickets_bp)
app.register_blueprint(kpis_bp)
app.register_blueprint(ml_bp)
app.register_blueprint(usuarios_bp)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(config.UPLOAD_DIR, filename)


@app.route("/api/tecnicos", methods=["GET"])
def get_tecnicos():
    from database import supabase as sup
    from flask import jsonify
    tecnicos = sup.table("tecnicos").select("username, nombre").order("nombre").execute().data
    area_ti_list = sup.table("area_ti").select("username, nombre").order("nombre").execute().data
    return jsonify(tecnicos + area_ti_list)


@app.route("/api/conocimiento", methods=["GET"])
def get_conocimiento():
    from database import supabase as sup
    from flask import jsonify, request
    q = request.args.get("q", "")
    cat = request.args.get("categoria", "")
    query = sup.table("base_conocimiento").select("*")
    if q:
        query = query.ilike("titulo", f"%{q}%")
    if cat:
        query = query.eq("categoria", cat)
    query = query.order("usos", desc=True)
    return jsonify(query.execute().data)


@app.route("/api/sugerencia", methods=["GET"])
def get_sugerencia():
    from database import supabase as sup
    from flask import jsonify, request
    cat = request.args.get("categoria", "")
    result = sup.table("base_conocimiento").select("*").eq("categoria", cat).order("usos", desc=True).limit(1).execute()
    if result.data:
        return jsonify({"encontrado": True, "sugerencia": result.data[0]})
    return jsonify({"encontrado": False})


if __name__ == "__main__":
    print("=" * 55)
    print("  TicketDesk \u2013 Rock Drill Group")
    print("  Innovaci\u00f3n y Transformaci\u00f3n Digital \u2013 UTP")
    print("=" * 55)
    print("  Servidor: http://127.0.0.1:5000")
    print("  Presiona Ctrl+C para detener")
    print("=" * 55)
    app.run(debug=True, port=5000, use_reloader=False)
