"""
ml_model.py - Módulo de Machine Learning para TicketDesk
Rock Drill Group - Innovación y Transformación Digital UTP

Modelos implementados (versión optimizada):
  1. Árbol de Clasificaci�n → predice PRIORIDAD (Decision Tree Classifier)
  2. Árbol de Regresi�n    → predice TIEMPO de resoluci�n (Decision Tree Regressor)
  3. Random Forest         → predice PRIORIDAD con ensamble de �rboles
"""

import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor, export_text
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, accuracy_score
import database as db

sup = db.supabase


def _fetch_tickets():
    """Fetch all tickets via Supabase REST API."""
    result = sup.table("tickets").select("*").execute()
    return result.data


def _load_tickets():
    """Carga tickets resueltos con tiempo de resolución calculado."""
    data = _fetch_tickets()
    df = pd.DataFrame(data)
    if df.empty:
        return df
    df = df[df["estado"] == "Resuelto"]
    df = df[df["fecha_cierre"].notna()]
    df["fecha_creacion"] = pd.to_datetime(df["fecha_creacion"])
    df["fecha_cierre"]   = pd.to_datetime(df["fecha_cierre"])
    df["horas_resolucion"] = (
        (df["fecha_cierre"] - df["fecha_creacion"]).dt.total_seconds() / 3600
    ).round(2)
    df["mes"] = df["fecha_creacion"].dt.month
    return df


CAT_MAP  = {"ERP Corporativo":0, "Red / Internet":1, "Hardware":2,
             "Software":3, "Impresoras":4}
PRIO_MAP = {"Alta":2, "Media":1, "Baja":0}


def _encoded_df():
    """Devuelve DataFrame con features numéricas para todos los tickets."""
    data = _fetch_tickets()
    df = pd.DataFrame(data)
    if df.empty:
        return df, None, None, None
    df["fecha_creacion"] = pd.to_datetime(df["fecha_creacion"])
    df["mes"] = df["fecha_creacion"].dt.month
    df["sistema_enc"] = LabelEncoder().fit_transform(df["sistema"].fillna("").astype(str))
    le_cat  = LabelEncoder()
    le_area = LabelEncoder()
    le_prio = LabelEncoder()
    df["cat_enc"]  = le_cat.fit_transform(df["categoria"])
    df["area_enc"] = le_area.fit_transform(df["area"])
    df["prio_enc"] = le_prio.fit_transform(df["prioridad"])
    return df, le_cat, le_area, le_prio


def _build_X(df, features):
    """Construye matriz X según lista de features seleccionadas."""
    mapping = {
        "Categoría": "cat_enc",
        "Área": "area_enc",
        "Prioridad": "prio_enc",
        "Sistema": "sistema_enc",
        "Mes": "mes",
    }
    cols = [mapping[f] for f in features if f in mapping]
    if not cols:
        cols = ["cat_enc"]
    return df[cols].values


def entrenar_arbol_clasificacion(features=None):
    if features is None:
        features = ["Categoría", "Área"]
    df, le_cat, le_area, le_prio = _encoded_df()
    if df is None or len(df) < 10:
        return {"error": "Datos insuficientes."}

    X = _build_X(df, features)
    y = df["prio_enc"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)

    modelo = DecisionTreeClassifier(max_depth=4, random_state=42)
    modelo.fit(X_train, y_train)

    y_pred_train = modelo.predict(X_train)
    y_pred_test  = modelo.predict(X_test)
    acc_train = round(accuracy_score(y_train, y_pred_train), 4)
    acc_test  = round(accuracy_score(y_test, y_pred_test), 4)

    feature_names = features
    arbol_texto = export_text(modelo, feature_names=feature_names, max_depth=3)
    arbol_lineas = arbol_texto.split("\n")[:22]

    importancias = []
    for i, f in enumerate(feature_names):
        if i < len(modelo.feature_importances_):
            importancias.append({"feature": f, "importancia": round(float(modelo.feature_importances_[i]), 4)})

    return {
        "modelo": "Árbol de Clasificación",
        "algoritmo": "DecisionTreeClassifier",
        "objetivo": "Predecir la prioridad del ticket (Alta / Media / Baja)",
        "features_usadas": features,
        "max_depth": 4,
        "accuracy": round(acc_test, 4),
        "accuracy_pct": f"{round(acc_test*100,1)}%",
        "accuracy_train": acc_train,
        "accuracy_test": acc_test,
        "accuracy_train_pct": f"{round(acc_train*100,1)}%",
        "accuracy_test_pct": f"{round(acc_test*100,1)}%",
        "clases": le_prio.classes_.tolist() if le_prio is not None else [],
        "importancia_features": importancias,
        "arbol_texto": arbol_lineas,
    }


def entrenar_arbol_regresion(features=None):
    if features is None:
        features = ["Categoría", "Prioridad", "Mes"]
    df = _load_tickets()
    if df.empty or len(df) < 10:
        return {"error": "Datos insuficientes."}

    df_reg = _encoded_df()[0]
    if df_reg is None:
        return {"error": "Datos insuficientes."}
    df_reg = df_reg[df_reg.index.isin(df.index)]
    df_reg["horas_resolucion"] = df["horas_resolucion"]

    X = _build_X(df_reg, features)
    y = df_reg["horas_resolucion"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)

    arbol = DecisionTreeRegressor(max_depth=5, random_state=42)
    arbol.fit(X_train, y_train)

    y_pred_train = arbol.predict(X_train)
    y_pred_test  = arbol.predict(X_test)
    mae_train = round(mean_absolute_error(y_train, y_pred_train), 2)
    mae_test  = round(mean_absolute_error(y_test, y_pred_test), 2)
    r2_train  = round(arbol.score(X_train, y_train), 4)
    r2_test   = round(arbol.score(X_test, y_test), 4)

    importancias = []
    for i, f in enumerate(features):
        if i < len(arbol.feature_importances_):
            importancias.append({"feature": f, "importancia": round(float(arbol.feature_importances_[i]), 4)})

    comparacion = []
    mapping = {"Categoría": "cat_enc", "Área": "area_enc", "Prioridad": "prio_enc", "Sistema": "sistema_enc", "Mes": "mes"}
    for cat in ["ERP Corporativo", "Red / Internet", "Hardware", "Software", "Impresoras"]:
        for prio in ["Alta", "Media", "Baja"]:
            row = {"categoria": cat, "prioridad": prio}
            try:
                pred_df = pd.DataFrame([{
                    "cat_enc": CAT_MAP.get(cat, 0),
                    "area_enc": 0,
                    "prio_enc": PRIO_MAP.get(prio, 1),
                    "sistema_enc": 0,
                    "mes": pd.Timestamp.now().month,
                }])
                needed = [mapping[f] for f in features if f in mapping]
                if not needed:
                    needed = ["cat_enc"]
                pred_X = pred_df[needed].values
                row["horas_arbol"] = round(float(arbol.predict(pred_X)[0]), 1)
            except Exception:
                row["horas_arbol"] = "\u2013"
            comparacion.append(row)

    return {
        "modelo": "Árbol de Regresión",
        "algoritmo": "DecisionTreeRegressor",
        "objetivo": "Predecir tiempo de resolución en horas",
        "features_usadas": features,
        "max_depth": 5,
        "mae": mae_test,
        "mae_train": mae_train,
        "mae_test":  mae_test,
        "r2":  r2_test,
        "r2_train":  r2_train,
        "r2_test":   r2_test,
        "importancia_features": importancias,
        "comparacion": comparacion,
    }


def entrenar_random_forest(features=None):
    if features is None:
        features = ["Categoría", "Área"]
    df, le_cat, le_area, le_prio = _encoded_df()
    if df is None or len(df) < 10:
        return {"error": "Datos insuficientes."}

    X = _build_X(df, features)
    y = df["prio_enc"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42)

    rf = RandomForestClassifier(n_estimators=100, max_depth=4,
                                 random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    y_pred_rf_train = rf.predict(X_train)
    y_pred_rf_test  = rf.predict(X_test)
    acc_rf_train = round(accuracy_score(y_train, y_pred_rf_train), 4)
    acc_rf_test  = round(accuracy_score(y_test, y_pred_rf_test), 4)

    dt = DecisionTreeClassifier(max_depth=4, random_state=42)
    dt.fit(X_train, y_train)
    acc_dt_train = round(accuracy_score(y_train, dt.predict(X_train)), 4)
    acc_dt_test  = round(accuracy_score(y_test, dt.predict(X_test)), 4)

    importancias = []
    for i, f in enumerate(features):
        if i < len(rf.feature_importances_):
            importancias.append({"feature": f, "importancia": round(float(rf.feature_importances_[i]), 4)})

    mejora_rf_vs_dt = round((acc_rf_test - acc_dt_test) * 100, 1)

    predicciones_demo = []
    sample_cats = ["ERP Corporativo", "Red / Internet", "Hardware", "Software", "Impresoras"]
    sample_areas = ["Administración", "Campo / Operaciones", "Logística", "RRHH", "Contabilidad"]
    feat_mapping = {"Categoría": "cat_enc", "Área": "area_enc", "Prioridad": "prio_enc", "Sistema": "sistema_enc", "Mes": "mes"}
    for i in range(min(len(sample_cats), len(df))):
        cat = sample_cats[i % len(sample_cats)]
        area = sample_areas[i % len(sample_areas)]
        try:
            demo_df = pd.DataFrame([{
                "cat_enc": int(le_cat.transform([cat])[0]),
                "area_enc": int(le_area.transform([area])[0]),
                "prio_enc": 1,
                "sistema_enc": 0,
                "mes": pd.Timestamp.now().month,
            }])
            needed = [feat_mapping[f] for f in features if f in feat_mapping]
            if not needed:
                needed = ["cat_enc"]
            x = demo_df[needed].values
            pred_rf = le_prio.inverse_transform(rf.predict(x))[0]
            pred_dt = le_prio.inverse_transform(dt.predict(x))[0]
            proba_rf = rf.predict_proba(x)[0]
            conf_rf = f"{round(float(max(proba_rf))*100,1)}%"
            predicciones_demo.append({
                "categoria": cat, "area": area,
                "prioridad_rf": pred_rf, "confianza_rf": conf_rf,
                "prioridad_dt": pred_dt,
            })
        except Exception:
            continue

    return {
        "modelo": "Random Forest",
        "algoritmo": "RandomForestClassifier",
        "objetivo": "Clasificar prioridad del ticket con ensamble de �rboles",
        "features_usadas": features,
        "n_estimadores": 100,
        "max_depth": 4,
        "acc_rf": round(acc_rf_test, 4),
        "acc_rf_pct": f"{round(acc_rf_test*100,1)}%",
        "acc_dt": round(acc_dt_test, 4),
        "acc_dt_pct": f"{round(acc_dt_test*100,1)}%",
        "acc_rf_train": acc_rf_train,
        "acc_rf_test":  acc_rf_test,
        "acc_dt_train": acc_dt_train,
        "acc_dt_test":  acc_dt_test,
        "acc_rf_train_pct": f"{round(acc_rf_train*100,1)}%",
        "acc_rf_test_pct":  f"{round(acc_rf_test*100,1)}%",
        "acc_dt_train_pct": f"{round(acc_dt_train*100,1)}%",
        "acc_dt_test_pct":  f"{round(acc_dt_test*100,1)}%",
        "mejora_pct": mejora_rf_vs_dt,
        "importancia_features": importancias,
        "clases": le_prio.classes_.tolist() if le_prio is not None else [],
        "predicciones_demo": predicciones_demo,
    }


def predecir_rf(categoria: str, area: str):
    """Predice prioridad con Random Forest para el predictor interactivo."""
    df, le_cat, le_area, le_prio = _encoded_df()
    if df is None or len(df) < 5:
        return {"prioridad_predicha": "Media", "confianza": "N/A"}
    X = df[["cat_enc","area_enc"]].values
    y = df["prio_enc"].values
    rf = RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42)
    rf.fit(X, y)
    try:
        ce = int(le_cat.transform([categoria])[0])
        ae = int(le_area.transform([area])[0])
        pred  = rf.predict([[ce, ae]])[0]
        proba = rf.predict_proba([[ce, ae]])[0]
        prio  = le_prio.inverse_transform([pred])[0]
        conf  = round(float(max(proba))*100, 1)
    except ValueError:
        prio, conf = "Media", 65.0
    return {"prioridad_predicha": prio, "confianza": f"{conf}%"}


def predecir_arbol(categoria: str, area: str, prioridad: str = "Media"):
    """Predicción con Árbol de Decisión para el predictor interactivo (usa Árbol de Clasificación + Regresión)."""
    df, le_cat, le_area, le_prio = _encoded_df()
    if df is None or len(df) < 5:
        return {"prioridad_predicha": "Media", "horas_estimadas": 5.0}

    X_cl = df[["cat_enc","area_enc"]].values
    y_cl = df["prio_enc"].values
    dt_cl = DecisionTreeClassifier(max_depth=4, random_state=42)
    dt_cl.fit(X_cl, y_cl)

    df2 = _load_tickets()
    if df2.empty:
        return {"prioridad_predicha": "Media", "horas_estimadas": 5.0}
    df2["cat_enc"]  = df2["categoria"].map(CAT_MAP).fillna(5)
    df2["prio_enc"] = df2["prioridad"].map(PRIO_MAP).fillna(1)
    dt_rg = DecisionTreeRegressor(max_depth=5, random_state=42)
    dt_rg.fit(df2[["cat_enc","prio_enc","mes"]].values, df2["horas_resolucion"].values)

    try:
        ce = int(le_cat.transform([categoria])[0])
        ae = int(le_area.transform([area])[0])
        pred_prio = dt_cl.predict([[ce, ae]])[0]
        prio_str  = le_prio.inverse_transform([pred_prio])[0]
        pc        = PRIO_MAP.get(prioridad, 1)
        mes       = pd.Timestamp.now().month
        horas     = float(dt_rg.predict([[CAT_MAP.get(categoria,5), pc, mes]])[0])
        conf      = float(max(dt_cl.predict_proba([[ce, ae]])[0]))
    except Exception:
        prio_str, horas, conf = "Media", 5.0, 0.6

    return {
        "prioridad_predicha": prio_str,
        "horas_estimadas": max(0.5, round(horas, 1)),
        "confianza": f"{round(conf*100,1)}%",
        "modelo": "Árbol de Decisión"
    }


def predecir_tiempo(categoria: str, prioridad: str, mes: int = None):
    if mes is None:
        mes = pd.Timestamp.now().month

    df = _load_tickets()
    if df.empty or len(df) < 5:
        default = {"Alta": 2.5, "Media": 5.0, "Baja": 10.0}
        return {"horas_estimadas": default.get(prioridad, 5.0)}

    df["cat_enc"]  = df["categoria"].map(CAT_MAP).fillna(5)
    df["prio_enc"] = df["prioridad"].map(PRIO_MAP).fillna(1)
    X = df[["cat_enc","prio_enc","mes"]].values
    y = df["horas_resolucion"].values

    modelo = DecisionTreeRegressor(max_depth=5, random_state=42)
    modelo.fit(X, y)

    cat_enc = CAT_MAP.get(categoria, 5)
    prio_enc = PRIO_MAP.get(prioridad, 1)
    pred = float(modelo.predict([[cat_enc, prio_enc, mes]])[0])

    return {"horas_estimadas": max(0.5, round(pred, 1))}


def resumen_ml(features_clasif=None, features_reg=None, features_rf=None):
    """Ejecuta y retorna los 3 modelos principales."""
    return {
        "arbol_clasificacion": entrenar_arbol_clasificacion(features_clasif),
        "arbol_regresion":     entrenar_arbol_regresion(features_reg),
        "random_forest":       entrenar_random_forest(features_rf),
    }
