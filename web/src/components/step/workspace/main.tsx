import { useAnimate, motion } from "motion/react";
import { Trans as TransMacro, useLingui } from "@lingui/react/macro";
import {
  Button,
  Card,
  CardBody,
  Divider,
  Form,
  Input,
  Textarea,
  Select,
  SelectItem,
  Snippet,
} from "@heroui/react";
import { useState, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import ChaseLoading from "@/components/loading/Chase/loading";
import { CreateWorkspace } from "@/features/api/workspace";
import { responseCode } from "@/features/constant/response";
import { useNavigate } from "react-router-dom";

export default function WorkspaceInitStep() {
  const uuid = uuidv4().replace(/-/g, "");
  const [currentStep, setStep] = useState(0);
  const navicate = useNavigate();
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState({});
  const [titleRef] = useAnimate();
  const link = useMemo(() => {
    return `${window.location.origin}/invite/${uuid}`;
  }, [workspaceName]);
  const [disableCreate, setDisableCreate] = useState(true);
  const { t } = useLingui();
  const base_style =
    "flex flex-col items-center justify-center h-full gap-6 w-full";
  const expireOptions = [
    { value: "1", label: t`1 day` },
    { value: "7", label: t`7 days` },
    { value: "14", label: t`14 days` },
    { value: "30", label: t`30 days` },
    { value: "", label: t`No expiration` },
  ];
  const next = () => {
    setStep((current) => current + 1);
  };

  const prev = () => {
    setStep((current) => current - 1);
  };

  const validateWorkspaceName = (value: string) => {
    const isValid = /^[a-zA-Z0-9-_]+$/.test(value);
    return isValid;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    next();
    let data = Object.fromEntries(new FormData(e.currentTarget));
    let isWorkspaceNameValid = validateWorkspaceName(workspaceName);
    if (!isWorkspaceNameValid) {
      setError({ name: "The workspace name contains illegal characters" });
      toast.error(t`The workspace name contains illegal characters`);
      return;
    }
    data["name"] = workspaceName;
    data["uuid"] = uuid;
    const res = await CreateWorkspace(data);
    if (res.code == responseCode.SUCCESS) {
      navicate(`/workspace/${res.data}`);
    } else {
      prev();
      toast.error(t`Create workspace failed`);
    }
  }

  const handleChangeWorkspaceName = (value: string) => {
    const isValid = validateWorkspaceName(value);
    setDisableCreate(!isValid);
    setWorkspaceName(value);
    if (!isValid) {
      setError({ name: "The workspace name contains illegal characters" });
    }
  };

  return (
    <Form className="" onSubmit={handleSubmit} validationErrors={error}>
      {currentStep == 0 && (
        <div className={base_style}>
          <motion.div ref={titleRef}>
            <h1 className="font-bold text-2xl text-center">
              <TransMacro>Hi! Welcome to Memoas!</TransMacro>
            </h1>
            <h1 className="font-bold text-2xl text-center">
              <TransMacro>We are glad to have you here.</TransMacro>
            </h1>
          </motion.div>
          <div>
            <Button onPress={next}>
              <TransMacro>Get Started</TransMacro>
            </Button>
          </div>
        </div>
      )}
      {currentStep == 1 && (
        <div className={base_style}>
          <motion.div>
            <h1 className="font-bold text-2xl text-center mb-3.5">
              <TransMacro>Create a new workspace</TransMacro>
            </h1>
            <p className="text-center text-slate-400">
              <TransMacro>
                To ensure compatibility, please avoid special characters in the
                name.
              </TransMacro>
            </p>
          </motion.div>
          <motion.div
            className="w-96"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Input
              value={workspaceName}
              onValueChange={handleChangeWorkspaceName}
              isRequired
              label={t`Workspace Name`}
              name="name"
            ></Input>
          </motion.div>
          <div>
            <Button onPress={next} isDisabled={disableCreate}>
              <TransMacro>Create Workspace</TransMacro>
            </Button>
          </div>
        </div>
      )}
      {currentStep == 2 && (
        <div className={base_style}>
          <motion.div>
            <h1 className="font-bold text-2xl text-center mb-3.5">
              <TransMacro>Invite to your workspace</TransMacro>
            </h1>
            <p className="text-center text-slate-400">
              <TransMacro>
                If you're bringing a guest, feel free to add their email
                below—or simply copy and share the invite link with them!
              </TransMacro>
            </p>
          </motion.div>
          <Card className="w-full">
            <CardBody>
              <Textarea
                labelPlacement="outside"
                label={t`Emails`}
                name="emails"
                placeholder={t`Emails go here → one@example.com, two@example.com`}
              />
              <Divider className="my-4" />
              <div className="flex flex-col gap-6">
                <Snippet symbol="#" variant="bordered" onCopy={() => { navigator.clipboard.writeText(link); }}>
                  {uuid}
                </Snippet>
                <Select
                  labelPlacement="outside"
                  label={t`Expiration`}
                  placeholder="Select a user"
                  defaultSelectedKeys={[""]}
                  name="expiration"
                >
                  {expireOptions.map((option) => (
                    <SelectItem key={option.value}>{option.label}</SelectItem>
                  ))}
                </Select>
              </div>
            </CardBody>
          </Card>
          <div className="flex justify-between w-full">
            <Button onPress={prev}>
              <TransMacro>Back</TransMacro>
            </Button>
            <Button type="submit">
              <TransMacro>Submit</TransMacro>
            </Button>
          </div>
        </div>
      )}
      {currentStep == 3 && (
        <div className="w-full items-center flex justify-center h-full">
          <ChaseLoading text={t`Creating workspace...`} />
        </div>
      )}
    </Form>
  );
}
