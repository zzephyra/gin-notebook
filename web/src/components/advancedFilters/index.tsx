import { QueryBuilder } from 'react-querybuilder';
// import 'react-querybuilder/dist/query-builder.css';
import { AdvancedFilterProps } from './type';
import 'react-querybuilder/dist/query-builder.css';
import { Button, Input, Select, SelectItem } from '@heroui/react';
import './style.css';

function InlineCombinator(props: any) {
    return (
        <div className="rqb-inline-combinator inline-flex items-center gap-2">
            {props.component?.(props)}
        </div>
    );
}

function ruleGroupBodyElements(props: any) {
    console.log("ruleGroupBodyElements props", props);
    return (
        <div className="rqb-rulegroup-body flex flex-col gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
            {props.schema.getValueEditorSeparator()}
        </div>
    );
}

function MyAwesomeSelector(props: any) {
    return (
        <Select
            size="sm"
            className="w-[100px] h-[32px]"
            classNames={{ innerWrapper: "min-h-0" }}
            defaultSelectedKeys={[props.value]}
        >
            {props.options.map((opt: any) => (
                <SelectItem key={opt.value}>{opt.label}</SelectItem>
            ))}
        </Select>
    );
}

function MyAwesomeValueEditor(_: any) {
    return (
        <Input classNames={{ inputWrapper: "min-h-0 h-[32px]" }} />
    );
}

function MyAwesomeButton(props: any) {
    // console.log("button props", props);
    return (
        <Button size='sm'  {...props} onClick={props.handleOnClick}>
            {props.label}
        </Button>
    )
}

function AdvancedFilters(props: AdvancedFilterProps) {
    return (
        <QueryBuilder
            // controlClassnames={{ queryBuilder: 'queryBuilder-justified' }}
            // controlClassnames={{
            //     ruleGroup: 'rqb-row-group',
            //     rule: 'rqb-row-rule',
            // }}
            showCombinatorsBetweenRules
            controlElements={{
                rule: ruleGroupBodyElements,
                inlineCombinator: InlineCombinator,
                valueEditor: MyAwesomeValueEditor,
                valueSelector: MyAwesomeSelector,
                actionElement: MyAwesomeButton,
            }}
            fields={props.fields} query={props.query} onQueryChange={props?.onChange} />
    );
}

export default AdvancedFilters;