package errorsx

import "errors"

var ErrNoteSyncConflict = errors.New("the third-party note is already bound to another note")
