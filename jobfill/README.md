# JobFill — autofill de vacantes con tu CV

Extensión de Chrome (Manifest V3, sin build) que rellena formularios de postulación (Greenhouse, Lever, Workable, Ashby, formularios propios...) con tu perfil y sube tu CV automáticamente.

## Instalar
1. `chrome://extensions` → activa **Modo desarrollador**.
2. **Cargar descomprimida** → selecciona la carpeta `jobfill/`.
3. Clic derecho en el ícono → **Opciones**: llena tu perfil y sube tu CV (PDF). Guardar.

## Usar
En la página de la vacante: clic en el ícono → **Autorrellenar**, o `Alt+Shift+F`. Los campos rellenados se marcan en verde y el popup lista los que quedaron sin rellenar.

## Cómo funciona
- `lib/matcher.js`: reglas regex (ES/EN) campo → clave del perfil. Añade sinónimos ahí.
- `content.js`: lee label/placeholder/name/aria de cada campo, atraviesa shadow DOM e iframes, usa el setter nativo + eventos (compatible con React), maneja selects, radios sí/no y `<input type=file>` para el CV.
- No pisa campos que ya tienen valor. Todo en `chrome.storage.local`; nada sale de tu navegador.

## Limitaciones / siguientes pasos
- Workday y otros formularios con widgets personalizados (dropdowns no nativos) pueden requerir reglas extra.
- Preguntas abiertas específicas de cada empresa no se contestan (se listan como "sin rellenar").
- Idea siguiente: extraer el perfil automáticamente del PDF del CV y/o responder preguntas abiertas con la API de Claude (clave propia en opciones).
