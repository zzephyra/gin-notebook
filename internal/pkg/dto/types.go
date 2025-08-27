package dto

import (
	"database/sql/driver"
	"fmt"
	"strings"
	"time"
)

type Date struct{ time.Time }

const dateLayout = "2006-01-02"

// JSON: "YYYY-MM-DD"
func (d *Date) UnmarshalJSON(b []byte) error {
	s := strings.Trim(string(b), `"`)
	if s == "" || s == "null" {
		d.Time = time.Time{}
		return nil
	}
	t, err := time.Parse(dateLayout, s)
	if err != nil {
		return err
	}
	d.Time = t
	return nil
}
func (d Date) MarshalJSON() ([]byte, error) {
	if d.Time.IsZero() {
		return []byte("null"), nil
	}
	return []byte(`"` + d.Time.Format(dateLayout) + `"`), nil
}

func (d Date) Value() (driver.Value, error) {
	if d.Time.IsZero() {
		return nil, nil
	}
	return d.Time.Format(dateLayout), nil
}

// DB 读取：兼容 date/timestamp/text
func (d *Date) Scan(value any) error {
	switch v := value.(type) {
	case time.Time:
		// 某些驱动从 DATE 也会给 time.Time（00:00:00）
		d.Time = v
		return nil
	case []byte:
		t, err := time.Parse(dateLayout, string(v))
		if err != nil {
			return err
		}
		d.Time = t
		return nil
	case string:
		t, err := time.Parse(dateLayout, v)
		if err != nil {
			return err
		}
		d.Time = t
		return nil
	case nil:
		d.Time = time.Time{}
		return nil
	default:
		return fmt.Errorf("unsupported Date Scan type %T", value)
	}
}
