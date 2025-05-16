package repository

type QueryCondition struct {
	Field    string
	Operator string
	Value    interface{}
}
