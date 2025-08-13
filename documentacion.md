# 📚 Documentación Completa de la API

## 1️⃣ Autenticación

Todos los endpoints requieren autenticación mediante **API Key** en los headers.

http
Authorization: Bearer TU_MASTER_API_KEY
Content-Type: application/json   # Solo en métodos POST


---

## 2️⃣ Endpoints GET (sin JSON requerido)

### 1. Listar todas las tablas
http
GET /api/tables

- **JSON requerido:** ❌ Ninguno  
- **Descripción:** Lista todas las tablas de la base de datos.

---

### 2. Obtener estadísticas de ventas
http
GET /api/productos/estadisticas-ventas

- **JSON requerido:** ❌ Ninguno  
- **Descripción:** Devuelve estadísticas generales de productos por estado de venta.

---

## 3️⃣ Endpoints POST (requieren JSON)

### 3. Obtener estructura de tabla
http
POST /api/table-structure

**JSON requerido:**
json
{ "tableName": "producto" }

**Ejemplos:**
json
{"tableName": "ventas"}
{"tableName": "usuarios"}


---

### 4. Buscar ventas (o todas)
http
POST /api/ventas/search

- **Todas las ventas:**
json
{}

- **Venta específica:**
json
{ "id": 123 }

**Campos disponibles:**
json
{
  "id": 123,
  "ids": [123, 456, 789],
  "precio": 25000,
  "precio_minimo": 20000,
  "precio_maximo": 30000,
  "trasmision": "Manual",
  "id_estado": 1,
  "fecha_venta": "2024-01-15",
  "fecha_desde": "2024-01-01",
  "fecha_hasta": "2024-12-31"
}


---

### 5. Buscar productos (o todos)
http
POST /api/productos/search

- **Todos los productos:**
json
{}

- **Producto específico:**
json
{ "id": 9887 }

**Campos de búsqueda disponibles:** *(ver lista completa en documentación original)*

---

### 6. Productos disponibles (con filtros opcionales)
http
POST /api/productos/disponibles

- **Todos los disponibles:**
json
{}

- **Ejemplo con filtros:**
json
{
  "marca": "TOYOTA",
  "modelo": "LITEACE",
  "anio": "2023",
  "km_maximo": 1000,
  "precio_venta_maximo": 500000
}


---

### 7. Productos vendidos (con filtros opcionales)
http
POST /api/productos/vendidos

- **Todos los vendidos:**
json
{}

- **Ejemplo con filtros:**
json
{
  "marca": "TOYOTA",
  "modelo": "LITEACE",
  "anio": "2023",
  "fecha_venta_desde": "2024-01-01",
  "fecha_venta_hasta": "2024-12-31"
}



### 8. Estado de venta de productos
http
POST /api/productos/estado-venta

**Ejemplos:**
json
{"id": 9887}
{"ids": [9887, 1234, 5678]}
{"estado_venta": "Disponible"}
{"disponible_para_venta": true}

**Estados válidos:** `"Vendido"`, `"Disponible"`, `"Congelado"`, `"Deshabilitado"`, `"No disponible para venta"`



## 4️⃣ Resumen de Endpoints

| # | Endpoint | Método | JSON requerido | Descripción |
|---|----------|--------|----------------|-------------|
| 1 | `/api/tables` | GET | ❌ Ninguno | Lista todas las tablas |
| 2 | `/api/productos/estadisticas-ventas` | GET | ❌ Ninguno | Estadísticas de ventas |
| 3 | `/api/table-structure` | POST | ✅ `{ "tableName": "producto" }` | Estructura de tabla |
| 4 | `/api/ventas/search` | POST | ✅ `{}` o filtros | Buscar ventas |
| 5 | `/api/productos/search` | POST | ✅ `{}` o filtros | Buscar productos |
| 6 | `/api/productos/disponibles` | POST | ✅ `{}` o filtros | Productos disponibles |
| 7 | `/api/productos/vendidos` | POST | ✅ `{}` o filtros | Productos vendidos |
| 8 | `/api/productos/estado-venta` | POST | ✅ Filtros | Estado de venta |

---

## 5️⃣ Ejemplos prácticos

**Buscar vehículo por ID**
bash
POST /api/productos/search
Authorization: Bearer TU_MASTER_API_KEY
Content-Type: application/json

{ "id": 9887 }


**Buscar todos los Toyota disponibles**
bash
POST /api/productos/disponibles
Authorization: Bearer TU_MASTER_API_KEY
Content-Type: application/json

{ "marca": "TOYOTA" }


**Verificar disponibilidad por código alterno**
bash
POST /api/productos/estado-venta
Authorization: Bearer TU_MASTER_API_KEY
Content-Type: application/json

{ "codigo_alterno": "EA-03912" }


**Buscar vehículos con bajo kilometraje**
bash
POST /api/productos/search
Authorization: Bearer TU_MASTER_API_KEY
Content-Type: application/json

{
  "km_maximo": 1000,
  "item_venta": 1,
  "habilitado": 1
}


---

## 6️⃣ Notas importantes
1. Un JSON vacío `{}` devuelve **todos** los registros.
2. Búsquedas de texto son **parciales** (`LIKE`).
3. Búsquedas numéricas son **exactas**, salvo campos con `_minimo` o `_maximo`.
4. Valores booleanos usar `1` (true) o `0` (false).
5. Para múltiples IDs usar `"ids": [123, 456, 789]`.
6. Los filtros son combinables.
