import { ButtonV2 } from "@arconnect/components";
import browser from "webextension-polyfill";
import styled from "styled-components";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { useLocation } from "~wallets/router/router.utils";

export default function BuyButton() {
  return (
    <ButtonWrapper>
      <PureBuyButton />
    </ButtonWrapper>
  );
}

export const PureBuyButton = () => {
  const { navigate } = useLocation();

  return (
    <ButtonV2
      fullWidth
      onClick={() => navigate("/purchase")}
      style={{ display: "flex", gap: "5px" }}
    >
      {browser.i18n.getMessage("buy_ar_button")}
      <ARLogo src={arLogoDark} alt={"AR"} draggable={false} />
    </ButtonV2>
  );
};
const ButtonWrapper = styled.div`
  padding: 16px 15px 0 15px;
`;

const ARLogo = styled.img`
  width: 16px;
  height: 16px;
`;
