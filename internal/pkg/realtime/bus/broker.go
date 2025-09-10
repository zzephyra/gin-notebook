package bus

import (
	"sync"
)

type Broker struct {
	mu      sync.RWMutex
	subs    map[string]map[chan Event]struct{} // topic -> set(ch)
	bufSize int
	closed  bool
}

func NewBroker(bufSize int) *Broker {
	if bufSize <= 0 {
		bufSize = 16
	}
	return &Broker{
		subs:    make(map[string]map[chan Event]struct{}),
		bufSize: bufSize,
	}
}

func (b *Broker) Subscribe(topic string) (<-chan Event, func()) {
	ch := make(chan Event, b.bufSize)

	b.mu.Lock()
	if b.closed {
		close(ch)
		b.mu.Unlock()
		return ch, func() {}
	}
	if _, ok := b.subs[topic]; !ok {
		b.subs[topic] = make(map[chan Event]struct{})
	}
	b.subs[topic][ch] = struct{}{}
	b.mu.Unlock()

	unsub := func() {
		b.mu.Lock()
		if set, ok := b.subs[topic]; ok {
			if _, ok := set[ch]; ok {
				delete(set, ch)
				close(ch)
				if len(set) == 0 {
					delete(b.subs, topic)
				}
			}
		}
		b.mu.Unlock()
	}
	return ch, unsub
}

func (b *Broker) Publish(topic string, evt Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	if b.closed {
		return
	}
	set, ok := b.subs[topic]
	if !ok {
		return
	}
	// 非阻塞广播；满了就丢（避免卡死）
	for ch := range set {
		select {
		case ch <- evt:
		default:
			// 可以在此做指标：drop count
		}
	}
}

func (b *Broker) Close() {
	b.mu.Lock()
	if b.closed {
		b.mu.Unlock()
		return
	}
	b.closed = true
	for _, set := range b.subs {
		for ch := range set {
			close(ch)
		}
	}
	b.subs = nil
	b.mu.Unlock()
}
