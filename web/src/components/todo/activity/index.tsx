import { Tag, Timeline } from '@douyinfe/semi-ui';
import { TaskActivityProps } from './type';
import { useMemo } from 'react';
import { Avatar } from '@heroui/react';
import { IconPlusCircle } from '@douyinfe/semi-icons';
import { Trans, useLingui } from '@lingui/react';


const TimelineIcon: Record<string, JSX.Element> = {
    create: <IconPlusCircle style={{
        color: "rgba(59,179,70,1)"
    }} />
};

const TaskActivity = (props: TaskActivityProps) => {
    const { i18n } = useLingui();
    function getTimelineAttr(action: string, summary_key: string, summary_params: { to: string | null, from: string | null, field: string }) {
        return {
            dot: TimelineIcon[action],
            extra: <div className="flex flex-wrap items-center gap-1">
                <Trans
                    id={summary_key}
                    values={{
                        field: summary_params?.field ? i18n._(summary_params?.field) : "",
                        from: summary_params?.from,
                        to: summary_params?.to,
                    }}
                    components={{
                        from: <Tag type='solid' color='light-blue' size="small" shape='circle' />,
                        to: <Tag type='solid' color='orange' size="small" shape='circle' />,
                    }}
                />
            </div>
        }
    }

    const activities = useMemo(() => {
        return props.activities.map(activity => {
            return {
                content: <>
                    <div className='flex justify-start items-center gap-1'>
                        <Avatar size='sm' src={activity.member.avatar} />
                        <span className='font-bold text-sm' >{activity.member.nickname}</span>
                        <span className='text-gray-500 text-xs'>{new Date(activity.created_at).toLocaleString()}</span>
                    </div>
                </>,
                // extra: activity.summary_fallback,
                ...getTimelineAttr(activity.action, activity.summary_key, activity.summary_params)
            }
        })
    }, [props.activities]);

    return (
        <>
            {
                activities.length == 0 ?
                    (
                        <>
                        </>
                    ) :
                    <Timeline dataSource={activities} >
                    </Timeline>
            }
        </>
    );
}

export default TaskActivity;