# Project Overview — test-2

## Structure
```
test-2/
├── app/                          # Android application module
│   ├── src/main/
│   │   ├── java/com/example/myapplication/
│   │   │   ├── MainActivity.kt       # Entry point, Edge-to-Edge
│   │   │   ├── AppScreen.kt          # ??? (not found, may be missing)
│   │   │   └── ui/theme/
│   │   │       ├── Theme.kt          # Material3 theme with dark/light/dynamic
│   │   │       ├── Color.kt          # Color definitions (Purple/Pink scheme)
│   │   │       └── Type.kt           # Typography
│   │   ├── res/                      # Resources (icons, xml configs)
│   │   ├── AndroidManifest.xml
│   │   └── keepRules/rules.keep      # ProGuard/R8 keep rules
│   ├── src/androidTest/               # Instrumented tests
│   └── src/test/                      # Unit tests
├── gradle/libs.versions.toml          # Version catalog (libs.*)
├── build.gradle.kts                   # Root build config
└── gradle.properties                  # Gradle settings
```

## Key Facts
- Package: `com.example.myapplication`
- Min SDK: 24 (Android 7.0), Target SDK: 36
- Compile SDK: 36 (Android 14Q / UpsideDownCake preview)
- Uses Edge-to-Edge mode
- Jetpack Compose only (no XML views)
- AGP 9.2.1, Kotlin 2.2.10, Compose BOM 2026.02.01
- JVM target: 11
- Release build: optimizations disabled (likely for debugging/testing)

## Invariants
- No Activities/Fragments beyond MainActivity
- Single screen app (Scaffold + Greeting composable)
- All theme customization in `ui.theme` package