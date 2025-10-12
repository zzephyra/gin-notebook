package integrationService

type SyncMode string

const (
	SyncModeAuto      SyncMode = "auto"
	SyncModeForcePush SyncMode = "force_push"
	SyncModeForcePull SyncMode = "force_pull"
)
