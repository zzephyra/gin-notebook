package eventRoute

import (
	"gin-notebook/internal/pkg/dto"
	"strconv"
)

func EventsListSerializer(events dto.EventsListDTO) map[string]interface{} {
	eventsList := make([]map[string]interface{}, 0, len(events.Events))
	for _, event := range events.Events {
		e := map[string]interface{}{
			"id":       strconv.FormatInt(event.ID, 10),
			"title":    event.Title,
			"content":  event.Content,
			"start":    event.Start,
			"end":      event.End,
			"color":    event.Color,
			"location": event.Location,
			"allday":   event.AllDay,
			"user": map[string]interface{}{
				"id":       strconv.FormatInt(event.UserID, 10),
				"nickname": event.UserNickname,
				"email":    event.UserEmail,
			},
		}
		rrule := event.Rrule
		if rrule != nil && *rrule != "" {
			e["rrule"] = *rrule
			e["duration"] = event.Duration
			e["rrule_type"] = event.RruleType
		}

		eventsList = append(eventsList, e)
	}
	return map[string]interface{}{
		"events": eventsList,
		"total":  events.Total,
	}
}
