import { Field, RuleGroupType, RuleType } from "react-querybuilder"

export enum FilterType {

}

export type FilterOptions = {

}

export type AdvancedFilterProps = {
    fields: Field[]
    query: RuleGroupType
    onChange?: (query: RuleGroupType<RuleType<string, string, any, string>, string>) => void | undefined
}