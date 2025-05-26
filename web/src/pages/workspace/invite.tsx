import { Avatar, Card, CardBody, Image, Button } from "@heroui/react"
import logoImage from '@/assets/images/logo/logo.png'; // 相对路径
import { useEffect, useState } from "react";
import { getWorkspaceInviteLinkRequest, joinWorkspaceByInviteLinkRequest } from "@/features/api/workspace";
import { useParams } from "react-router-dom";
import { responseCode } from "@/features/constant/response";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { WorkspaceInviteLinkResponse } from "@/features/api/type";
import { useLingui } from "@lingui/react/macro";
import toast from "react-hot-toast";

enum LinkStatues {
    Active = "active",
    Expired = "expired",
    NotAllow = "not_allow",
    Joined = "joined",
}

const InviteWorkspacePage = () => {
    const params = useParams();
    const { t } = useLingui();
    const user = useSelector((state: RootState) => state.user);
    const [link, setLink] = useState<WorkspaceInviteLinkResponse>();
    const [status, setStatus] = useState<LinkStatues>();
    useEffect(() => {
        if (!params?.id) {
            console.error("Workspace ID is required to fetch invite link.");
            return;
        }
        getWorkspaceInviteLinkRequest(params?.id).then((data) => {
            if (data?.code == responseCode.SUCCESS) {
                setStatus(LinkStatues.Active)
                setLink(data.data);
            }
        })
    }, [params?.id]);

    const AcceptInvitation = async () => {
        if (!link || !link.uuid) {
            console.error("No valid link to accept invitation.");
            return;
        }
        let res = await joinWorkspaceByInviteLinkRequest(link.uuid, link.workspace_id, user.id)
        if (res) {
            toast.success(t`Join workspace successfully!`)
        }
    }
    return (
        <>
            <div className="flex items-center justify-center flex-1">
                <div className="w-full md:w-[36rem] px-4 flex flex-col items-center gap-4">
                    <Image src={logoImage} className="w-48"></Image>
                    <Card>
                        <CardBody className="text-slate-500">
                            {
                                status == LinkStatues.Active && (
                                    <>
                                        <p>尊敬的：{user.nickname || user.email}</p>
                                        <br />
                                        <p className="indent-8">我们邀请你加入我们的工作空间！请点击下面的链接以接受邀请并加入我们的团队。</p>
                                        <Card isPressable className="mt-4">
                                            <CardBody className="text-center">
                                                <div className="flex gap-4 items-center">
                                                    <Avatar className="w-20 h-20 text-large" radius="sm" src={link?.workspace_avatar || "http://swbz2tsc2.hn-bkt.clouddn.com/default.png"}></Avatar>
                                                    <div className="select-none flex flex-col items-start gap-2 flex-1">
                                                        <p className="text-lg font-semibold">{link?.workspace_name}</p>
                                                        <p className="text-start text-sm text-slate-400 leading-5 max-h-20 overflow-y-auto">{link?.workspace_description}</p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                        <div>
                                            <Button className="w-full mt-4" color="primary" variant="solid" onPress={AcceptInvitation}>
                                                {t`Join Workspace`}
                                            </Button>
                                        </div>
                                    </>
                                )
                            }
                        </CardBody>
                    </Card>
                </div>
            </div>
        </>
    )
}

export default InviteWorkspacePage