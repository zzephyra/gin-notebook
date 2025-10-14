import SettingsWrapper from "@/components/setting/wrapper"
import { Steps, Tag } from "@douyinfe/semi-ui"
import { Button } from "@heroui/button"
import { Card, CardBody, Form, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@heroui/react"
import { useLingui } from "@lingui/react/macro"
import { useRef, useState } from "react"
import { useMediaQuery } from "react-responsive"
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, PlusIcon } from "@heroicons/react/24/outline"
import toast from "react-hot-toast"
import { SupportedIntegrationProvider } from "@/types/integration"
import { useIntegration } from "@/contexts/IntegrationContext"
import ChaseLoading from "@/components/loading/Chase/loading";
import { i18n } from "@lingui/core"
import { useAppTheme } from "@/contexts/UIThemeContext"

type IntegrationData = {
    providerID: number;
    provider: string;
    app_id: string;
}

function IntegrationSetting() {
    const { t } = useLingui()
    const integrationFormRef = useRef<HTMLFormElement | null>(null);
    const [step, setStep] = useState(0);
    const { theme } = useAppTheme();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [loading, setLoading] = useState(false)
    const { apps, addNewApp, thirdPartyIntegrations, thirdPartyIntegrationsMapping } = useIntegration()
    const isDesktop = useMediaQuery({ minWidth: 1024 });
    const [data, setData] = useState<Partial<IntegrationData> | null>(null)
    const checkFunction = [
        () => {
            if (!data?.provider) {
                toast.error(t`Please select a provider`)
                return
            }
            setStep(step + 1)
        },
        () => {

            if (integrationFormRef.current) {
                integrationFormRef.current.requestSubmit()
                // const formData = Object.fromEntries(new FormData(integrationFormRef.current));
                // console.log(formData);
            }
        }
    ]

    const handlerSubmit = async (e: any) => {
        e.preventDefault()
        setLoading(true)
        let data = Object.fromEntries(new FormData(e.currentTarget));
        await addNewApp(
            {
                name: data.app_name as string,
                provider: (data.provider as SupportedIntegrationProvider) || "feishu",
                app_id: data.app_id as string,
                app_secret: data.app_secret as string,
                verification_token: (data.verification_token as string) || undefined,
                encrypt_key: (data.encrypt_key as string) || undefined,
            }
        )
        setLoading(false)
        setStep(step + 1)
    }

    return <>
        {theme}
        {/* <Button onPress={() => setTheme(theme == "light" ? "dark" : "light")}>test</Button> */}
        <SettingsWrapper className="h-full" title={t`Integration Setting`} itemClasses="flex-1">
            {
                apps.length ?
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {apps.map((app) => {
                                return <Card>
                                    <CardBody>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                {thirdPartyIntegrationsMapping[app.provider]?.icon}
                                                <span className="font-semibold text-lg ml-2">{app.app_name || i18n._(thirdPartyIntegrationsMapping[app.provider].name)}</span>
                                            </div>
                                            <Tag
                                                size='large'
                                                shape='circle'
                                                type='solid'
                                                className="cursor-pointer select-none"
                                                color={app.is_active ? "light-green" : "red"}>
                                                {app.is_active ? t`Active` : t`Inactive`}
                                            </Tag>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            {i18n._(thirdPartyIntegrationsMapping[app.provider]?.description)}
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <Button variant="ghost" color="primary" className="h-auto w-auto px-4 py-1.5 min-w-0 text-xs" >{t`Manage`}</Button>

                                            <Button variant="flat" className="h-auto w-auto px-4 py-1.5 min-w-0 text-xs" color="danger">{t`Delete`}</Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            })}
                            <Card>
                                <CardBody className="justify-center items-center flex cursor-pointer hover:bg-gray-50" onClick={onOpen}>
                                    <PlusIcon className="w-6 h-6 text-gray-400 mx-auto" />
                                </CardBody>
                            </Card>
                        </div>
                    </> :
                    <>
                        <div className="flex-1 flex flex-col justify-center items-center gap-4">
                            <div >
                                {t`No integration available.`}
                            </div>
                            <div>
                                <Button size="sm" color="primary" onPress={onOpen}>
                                    {t`Create Integration`}
                                </Button>
                            </div>
                        </div>
                    </>
            }
        </SettingsWrapper>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" >
            <ModalContent>
                <ModalHeader>
                    <Steps className="w-full" direction={isDesktop ? "horizontal" : "vertical"} type="basic" current={step} onChange={(i) => console.log(i)}>
                        <Steps.Step title={t`Select Provider`} description="This is a description" />
                        <Steps.Step title={data?.providerID != undefined ? i18n._(thirdPartyIntegrations[data?.providerID].name) : "Processing"} description={data?.providerID != undefined ? i18n._(thirdPartyIntegrations[data?.providerID].description) : "No provider selected yet"} {...data?.providerID != undefined && { icon: thirdPartyIntegrations[data?.providerID].icon }} />
                        <Steps.Step title={t`Success`} description="This is a description" />
                    </Steps>
                </ModalHeader>
                <ModalBody>
                    <AnimatePresence initial={true} mode="popLayout">
                        <motion.div
                            key={step}
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{
                                height: 0,
                                marginTop: 0,
                                marginBottom: 0,
                                paddingTop: 0,
                                paddingBottom: 0,
                            }}
                            transition={{
                                height: { duration: 0.22 },
                            }}
                            layout="position"            // 只做定位布局过渡；如只想尺寸过渡也可改成 "size"
                        // className="overflow-hidden"  // 防止高度收起时内容溢出
                        >
                            {
                                loading ? (<>
                                    <ChaseLoading className="my-6" text={t`Creating the app, please wait patiently…`}></ChaseLoading>
                                </>) :
                                    (step === 0 ? (
                                        <>
                                            <div className="grid md:grid-cols-3 grid-cols-2 gap-2">
                                                {thirdPartyIntegrations.map((item, idx) => (
                                                    <>
                                                        <div onClick={() => setData({ provider: item.key, providerID: idx })} data-selected={data?.provider === item.key} data-provider={item.key} className="data-[selected=true]:border-gray-400 relative cursor-pointer min-w-0 border-dashed border-1.5 hover:border-gray-400 border-gray-300 rounded-lg p-2">
                                                            <div className="flex gap-2">
                                                                {item.icon}
                                                                <span className="select-none font-semibold text-md text-gray-600">
                                                                    {i18n._(item.name)}
                                                                </span>
                                                            </div>
                                                            <div className="select-none text-xs text-gray-500 mt-1">
                                                                {i18n._(item.description)}
                                                            </div>
                                                            {
                                                                data?.provider === item.key && (
                                                                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[24px] border-l-[24px] border-t-blue-500 border-l-transparent rounded-tr-[6px] ">
                                                                        <CheckIcon className="absolute top-[-24px] right-[0px] text-white w-3.5 h-3.5" />
                                                                    </div>
                                                                )
                                                            }
                                                        </div >
                                                    </>
                                                ))}
                                            </div>
                                        </>
                                    ) : step === 1 ? (
                                        <>
                                            <Form ref={integrationFormRef} onSubmit={handlerSubmit}>
                                                <Input
                                                    size="sm"
                                                    labelPlacement="outside"
                                                    label={t`App Name`}
                                                    placeholder={t`Enter a recognizable name for your app`}
                                                    name="app_name"
                                                />
                                                <Input
                                                    size="sm"
                                                    isRequired
                                                    labelPlacement="outside"
                                                    label={t`App ID`}
                                                    placeholder={t`e.g., cli_xxx`}
                                                    name="app_id"
                                                />
                                                <Input
                                                    size="sm"
                                                    isRequired
                                                    labelPlacement="outside"
                                                    label={t`App Secret`}
                                                    placeholder={t`Enter the secret key provided by the platform`}
                                                    name="app_secret"
                                                />

                                                <Input
                                                    size="sm"
                                                    labelPlacement="outside"
                                                    label={t`Verification Token` + t` (optional)`}
                                                    placeholder={t`Used for validating requests (if required)`}
                                                    name="verification_token"
                                                />

                                                <Input
                                                    size="sm"
                                                    labelPlacement="outside"
                                                    label={t`Encrypt Key` + t` (optional)`}
                                                    placeholder={t`Used to decrypt event payloads (if applicable)`}
                                                    name="encrypt_key"
                                                />

                                            </Form>
                                        </>
                                    ) : (<>
                                        <span className="text-lg font-semibold text-gray-600 flex items-center gap-2 text-center">
                                            {t`Integration setup is complete! You can now manage your integration apps in the settings.`}
                                        </span>
                                    </>))
                            }
                        </motion.div>
                    </AnimatePresence>
                    {
                        !loading && <div>
                            <div className="flex justify-end gap-2 mt-4">
                                {
                                    step == 1 ? (
                                        <Button size="sm" onPress={() => setStep(step - 1)}>
                                            {t`Previous`}
                                        </Button>
                                    ) : <></>
                                }
                                {
                                    step < 2 ? (
                                        <Button size="sm" color="primary" onPress={checkFunction[step]}>
                                            {t`Next`}
                                        </Button>
                                    ) : (
                                        <Button size="sm" color="primary" onPress={() => {
                                            setStep(0)
                                            onOpenChange()
                                        }}>
                                            {t`Done`}
                                        </Button>
                                    )
                                }
                            </div>
                        </div>
                    }
                </ModalBody>
            </ModalContent>
        </Modal >
    </>
}

export default IntegrationSetting