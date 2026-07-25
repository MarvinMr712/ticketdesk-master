# TicketDesk – Rock Drill Group
## Sistema Inteligente de Gestión de Tickets con Machine Learning
### Innovación y Transformación Digital · UTP · Grupo 2 · Sección 36048

---

## TECNOLOGÍAS

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Backend    | Python + Flask + Gunicorn           |
| Base datos | Supabase (PostgreSQL)               |
| ML Modelos | scikit-learn (Árbol Clasificación, Regresión, Random Forest) |
| Frontend   | HTML + CSS + JavaScript vanilla     |
| Despliegue | Render.com                          |

---

## ROLES DEL SISTEMA

| Rol       | Acceso                                         |
|-----------|------------------------------------------------|
| Admin     | Dashboard, Tickets, ML, Admin Usuarios (CRUD) |
| Técnico   | Dashboard, Tickets, Panel Técnico, ML, escalar a TI |
| Área TI   | Dashboard TI, Tickets TI, Panel TI, ML (último nivel, no escalan) |
| Usuario   | Nuevo Ticket, Mis Tickets                      |

---

## USUARIOS POR DEFECTO

| Rol       | Usuario       | Contraseña   |
|-----------|---------------|--------------|
| Admin     | `admin`       | admin123     |
| Técnico   | `u23236776`   | u23236776    |
| Técnico   | `u18201578`   | u18201578    |
| Técnico   | `u22203912`   | u22203912    |
| Técnico   | `u22235897`   | u22235897    |
| Técnico   | `u21310626`   | u21310626    |
| Área TI   | `ti.helena`   | helena123    |
| Área TI   | `ti.pamela`   | pamela123    |
| Área TI   | `ti.renato`   | renato123    |
| Usuario   | `carlos`      | 1234         |

---

## CÓMO EJECUTAR LOCALMENTE

```bash
# 1. Clonar
git clone https://github.com/MarvinMr712/ticketdesk-master.git
cd ticketdesk-master

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Crear backend/.env con las credenciales de Supabase
echo "SUPABASE_URL=https://tu-proyecto.supabase.co" > backend/.env
echo "SUPABASE_KEY=tu-anon-key" >> backend/.env

# 4. Iniciar servidor
cd backend
python app.py
```

Abrir **http://127.0.0.1:5000**

---

## DESPLEGAR EN RENDER

1. Subir a GitHub
2. En [render.com](https://render.com) → New Web Service
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `cd backend && gunicorn app:app`
5. **Env vars:** `SUPABASE_URL` y `SUPABASE_KEY`

---

## FUNCIONALIDADES

- Dashboard con KPIs en tiempo real
- Creación de tickets con predicción ML de prioridad y tiempo
- Panel técnico con diagnóstico, solución y cierre
- Escalación aleatoria a Área TI con un clic
- Área TI: dashboard, tickets y panel propios (no escalan)
- Base de Conocimiento con búsqueda y filtros
- Entrenamiento interactivo de 3 modelos ML con selección de features
- Admin: CRUD de usuarios en todos los roles

---

## INTEGRANTES

- Cacsire Cuevas, Bryan Jeremy – U23236776 (Scrum Master)
- Azcona Bendezú, Arin Brunei Ruben – U18201578 (UI/UX)
- Machado Rojas, Marvin Rodrigo – U22203912 (Backend)
- Rios Hualpa, Cristhian Branthon – U22235897 (Backend)
- Cuenca Torres, Jose Luis – U21310626 (QA)

**Docente:** Mg. Andrade Soto, Victor Guillermo
