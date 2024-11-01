import { unlock } from "~wallets/auth";
import {
  ButtonV2,
  InputV2,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { HeadAuth } from "~components/HeadAuth";

export default function Unlock() {
  const { acceptRequest } = useCurrentAuthRequest("unlock");

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // unlock ArConnect
  async function unlockWallet() {
    // unlock using password
    const res = await unlock(passwordInput.state);

    if (res) {
      acceptRequest();
    } else {
      passwordInput.setStatus("error");

      return setToast({
        type: "error",
        content: browser.i18n.getMessage("invalidPassword"),
        duration: 2200
      });
    }
  }

  return (
    <Wrapper>
      <div>
        <HeadAuth title={browser.i18n.getMessage("unlock")} />
        <Spacer y={0.75} />
        <Section>
          <Text noMargin>
            {browser.i18n.getMessage("unlock_wallet_to_use")}
          </Text>
          <Spacer y={1.5} />
          <InputV2
            type="password"
            {...passwordInput.bindings}
            label={browser.i18n.getMessage("password")}
            placeholder={browser.i18n.getMessage("enter_password")}
            fullWidth
            autoFocus
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              unlockWallet();
            }}
          />
        </Section>
      </div>
      <Section>
        <ButtonV2 fullWidth onClick={unlockWallet}>
          {browser.i18n.getMessage("unlock")}
        </ButtonV2>
      </Section>
    </Wrapper>
  );
}
