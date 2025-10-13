import useIntegration from "@/hooks/useIntegration";
import { IntegrationApp } from "@/types/integration";
import { Steps } from "@douyinfe/semi-ui";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button, Card, CardBody, Form, Input, Modal, ModalBody, ModalContent, ModalHeader, Select, SelectItem, Tab, Tabs } from "@heroui/react";
import { i18n } from "@lingui/core";
import { useLingui } from "@lingui/react/macro";
import { useState } from "react";
import toast from "react-hot-toast";

function NewSyncModal({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const { t } = useLingui();
    const { apps, thirdPartyIntegrationsMapping } = useIntegration();
    const [data, setData] = useState<{ provider?: string, conflict: string, mode: string, direction: string }>({ conflict: "latest", mode: "auto", direction: "both" });
    const [step, setStep] = useState(0);
    const next = () => {
        var res = callbackFunction[step]();
        console.log(res);
        if (res === false) return;
        setStep(step + 1);
    }

    const callbackFunction: (() => boolean)[] = [
        () => {
            if (data.provider == undefined) {
                toast.error(t`Please select a provider`);
                return false;
            }
            return true;
        },
        () => {
            return true;
        },
        () => {
            return true;
        }
    ]

    return (
        <>
            <Modal classNames={{ wrapper: "z-[1200] " }} isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" className="new-sync-modal">
                <ModalContent>
                    <ModalHeader>
                        {t`Add Synchronization`}
                    </ModalHeader>
                    <ModalBody>
                        <Steps type="basic" className="!dark:text-white" size="small" current={step} onChange={(i) => console.log(i)}>
                            <Steps.Step className="!dark:text-white test" title="Select Provider" />
                            <Steps.Step title="Complete Strategy" />
                            <Steps.Step title="Choose Target" />
                        </Steps>
                        <div>
                            {
                                step === 0 ? (
                                    <div className="grid md:grid-cols-3 grid-cols-2  gap-4 mt-4">
                                        {apps.length != 0 ? (<>
                                            {apps.map((app: IntegrationApp) => <div onClick={() => setData({ ...data, provider: app.provider })} data-selected={data?.provider === app.provider} data-provider={app.provider} className="data-[selected=true]:border-gray-400 relative cursor-pointer min-w-0 border-dashed border-1.5 hover:border-gray-400 border-gray-300 rounded-lg p-2">
                                                <div className="flex gap-2">
                                                    {thirdPartyIntegrationsMapping[app.provider]?.icon}
                                                    <span className="select-none font-semibold text-md text-gray-600">
                                                        {i18n._(thirdPartyIntegrationsMapping[app.provider]?.name)}
                                                    </span>
                                                </div>
                                                <div className="select-none text-xs text-gray-500 mt-1">
                                                    {i18n._(thirdPartyIntegrationsMapping[app.provider]?.description)}
                                                </div>
                                                {
                                                    data?.provider === app.provider && (
                                                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-l-[24px] border-t-blue-500 border-l-transparent rounded-tr-[6px] ">
                                                            <CheckIcon className="absolute top-[-24px] right-[0px] text-white w-3.5 h-3.5" />
                                                        </div>
                                                    )
                                                }
                                            </div >)}
                                        </>) : (<>
                                            <div className="col-span-3 text-center text-gray-500 py-10">
                                                {t`No integration apps available. Please add an integration app first.`}
                                            </div>
                                        </>)}
                                    </div>
                                ) :
                                    step === 1 ? (<>
                                        <Form>
                                            <Select defaultSelectedKeys={[data.mode]} classNames={{ label: "text-gray-500 dark:text-white md:w-[150px] w-[120px]" }} labelPlacement="outside-left" className="mb-2" size="md" name="mode" label={t`Sync Mode`} >
                                                <SelectItem key={"auto"} >
                                                    {t`Auto Sync`}
                                                </SelectItem>
                                                <SelectItem key={"manual"} >
                                                    {t`Manual Sync`}
                                                </SelectItem>
                                            </Select>
                                            <Select defaultSelectedKeys={[data.direction]} classNames={{ label: "text-gray-500 dark:text-white md:w-[150px] w-[120px]" }} labelPlacement="outside-left" name="direction" className="mb-2" size="md" label={t`Sync Direction`} >
                                                <SelectItem key={"push"} >
                                                    {t`Push Only`}
                                                </SelectItem>
                                                <SelectItem key={"pull"} >
                                                    {t`Pull Only`}
                                                </SelectItem>
                                                <SelectItem key={"both"} >
                                                    {t`Two-way Sync`}
                                                </SelectItem>
                                            </Select>
                                            <Select classNames={{ label: "text-gray-500 dark:text-white md:w-[150px] w-[120px]" }} defaultSelectedKeys={[data.conflict]} labelPlacement="outside-left" name="conflict" className="mb-2" size="md" label={t`Conflict Policy`} >
                                                <SelectItem key={"latest"} >
                                                    {t`Latest Modified Wins`}
                                                </SelectItem>
                                            </Select>
                                        </Form>
                                    </>) : (<>
                                        <Form>
                                            <Input classNames={{ label: "md:w-[150px] w-[120px]", mainWrapper: "flex-1" }} labelPlacement="outside-left" className="mb-2" size="md" name="notebook" label={t`Notebook ID`} placeholder={t`Input note id`} />
                                        </Form>
                                    </>)

                            }
                        </div>
                        <div>
                            {
                                step == 1 && <Button size="sm" onPress={() => setStep(step - 1)} className="mr-2">{t`Previous`}</Button>
                            }
                            {
                                step === 2 ? (
                                    <Button size="sm" className="float-right" onPress={() => {
                                        onOpenChange(false);
                                        setStep(0);
                                    }} color="primary">{t`Finish`}</Button>
                                ) : (
                                    <Button className="float-right" size="sm" onPress={next} color="primary">{t`Next`}</Button>
                                )
                            }
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    )
}

export default NewSyncModal;