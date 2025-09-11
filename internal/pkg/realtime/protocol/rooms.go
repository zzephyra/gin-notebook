package protocol

import "strings"

const (
	RoomPrefixProject = "project_presence:"
	RoomPrefixTask    = "task_events:"
)

func IsProjectRoom(r string) bool { return strings.HasPrefix(r, RoomPrefixProject) }
func IsTaskRoom(r string) bool    { return strings.HasPrefix(r, RoomPrefixTask) }
func TaskRoom(id string) string   { return RoomPrefixTask + id }
