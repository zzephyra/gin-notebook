package errorsx

import "errors"

var ErrNoteSyncConflict = errors.New("the third-party note is already bound to another note")
var ErrAIPromptExists = errors.New("AI prompt with the same intent already exists")
var ErrAIPromptNotFound = errors.New("AI prompt not found")
