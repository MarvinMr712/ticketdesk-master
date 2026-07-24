import time
import ml_model as ml

class MLService:
    def __init__(self, ttl=300):
        self.cache = {}
        self.ttl = ttl

    def _get_cached(self, key, trainer, *args, **kwargs):
        now = time.time()
        if key in self.cache:
            result, timestamp = self.cache[key]
            if now - timestamp < self.ttl:
                return result
        result = trainer(*args, **kwargs)
        self.cache[key] = (result, now)
        return result

    def predecir_tiempo(self, categoria, prioridad, mes=None):
        return ml.predecir_tiempo(categoria, prioridad, mes)

    def predecir_arbol(self, categoria, area, prioridad="Media"):
        return ml.predecir_arbol(categoria, area, prioridad)

    def predecir_rf(self, categoria, area):
        return ml.predecir_rf(categoria, area)

    def resumen_ml(self, features_clasif=None, features_reg=None, features_rf=None):
        key = (tuple(features_clasif or []), tuple(features_reg or []), tuple(features_rf or []))
        return self._get_cached(key, ml.resumen_ml, features_clasif, features_reg, features_rf)

ml_service = MLService()
