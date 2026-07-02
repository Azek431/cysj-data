# Tech Stack — test-2

## Languages & Frameworks
- **Kotlin 2.2.10** — sole language
- **Jetpack Compose** — declarative UI (no XML views)
- **Material3** — design system (dynamic colors on Android 12+)

## Build System
- **AGP 9.2.1** (Android Gradle Plugin)
- **Gradle** (version catalog via `libs.versions.toml`)
- **KSP**: not used
- **Kotlin JVM target**: 11

## Compose BOM
- `androidx.compose:compose-bom:2026.02.01`
- Modules: ui, graphics, tooling, tooling-preview, material3, test-manifest, test-junit4

## Testing
- **JUnit 4.13.2** — unit tests
- **AndroidX Test 1.1.5** — instrumented tests
- **Espresso 3.5.1** — UI testing

## Dependencies (key)
- `androidx.core:core-ktx:1.10.1`
- `androidx.lifecycle:lifecycle-runtime-ktx:2.6.1`
- `androidx.activity:activity-compose:1.8.0`