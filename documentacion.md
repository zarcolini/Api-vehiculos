# 📖 API de Vehículos - Documentación

## Información General

**Base URL:** `http://52.22.44.176:3000`  
**Formato:** JSON  
**Codificación:** UTF-8  

### Características
- ✅ Filtros dinámicos de búsqueda
- ✅ Selección de campos específicos (`fields`)
- ✅ Límite de resultados (`max_results`)
- ✅ Búsquedas parciales con LIKE
- ✅ Filtros de rango (mínimo/máximo)
- ✅ Arrays de IDs múltiples
- ✅ Inclusión de fotos en ventas

### 4. Buscar Estados
```http
POST /api/estados/search
```

**Todos los estados:**
```json
{}
```

**Por nombre:**
```json
{
  "nombre": "Vendido",
  "fields": ["id", "nombre", "ventas_reparacion"]
}
```

**Estados para ventas/reparación:**
```json
{
  "ventas_reparacion": 1,
  "envio_correo": 1
}
```

#### Campos de Búsqueda - Estados

| Campo | Operador | Ejemplo | Descripción |
|-------|----------|---------|-------------|
| `id` | `=` | `{"id": 1}` | ID exacto del estado |
| `ids` | `IN` | `{"ids": [1,2,3]}` | Múltiples IDs de estados |
| `nombre` | `LIKE` | `{"nombre": "Vendido"}` | Búsqueda parcial en nombre |
| `envio_correo` | `=` | `{"envio_correo": 1}` | Estados que envían correo |
| `ventas_reparacion` | `=` | `{"ventas_reparacion": 1}` | Estados para ventas/reparación |

---

## Autenticación

Todos los endpoints requieren autenticación mediante **Bearer Token**:

```http
Authorization: Bearer 42FH9l1LIL07dU0cjAqGA9EcsqVRlrxPYCWK10AIxpRUo1qicdYwMdyLOw33AGzBssScBetx80BNXSECQc02VKUb3c6j5axsenzIQEkIZOPIXMk5xBaLx9bSPrDQ8xdb
Content-Type: application/json
```

**Ejemplo cURL:**
```bash
curl -X POST "http://52.22.44.176:3000/api/productos/search" \
  -H "Authorization: Bearer [TU_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"marca": "Toyota"}'
```

---

## Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Estado del servidor |
| `GET` | `/api/tables` | Lista de tablas disponibles |
| `POST` | `/api/table-structure` | Estructura de una tabla |
| `POST` | `/api/productos/search` | Buscar productos |
| `POST` | `/api/ventas/search` | Buscar ventas |

---

## Utilidades de Filtrado

### Filtros de Parámetros Vacíos

La API automáticamente filtra parámetros vacíos o nulos:

```javascript
// Estos valores se ignoran automáticamente:
{
  "marca": "Toyota",     // ✅ Válido
  "modelo": "",          // ❌ Ignorado (cadena vacía)
  "anio": null,          // ❌ Ignorado (null)
  "color": undefined,    // ❌ Ignorado (undefined)
  "ids": [],             // ❌ Ignorado (array vacío)
  "precio": "null"       // ❌ Ignorado (string "null")
}

// Resultado procesado:
{
  "marca": "Toyota"
}
```

### Validación de Límites

Los límites de resultados se validan automáticamente:

```json
{
  "marca": "Toyota",
  "max_results": 50      // Debe ser número entero positivo
}
```

---

## Filtros de Campos

Todos los endpoints de búsqueda soportan el parámetro `fields` para seleccionar columnas específicas:

### Sintaxis
```json
{
  "marca": "Toyota",
  "fields": ["id", "nombre", "precio_venta", "km"],
  "max_results": 10
}
```

### Campos Disponibles - Productos
```json
[
  "id", "codigo_alterno", "nombre", "codigo_grupo", "habilitado",
  "congelado", "item_compra", "item_venta", "item_inventario",
  "codigo_hertz", "tipo", "tipo_sap", "marca", "anio", "modelo",
  "color", "cilindrada", "serie", "motor", "placa", "tipo_vehiculo",
  "chasis", "precio_costo", "precio_venta", "km", "k5", "k10",
  "k20", "k40", "k100", "sincronizado", "horas", "tipo_mant", "clase"
]
```

### Campos Disponibles - Ventas
```json
[
  "id", "numero", "id_usuario", "id_tienda", "id_estado", "id_producto",
  "kilometraje", "cilindraje", "trasmision", "precio_minimo",
  "precio_maximo", "precio_venta", "fecha", "hora", "fecha_vendido",
  "fecha_negociacion", "fecha_asignacion", "fecha_reparacion_completada",
  "fecha_promesa", "id_vendedor", "id_televentas", "id_impuesto",
  "id_factura", "foto", "id_inspeccion", "id_estado_pintura",
  "id_estado_interior", "id_estado_mecanica", "tipo_ventas_reparacion",
  "reproceso", "observaciones", "observaciones_reparacion",
  "fecha_creacion", "usuario_creacion", "fecha_modificacion", "usuario_modificacion"
]
```

### Campos Disponibles - Estados
```json
[
  "id", "nombre", "foto", "envio_correo", "ventas_reparacion"
]
```

---

## Endpoints GET

### 1. Salud del Servidor
```http
GET /api/health
```

**Respuesta:**
```json
{
  "status": "success",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-12-14T10:30:00Z",
  "uptime": 3600
}
```

### 2. Listar Tablas
```http
GET /api/tables
```

**Respuesta:**
```json
{
  "status": "success",
  "count": 4,
  "data": {
    "tables": ["producto", "ventas", "estados", "usuarios"]
  }
}
```

---

## Endpoints POST

### 1. Estructura de Tabla
```http
POST /api/table-structure
```

**Body:**
```json
{ "tableName": "producto" }
```

### 2. Buscar Productos
```http
POST /api/productos/search
```

#### Ejemplos de Búsqueda

**Todos los productos:**
```json
{}
```

**Por ID específico:**
```json
{ "id": 14034 }
```

**Por múltiples IDs:**
```json
{ "ids": [14034, 15672, 16890] }
```

**Búsqueda avanzada:**
```json
{
  "marca": "Toyota",
  "tipo_vehiculo": "Pick up",
  "anio_desde": "2020",
  "anio_hasta": "2024",
  "precio_venta_maximo": 500000,
  "km_maximo": 50000,
  "habilitado": 1,
  "fields": ["id", "nombre", "marca", "precio_venta", "km"],
  "max_results": 20
}
```

#### Campos de Búsqueda - Productos

| Campo | Operador | Ejemplo | Descripción |
|-------|----------|---------|-------------|
| `id` | `=` | `{"id": 14034}` | ID exacto |
| `ids` | `IN` | `{"ids": [1,2,3]}` | Múltiples IDs |
| `codigo_alterno` | `LIKE` | `{"codigo_alterno": "ABC123"}` | Código alterno |
| `nombre` | `LIKE` | `{"nombre": "Hilux"}` | Búsqueda parcial en nombre |
| `marca` | `LIKE` | `{"marca": "Toyota"}` | Búsqueda parcial |
| `anio` | `=` | `{"anio": "2024"}` | Año exacto |
| `anio_desde` | `>=` | `{"anio_desde": "2020"}` | Desde año |
| `anio_hasta` | `<=` | `{"anio_hasta": "2024"}` | Hasta año |
| `modelo` | `LIKE` | `{"modelo": "Camry"}` | Modelo del vehículo |
| `color` | `LIKE` | `{"color": "Blanco"}` | Color del vehículo |
| `cilindrada` | `LIKE` | `{"cilindrada": "2.4"}` | Cilindrada del motor |
| `tipo_vehiculo` | `LIKE` | `{"tipo_vehiculo": "Pick up"}` | Tipo de vehículo |
| `serie` | `LIKE` | `{"serie": "ABC123"}` | Serie del motor |
| `motor` | `LIKE` | `{"motor": "4AFE"}` | Código del motor |
| `placa` | `LIKE` | `{"placa": "PBA123"}` | Placa del vehículo |
| `chasis` | `LIKE` | `{"chasis": "XYZ456"}` | Número de chasis |
| `precio_costo` | `=` | `{"precio_costo": 150000}` | Precio costo exacto |
| `precio_costo_minimo` | `>=` | `{"precio_costo_minimo": 100000}` | Precio costo mínimo |
| `precio_costo_maximo` | `<=` | `{"precio_costo_maximo": 300000}` | Precio costo máximo |
| `precio_venta` | `=` | `{"precio_venta": 200000}` | Precio venta exacto |
| `precio_venta_minimo` | `>=` | `{"precio_venta_minimo": 100000}` | Precio venta mínimo |
| `precio_venta_maximo` | `<=` | `{"precio_venta_maximo": 500000}` | Precio venta máximo |
| `km` | `=` | `{"km": 50000}` | Kilometraje exacto |
| `km_minimo` | `>=` | `{"km_minimo": 10000}` | Kilometraje mínimo |
| `km_maximo` | `<=` | `{"km_maximo": 50000}` | Kilometraje máximo |
| `horas` | `=` | `{"horas": 1000}` | Horas exactas |
| `horas_minimo` | `>=` | `{"horas_minimo": 500}` | Horas mínimas |
| `horas_maximo` | `<=` | `{"horas_maximo": 2000}` | Horas máximas |
| `habilitado` | `=` | `{"habilitado": 1}` | Producto habilitado |
| `congelado` | `=` | `{"congelado": 0}` | Producto no congelado |
| `item_venta` | `=` | `{"item_venta": 1}` | Es item de venta |
| `item_compra` | `=` | `{"item_compra": 1}` | Es item de compra |
| `item_inventario` | `=` | `{"item_inventario": 1}` | Es item de inventario |
| `tipo` | `=` | `{"tipo": "V"}` | Tipo de producto |
| `tipo_mant` | `=` | `{"tipo_mant": "P"}` | Tipo de mantenimiento |
| `codigo_grupo` | `LIKE` | `{"codigo_grupo": "GRP1"}` | Código de grupo |
| `clase` | `LIKE` | `{"clase": "SEDAN"}` | Clase del vehículo |

### 3. Buscar Ventas
```http
POST /api/ventas/search
```

**Parámetros especiales para ventas:**
- `include_photos`: Incluye información de fotos asociadas (estructura simplificada)

**Todas las ventas:**
```json
{}
```

**Por producto con fotos:**
```json
{
  "producto_id": 14034,
  "include_photos": true,
  "fields": ["id", "precio_venta", "fecha_vendido"],
  "max_results": 10
}
```

**Por rango de fechas:**
```json
{
  "fecha_desde": "2024-01-01",
  "fecha_hasta": "2024-12-31",
  "precio_minimo": 100000,
  "fields": ["id", "id_producto", "precio_venta", "fecha_vendido"]
}
```

#### Campos de Búsqueda - Ventas

| Campo | Operador | Ejemplo | Descripción |
|-------|----------|---------|-------------|
| `id` | `=` | `{"id": 5001}` | ID exacto de venta |
| `ids` | `IN` | `{"ids": [5001,5002,5003]}` | Múltiples IDs de venta |
| `producto_id` | `=` | `{"producto_id": 14034}` | ID del producto vendido |
| `productos_ids` | `IN` | `{"productos_ids": [14034,15672]}` | Múltiples IDs de productos |
| `numero` | `=` | `{"numero": "V001"}` | Número de venta |
| `id_usuario` | `=` | `{"id_usuario": 123}` | ID del usuario |
| `id_tienda` | `=` | `{"id_tienda": 1}` | ID de la tienda |
| `id_estado` | `=` | `{"id_estado": 2}` | ID del estado |
| `id_vendedor` | `=` | `{"id_vendedor": 456}` | ID del vendedor |
| `precio_venta` | `=` | `{"precio_venta": 250000}` | Precio venta exacto |
| `precio_minimo` | `>=` | `{"precio_minimo": 100000}` | Precio mínimo |
| `precio_maximo` | `<=` | `{"precio_maximo": 500000}` | Precio máximo |
| `fecha` | `=` | `{"fecha": "2024-01-15"}` | Fecha exacta |
| `fecha_desde` | `>=` | `{"fecha_desde": "2024-01-01"}` | Desde fecha |
| `fecha_hasta` | `<=` | `{"fecha_hasta": "2024-12-31"}` | Hasta fecha |
| `fecha_vendido` | `=` | `{"fecha_vendido": "2024-01-20"}` | Fecha de venta |
| `trasmision` | `=` | `{"trasmision": "Manual"}` | Tipo de transmisión |
| `kilometraje` | `=` | `{"kilometraje": 25000}` | Kilometraje exacto |
| `tipo_ventas_reparacion` | `=` | `{"tipo_ventas_reparacion": "R"}` | Tipo venta/reparación |

---

## Ejemplos Prácticos

### Caso 1: Buscar Toyota Hilux 2024
```json
{
  "marca": "Toyota",
  "nombre": "Hilux",
  "anio": "2024",
  "habilitado": 1,
  "fields": [
    "id", "nombre", "marca", "modelo", "anio",
    "color", "precio_venta", "km", "motor", "cilindrada"
  ],
  "max_results": 5
}
```

### Caso 2: Vehículos Disponibles de Bajo Kilometraje
```json
{
  "km_maximo": 10000,
  "item_venta": 1,
  "habilitado": 1,
  "congelado": 0,
  "fields": ["id", "nombre", "marca", "km", "precio_venta"],
  "max_results": 20
}
```

---

## Códigos de Respuesta

### Respuestas Exitosas

**200 - Success:**
```json
{
  "status": "success",
  "count": 5,
  "data": [...],
  "limited": true,
  "max_results_applied": 10,
  "fields_selected": ["id", "nombre", "precio_venta"]
}
```

**404 - No encontrado:**
```json
{
  "status": "fail",
  "message": "No se encontraron productos con los criterios especificados."
}
```

### Respuestas de Error

**400 - Bad Request:**
```json
{
  "status": "error",
  "message": "JSON malformado. Verifique la sintaxis.",
  "received_data": "{ marca: Toyota, }"
}
```

**401 - Unauthorized:**
```json
{
  "status": "error",
  "message": "Token de autorización inválido"
}
```

**415 - Unsupported Media Type:**
```json
{
  "status": "error",
  "message": "Content-Type no soportado. Se esperaba application/json."
}
```

---

## Troubleshooting

### Problemas Comunes

#### 1. Error 415 - Content-Type
**Problema:** `Unsupported Media Type`  
**Solución:** Agregar header `Content-Type: application/json`

#### 2. Error 400 - JSON Malformado
**Problema:**
```json
{ marca: "Toyota", precio_venta:, }
```

**Solución:**
```json
{ "marca": "Toyota", "precio_venta": null }
```

#### 3. Error 401 - Sin Autorización
**Problema:** Token faltante o inválido  
**Solución:** Verificar el Bearer Token en headers

#### 4. Error 404 - Sin Resultados
**Problema:** Filtros muy restrictivos  
**Solución:** Ampliar criterios de búsqueda o usar `{}`

### Tips de Optimización

1. **Use `fields`** para reducir el tamaño de respuesta
2. **Use `max_results`** para limitar resultados
3. **Combine filtros** para búsquedas específicas
4. **Use arrays de IDs** para consultas múltiples eficientes
5. **Use `include_photos: true`** solo cuando necesite imágenes

### Formato de Fechas
- **Formato:** `YYYY-MM-DD`
- **Ejemplo:** `"2024-12-14"`
- **Zona horaria:** UTC

### Valores Booleanos
- **Verdadero:** `1` o `true`
- **Falso:** `0` o `false`

---

**Versión:** 2.1