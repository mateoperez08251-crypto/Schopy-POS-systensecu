# Guías y Reglas de Inteligencia Artificial para el Proyecto Schopy POS

> Este documento contiene reglas estrictas y contexto crítico que **TODOS** los agentes de IA (incluyéndome a mí) deben leer y obedecer incondicionalmente al trabajar en este proyecto.

## 1. Reglas sobre CSS y Estilos de Usuario
* **Prohibido alterar estilos del usuario sin permiso:** Si el usuario proporciona un fragmento de código CSS o un diseño específico (como el del Login), **NUNCA** debes modificar los colores, fondos, gradientes o la estructura. Intégralo tal cual.
* **Cuidado con el CSS Global:** Si el usuario proporciona reglas CSS que apuntan a etiquetas globales (como `button`, `label`, `a`, `input`), debes tener extremo cuidado al integrarlas. Si es para un componente específico (ej. `Login`), asegúrate de **aislar** esos estilos (usando scoping con clases contenedoras como `.container button { ... }`) para evitar romper el resto de la aplicación (como el modo oscuro u otros botones), **pero explicando al usuario por qué se hizo el aislamiento**.
* **Modo Oscuro:** Nunca uses colores quemados en el código (como `background: '#fff'` o `color: 'white'`). Utiliza SIEMPRE las variables CSS del proyecto (ej. `var(--bg-card)`, `var(--bg-app)`, `var(--text-primary)`) para garantizar que la transición al modo oscuro funcione a la perfección en toda la UI.

## 2. Reglas sobre Funcionalidad y Botones
* **Refactorización de UI:** Al mover o reemplazar elementos, verifica meticulosamente no duplicar botones por error (como pasó con el botón de "Pausar Venta") y asegúrate de eliminar la versión anterior.
* **Componentes Core:** Componentes críticos como el `TopNav` (que contiene el toggle del Modo Oscuro) y `Sidebar` están conectados al estado global. Un cambio descuidado en CSS global puede romper sus interacciones.

## 3. Filosofía de Diseño
* **Minimalismo:** La interfaz del Punto de Venta (POS) debe ser rápida, enfocada y sin distracciones (e.g. esconder imágenes de productos si el usuario solo quiere ver nombres, usar búsqueda responsiva).
* **Flujo de Usuario (Cajero):** Los cajeros necesitan velocidad. Minimiza los clics necesarios para ver información clave. El carrito y el monto total deben estar siempre visibles sin ventanas emergentes innecesarias.
* **Interpretación de "Ventanas o Modales Independientes":** Cuando el usuario solicite que un apartado sea una "ventana" o "modal" independiente (ej. "Ventas con comprobante sea un modal independiente"), **NO** implementes un popup sobrepuesto (overlays, fondos oscuros, z-index altos o `createPortal`) a menos que sea explícitamente requerido como un "popup" pequeño. En su lugar, crea una **ruta o página completamente nueva (full-page route)** que comparta el mismo diseño y componentes, pero que esté mapeada a su propio enlace en el menú (Sidebar) para que la vista sea limpia, 100% igual a la original y verdaderamente independiente a nivel de navegación.

Hola estoy aquí
