package algorithm

import (
	"gin-notebook/pkg/logger"
	"strings"

	"github.com/morikuni/go-lexorank"
)

var (
	prefix    = "0"
	separator = '|'
)

func GetBucket() lexorank.Bucket {
	return *lexorank.NewBucket(
		lexorank.WithDefaultPrefix(prefix),
		lexorank.WithSeparator(separator),
	)
}

func RankBetween(a, b string) string {
	bucket := GetBucket()

	betweenValue, err := bucket.Between(lexorank.BucketKey(a), lexorank.BucketKey(b))
	if err != nil {
		initialValue, _ := bucket.Initial()
		return initialValue.String()
	}
	return betweenValue.String()
}

func RankBetweenBucket(a, b lexorank.BucketKey) lexorank.BucketKey {
	bucket := GetBucket()

	betweenValue, err := bucket.Between(a, b)
	if err != nil {
		logger.LogError(err, "Failed to get rank between values")
		initialValue, _ := bucket.Initial()
		return initialValue
	}
	return betweenValue
}

func RankNext(a string) string {
	bucket := GetBucket()

	nextValue, err := bucket.Next(lexorank.BucketKey(a))
	if err != nil {
		initialValue, _ := bucket.Initial()
		return initialValue.String()
	}
	return nextValue.String()
}

func RankPrev(a string) string {
	bucket := GetBucket()

	prevValue, err := bucket.Prev(lexorank.BucketKey(a))
	if err != nil {
		initialValue, _ := bucket.Initial()
		return initialValue.String()
	}
	return prevValue.String()
}

func RankMin() lexorank.BucketKey {
	return lexorank.BucketKey(GenBucketKeyString(strings.Repeat(string(lexorank.DefaultCharacterSet.Min()), 6)))
}

func RankMax() lexorank.BucketKey {
	return lexorank.BucketKey(GenBucketKeyString(strings.Repeat(string(lexorank.DefaultCharacterSet.Max()), 6)))
}

func GenBucketKeyString(key string) string {
	return prefix + string(separator) + key
}
