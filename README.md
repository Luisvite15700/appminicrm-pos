# 🧾 MiniApp - Sistema POS de Facturación Electrónica Perú

Aplicativo mobile nativo para Android desarrollado con **Expo** y **React Native**. Es un sistema POS (Point of Sale) especializado en facturación electrónica Perú con múltiples secciones para gestionar ventas, clientes, inventario y reportes.

---

## 🎯 Características Principales

### 📱 Secciones de la Aplicación

La aplicación está dividida en **5 secciones principales** accesibles desde la barra de navegación inferior:

1. **🏠 Inicio** - Dashboard principal con resumen general del sistema
2. **📦 Inventario** - Gestión de productos y stock disponible
3. **👥 Clientes** - Administración de base de datos de clientes
4. **📊 Reportes** - Gráficos, estadísticas y análisis de ventas
5. **🧾 Facturas** - Sistema de facturación electrónica y emisión de comprobantes

### ⚙️ Características Técnicas

- 🔐 Autenticación de usuarios segura
- 🎨 Interfaz adaptable (modo claro/oscuro)
- 📱 Diseño responsive para diferentes tamaños de pantalla
- 📊 Gráficos y visualización de datos con `react-native-chart-kit`
- 🎭 Componentes Material Design 3 con `react-native-paper`
- 📁 Navegación basada en archivos con `expo-router`
- 💾 Almacenamiento seguro de credenciales con `expo-secure-store`

---

## 🚀 Comenzar

### Requisitos Previos

- Node.js v18+ y npm
- Android Studio (para emulador) o dispositivo Android
- Expo CLI: `npm install -g expo-cli`

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Luisvite15700/appminicrm-main.git
   cd appminicrm-main
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

### Ejecución

#### En Android (Emulador o Dispositivo)
```bash
npm run android
# O manualmente con túnel
npm run android -- --tunnel
```

#### En Web
```bash
npm run web
```

#### En iOS (si está disponible)
```bash
npm run ios
```

#### Iniciar en modo desarrollo
```bash
npm start
```

---

## 📁 Estructura del Proyecto

```
appminicrm-main/
├── app/                      # Código fuente principal
│   ├── _layout.tsx          # Layout raíz con autenticación
│   ├── login.tsx            # Pantalla de login
│   ├── (tabs)/              # Navegación de pestañas
│   │   ├── _layout.tsx      # Configuración de barra inferior
│   │   ├── index.tsx        # Pantalla Inicio
│   │   ├── inventario.tsx   # Gestión de inventario
│   │   ├── clientes.tsx     # Gestión de clientes
│   │   ├── reportes.tsx     # Análisis y gráficos
│   │   └── facturas.tsx     # Sistema de facturación
│   ├── modal.tsx            # Modales generales
│   └── producto/[id].tsx    # Detalle de producto
├── components/              # Componentes reutilizables
├── constants/               # Constantes y temas
├── hooks/                   # Hooks personalizados
│   ├── useSession.tsx      # Gestión de sesión
│   └── use-color-scheme.ts # Tema claro/oscuro
├── assets/                  # Imágenes e iconos
├── app.json                 # Configuración Expo
├── package.json             # Dependencias del proyecto
└── tsconfig.json            # Configuración TypeScript
```

---

## 📦 Dependencias Principales

- **Expo**: Framework para React Native
- **React Native Paper**: Componentes Material Design 3
- **Expo Router**: Enrutamiento basado en archivos
- **React Navigation**: Navegación avanzada
- **react-native-chart-kit**: Gráficos y visualización
- **expo-secure-store**: Almacenamiento seguro

Ver `package.json` para la lista completa de dependencias.

---

## 🔒 Seguridad

- Almacenamiento seguro de tokens de autenticación
- Gestión de sesiones con contexto React
- Validación de permisos de usuario

---

## 📝 Scripts Disponibles

```bash
npm start              # Iniciar servidor de desarrollo
npm run android        # Ejecutar en Android
npm run ios           # Ejecutar en iOS
npm run web           # Ejecutar en web
npm run reset-project # Limpiar y resetear proyecto
npm run lint          # Ejecutar linter (ESLint)
```

---

## 🛠️ Desarrollo

### Agregando Nuevas Pantallas

El proyecto usa **Expo Router** con enrutamiento basado en archivos. Para agregar una nueva pantalla:

1. Crear archivo en `app/` o `app/(tabs)/`
2. El nombre del archivo define la ruta automáticamente
3. Usar componentes de `react-native-paper` para consistencia visual

### Ejemplo de Nueva Pantalla
```tsx
// app/(tabs)/nueva-seccion.tsx
import { View, Text } from 'react-native';

export default function NuevaSeccion() {
  return (
    <View>
      <Text>Nueva Sección</Text>
    </View>
  );
}
```

---

## 📱 Configuración de Android

La aplicación está optimizada para Android con:
- Ícono adaptativo
- Modo edge-to-edge habilitado
- Package: `com.anonymous.appminicrm`
- Bundle ID: `com.anonymous.appminicrm`

---

## 🌐 Localización

La aplicación está completamente en **español**, optimizada para el mercado peruano con soporte para facturación electrónica local.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
2. Hacer commit de los cambios (`git commit -m 'Add some AmazingFeature'`)
3. Push a la rama (`git push origin feature/AmazingFeature`)
4. Abrir un Pull Request

---

## 📄 Licencia

Este proyecto es privado. Todos los derechos reservados.

---

## 📞 Contacto

Para preguntas o sugerencias sobre el proyecto, contacta al equipo de desarrollo.

---

**Última actualización:** Junio 2026
