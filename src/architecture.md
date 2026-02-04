# Necrometer Architecture

```
[Device Sensors] --> SensorService --> DeviceStateService --> EMF/UI Signals
                       |                |-> EmfLogService (history)
                       |-> AnomalyDetectionService --> Logbook

CameraPreview --> VisionComponent --> CameraAnalysisService (visual noise)

SpiritBoxService <-- DeviceStateService (variance) --> SessionLogService
AudioAnalyzerService (mic) --> Toolkit UI

MonetizationService --> Feature gating (spirit box, audio analyzer, export, themes)
UpgradeService --> Credits / Pro tier

PermissionService --> Onboarding overlay + status

SessionLogService --> Logbook + ExportImportService
```
