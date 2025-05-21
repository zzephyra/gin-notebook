import { getUserDevicesList } from '@/features/api/user';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    getKeyValue,
    Chip,
} from '@heroui/react';
import { useEffect, useState } from 'react';
import { useLingui } from '@lingui/react/macro';
import { ComputerDesktopIcon, DevicePhoneMobileIcon, DeviceTabletIcon } from '@heroicons/react/24/solid';
import { UserState } from '@/store/features/user';


const DeviceTable = ({ userInfo }: { userInfo: UserState }) => {
    const { t } = useLingui()
    const [devices, setDevices] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [offset, setOffset] = useState(0)
    const [limit, setLimit] = useState(5)
    useEffect(() => {
        getUserDevicesList(limit, offset).then((res) => {
            setDevices(res.devices)
            setTotal(res.total)
        })
    }, [limit, offset])
    const RenderCell = (columnKey: React.Key, data: any) => {
        switch (columnKey) {
            case 'device':
                return <div className='flex items-center gap-2'>
                    {data.device == "desktop" && <ComputerDesktopIcon className='w-8 text-slate-400' />}
                    {data.device == "mobile" && <DevicePhoneMobileIcon className='w-8 text-slate-400' />}
                    {data.device == "tablet" && <DeviceTabletIcon className='w-8 text-slate-400' />}
                    <div className='flex flex-col gap-2'>
                        <div className='text-xs text-slate-400'>{data.os}</div>
                        {userInfo.device.fingerprint == data.fingerprint ? <div className='text-rose-400 text-[11px]'>{t`Current device`}</div> : null}
                    </div>
                </div>;
            case 'last_active':
                return <div className='text-xs text-slate-400'>
                    {userInfo.device.fingerprint == data.fingerprint ? <div>{t`Now`}</div> : <div>{data.updated_at}</div>}
                </div>
            case 'location':
                return <div className='text-slate-400 text-xs'>
                    {data.city && data.country ? <div className='flex items-center gap-2'>
                        {data.city},{data.country}
                    </div> : <div>{data.country || data.city || t`Unknow`}</div>}
                </div>
            default:
                return <div>test</div>
        }
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableColumn key="device">Device</TableColumn>
                    <TableColumn key="last_active">Last Active</TableColumn>
                    <TableColumn key="location">Locaton</TableColumn>
                </TableHeader>
                <TableBody items={devices}>
                    {(item) => (
                        <TableRow key={item.fingerprint}>
                            {(columnKey) => <TableCell>
                                {RenderCell(columnKey, item)}
                            </TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </>
    )
}

export default DeviceTable