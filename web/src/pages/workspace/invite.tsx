import { Avatar, Card, CardBody, Image, Button } from "@heroui/react"
import logoImage from '@/assets/images/logo/logo.png'; // 相对路径
import { useEffect, useState } from "react";
import { getWorkspaceInviteLinkRequest, joinWorkspaceByInviteLinkRequest } from "@/features/api/workspace";
import { useNavigate, useParams } from "react-router-dom";
import { responseCode } from "@/features/constant/response";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { WorkspaceInviteLinkResponse } from "@/features/api/type";
import { useLingui } from "@lingui/react/macro";
import toast from "react-hot-toast";
import LinkExpire from "@/assets/images/common/link-expire.png";

enum LinkStatues {
    Active = "active",
    Expired = "expired",
    NotAllow = "not_allow",
    Joined = "joined",
    NotExist = "not_exist"
}

const InviteWorkspacePage = () => {
    const params = useParams();
    const navigate = useNavigate();
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
            switch (data?.code) {
                case responseCode.SUCCESS:
                    setStatus(LinkStatues.Active);
                    break;
                case responseCode.ERROR_WORKSPACE_MEMBER_EXIST:
                    setStatus(LinkStatues.Joined);
                    break;
                case responseCode.ERROR_WORKSPACE_INVITE_LINK_NOT_ALLOW_JOIN:
                    setStatus(LinkStatues.NotAllow);
                    break;
                case responseCode.ERROR_WORKSPACE_INVITE_LINK_EXPIRED:
                    setStatus(LinkStatues.Expired);
                    break;
                default:
                    setStatus(LinkStatues.NotExist);
                    return;
            }
            setLink(data.data);
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
                            {
                                status == LinkStatues.Joined && (
                                    <>
                                        <div className="p-4">
                                            <p className="text-lg font-semibold">{t`You have already joined this workspace!`}</p>
                                            <Button className="w-full mt-4" color="primary" variant="solid" onPress={() => navigate(`/workspace/${link?.workspace_id}`)}>
                                                {t`Go to Workspace`}
                                            </Button>
                                        </div>
                                    </>
                                )
                            }
                            {
                                status == LinkStatues.Expired && (
                                    <>
                                        <div className="py-4 px-8 flex flex-col items-center">
                                            <Image src={LinkExpire} className="w-auto mb-2 h-24 mx-auto"></Image>
                                            <p className="text-lg font-semibold">{t`Oops, This invitation link has expired.`}</p>
                                            <Button className="w-full mt-4" color="primary" variant="solid" onPress={() => navigate(`/select`)}>
                                                {t`Go to selct other Workspace`}
                                            </Button>
                                        </div>
                                    </>
                                )
                            }
                            {
                                status == LinkStatues.NotAllow && (
                                    <>
                                        <div className="py-4 px-8 flex flex-col items-center">
                                            <Image src={LinkExpire} className="w-auto mb-2 h-24 mx-auto"></Image>
                                            <p className="text-lg font-semibold">{t`You are not allowed to join this workspace.`}</p>
                                            <Button className="w-full mt-4" color="primary" variant="solid" onPress={() => navigate(`/select`)}>
                                                {t`Go to select other Workspace`}
                                            </Button>
                                        </div>
                                    </>
                                )
                            }
                            {
                                status == LinkStatues.NotExist && (
                                    <>
                                        <div className="py-4 px-8 flex flex-col items-center">
                                            <Image src={LinkExpire} className="w-auto mb-2 h-24 mx-auto"></Image>
                                            <p className="text-lg font-semibold">{t`This invitation link does not exist.`}</p>
                                            <Button className="w-full mt-4" color="primary" variant="solid" onPress={() => navigate(`/select`)}>
                                                {t`Go to select other Workspace`}
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