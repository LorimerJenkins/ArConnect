import {
  InputV2 as Input,
  type InputStatus,
  Spacer,
  Text
} from "@arconnect/components";
import { InputWithBtn, InputWrapper } from "./InputWrapper";
import { IconButton } from "~components/IconButton";
import { CopyIcon } from "@iconicicons/react";
import { useState } from "react";
import browser from "webextension-polyfill";
import copy from "copy-to-clipboard";

export default function Tutorial() {
  // arlocal command input status
  const [arLocalCommandStatus, setArLocalCommandStatus] =
    useState<InputStatus>("default");

  return (
    <>
      <Text noMargin>{browser.i18n.getMessage("arlocalCommandTutorial")}</Text>
      <Spacer y={0.4} />
      <InputWithBtn>
        <InputWrapper>
          <Input
            type="text"
            fullWidth
            readOnly
            defaultValue="npx arlocal"
            status={arLocalCommandStatus}
          />
        </InputWrapper>
        <IconButton
          secondary
          onClick={() => {
            copy("npx arlocal");
            setArLocalCommandStatus("success");
          }}
        >
          <CopyIcon />
        </IconButton>
      </InputWithBtn>
    </>
  );
}
