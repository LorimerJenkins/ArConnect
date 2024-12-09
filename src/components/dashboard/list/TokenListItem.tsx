import { DREContract, DRENode, NODES } from "@arconnect/warp-dre";
import { loadTokenLogo, type Token } from "~tokens/token";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ListItem } from "@arconnect/components";
import { formatAddress } from "~utils/format";
import { getDreForToken } from "~tokens";
import { useTheme } from "~utils/theme";
import * as viewblock from "~lib/viewblock";
import styled from "styled-components";
import { useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { getUserAvatar } from "~lib/avatar";
import { useLocation } from "~wallets/router/router.utils";

export default function TokenListItem({ token, active, ao, onClick }: Props) {
  const { navigate } = useLocation();

  // format address
  const formattedAddress = useMemo(
    () => formatAddress(token.id, 8),
    [token.id]
  );

  // allow dragging with the drag icon
  const dragControls = useDragControls();

  // display theme
  const theme = useTheme();

  // token logo
  const [image, setImage] = useState(viewblock.getTokenLogo(token.id));

  // gateway
  const gateway = useGateway({ startBlock: 0 });

  useEffect(() => {
    (async () => {
      try {
        // if it is a collectible, we don't need to determinate the logo
        if (token.type === "collectible") {
          return setImage(
            `${concatGatewayURL(token.gateway || gateway)}/${token.id}`
          );
        }
        if (ao) {
          if (token.defaultLogo) {
            const logo = await getUserAvatar(token.defaultLogo);
            return setImage(logo);
          } else {
            return setImage(arLogoDark);
          }
        }

        // query community logo using Warp DRE
        const node = new DRENode(await getDreForToken(token.id));
        const contract = new DREContract(token.id, node);
        const result = await contract.query<[string]>(
          "$.settings.[?(@[0] === 'communityLogo')][1]"
        );

        setImage(await loadTokenLogo(token.id, result[0], theme));
      } catch {
        setImage(viewblock.getTokenLogo(token.id));
      }
    })();
  }, [token, theme, gateway, ao]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/tokens/${token.id}`);
    }
  };

  return (
    <Reorder.Item
      as="div"
      value={token}
      id={token.id}
      dragListener={false}
      dragControls={dragControls}
      onClick={handleClick}
    >
      <ListItem
        title={`${token.name} (${token.ticker})`}
        description={
          <DescriptionWrapper>
            {formattedAddress}
            {ao && <Image src={aoLogo} alt="ao logo" />}
            {!ao && <TokenType>{token.type}</TokenType>}
          </DescriptionWrapper>
        }
        active={active}
        dragControls={!ao ? dragControls : null}
      >
        <TokenLogo src={image} />
      </ListItem>
    </Reorder.Item>
  );
}

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const DescriptionWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

const TokenLogo = styled.img.attrs({
  alt: "token-logo",
  draggable: false
})`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.7rem;
  height: 1.7rem;
  user-select: none;
  transform: translate(-50%, -50%);
`;

const TokenType = styled.span`
  padding: 0.08rem 0.2rem;
  background-color: rgb(${(props) => props.theme.theme});
  color: #fff;
  font-weight: 500;
  font-size: 0.62rem;
  text-transform: uppercase;
  margin-left: 0.45rem;
  width: max-content;
  border-radius: 5px;
`;

interface Props {
  token: Token;
  ao?: boolean;
  active: boolean;
  onClick?: () => void;
}
