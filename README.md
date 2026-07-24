# TicketDesk – Rock Drill Group
## Sistema Inteligente de Gestión de Tickets con Machine Learning
### Innovación y Transformación Digital · UTP · Grupo 2 · Sección 36048

---

## ESTRUCTURA DEL PROYECTO

```
ticketdesk/
├── backend/
│   ├── app.py              ← Servidor Flask (API REST)
│   ├── database.py         ← Base de datos SQLite + datos de ejemplo
│   ├── ml_model.py         ← Modelos de Machine Learning
│   ├── uploads/            ← Archivos adjuntos subidos
│   └── ticketdesk.db       ← Base de datos (se crea sola)
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── styles.css  ← Estilos CSS separados
│   │   └── js/
│   │       └── app.js      ← Lógica JS separada
│   └── templates/
│       └── index.html      ← Solo estructura HTML
└── README.md
```

---

## TECNOLOGÍAS UTILIZADAS

| Capa       | Tecnología                          |
|------------|-------------------------------------|
| Backend    | Python 3.x + Flask                  |
| Base datos | SQLite (ticketdesk.db, se crea sola)|
| ML Modelo 1| Árbol de Clasificación (scikit-learn)|
| ML Modelo 2| Árbol de Regresión (scikit-learn)   |
| ML Modelo 3| Random Forest (scikit-learn)        |
| Frontend   | HTML + CSS + JavaScript (vanilla, separado en archivos) |

---

## CÓMO EJECUTAR (Para la exposición)

### Paso 1 – Instalar dependencias (solo la primera vez)
```bash
pip install flask flask-cors scikit-learn pandas numpy

ó

python -m pip install flask flask-cors scikit-learn pandas numpy
```

### Paso 2 – Iniciar el servidor
```bash
cd ticketdesk/backend
python app.py
```

Verás en la terminal:
```
=======================================================
  TicketDesk – Rock Drill Group
  Innovación y Transformación Digital – UTP
=======================================================
  Servidor: http://127.0.0.1:5000
  Presiona Ctrl+C para detener
=======================================================
```

### Paso 3 – Abrir el navegador
Ir a: **http://127.0.0.1:5000**

---

## MÓDULOS DEL SISTEMA

### 1. Dashboard
- KPIs en tiempo real (tickets abiertos, cerrados, tiempo promedio, satisfacción)
- Gráfico de barras: tickets por categoría
- Gráfico horizontal: carga por técnico
- Tabla de tickets recientes

### 2. Nuevo Ticket
- Formulario completo con validación
- Sugerencia automática de la Base de Conocimiento
- **Predicción Random Forest**: recomienda prioridad según categoría y área
- **Predicción Árbol de Regresión**: estima tiempo de resolución en horas
- Asignación automática de técnico

### 3. Mis Tickets
- Lista filtrable por estado
- Timeline de progreso (Pendiente → En Proceso → Resuelto)
- Historial de cambios por ticket
- Botón "Atender" visible solo para usuarios con rol **técnico**

### 4. Panel Técnico
- Vista de tickets abiertos con KPIs propios
- Formulario de diagnóstico y solución
- Cierre con guardado automático en Base de Conocimiento
- Escalamiento a Área TI con un clic

### 5. Base de Conocimiento
- Buscador en tiempo real
- Filtro por categoría
- Soluciones con contador de reusos
- Se actualiza automáticamente al cerrar tickets

### 6. Predicción ML (página principal ML)
- **Selección de Features (X)**: el usuario elige qué variables usar (Categoría, Área, Prioridad, Sistema, Mes)
- **Métricas Train vs Test**: cada modelo muestra rendimiento separado en entrenamiento y prueba para detectar overfitting
- **Árbol de Clasificación**: predice prioridad del ticket (Alta/Media/Baja)
  - Muestra Accuracy Train y Accuracy Test, estructura del árbol e importancia de variables
  - Totalmente interpretable, se visualiza la lógica de decisión
- **Árbol de Regresión**: predice tiempo de resolución en horas
  - Muestra MAE Train/Test, R² Train/Test
  - Modelo estrella usado al crear tickets
- **Random Forest**: clasificación de prioridad con ensamble de 100 árboles
  - RF Accuracy Train/Test y Árbol Accuracy Train/Test lado a lado

---

## MODELOS DE MACHINE LEARNING

Todos los modelos permiten **seleccionar las features (X)** desde la interfaz y muestran **métricas separadas para Train y Test**.

### Árbol de Clasificación – Prioridad del Ticket
```
Algoritmo: DecisionTreeClassifier (max_depth=4)
X = features seleccionables: Categoría, Área, Prioridad, Sistema, Mes
y = prioridad (Alta / Media / Baja)
Métricas: Accuracy Train, Accuracy Test
Característica: totalmente interpretable, se visualiza el árbol
```

### Árbol de Regresión – Tiempo de Resolución
```
Algoritmo: DecisionTreeRegressor (max_depth=5)
X = features seleccionables: Categoría, Prioridad, Mes (por defecto)
y = horas de resolución
Métricas: MAE Train, MAE Test, R² Train, R² Test
```

### Random Forest – Clasificación con Ensamble
```
Algoritmo: RandomForestClassifier (100 árboles, max_depth=4)
X = features seleccionables: Categoría, Área, Prioridad, Sistema, Mes
y = prioridad (Alta / Media / Baja)
Métricas: RF Accuracy Train/Test, Árbol Accuracy Train/Test
Ventaja: más robusto que un árbol solo, reduce sobreajuste
```

---

## INTEGRANTES
- Cacsire Cuevas, Bryan Jeremy – U23236776 (Scrum Master)
- Azcona Bendezú, Arin Brunei Ruben – U18201578 (UI/UX)
- Machado Rojas, Marvin Rodrigo – U22203912 (Backend)
- Rios Hualpa, Cristhian Branthon – U22235897 (Backend)
- Cuenca Torres, Jose Luis – U21310626 (QA)

**Docente:** Mg. Andrade Soto, Victor Guillermo
