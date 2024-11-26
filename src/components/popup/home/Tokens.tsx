import { Heading, TokenCount, ViewAll } from "../Title";
import { Spacer, Text } from "@arconnect/components";
import { useHistory } from "~wallets/router/hash/hash-router.hook";
import { useTokens } from "~tokens";
import { useMemo } from "react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import Token from "../Token";
import { useAoTokens } from "~tokens/aoTokens/ao";

export default function Tokens() {
  // all tokens
  const tokens = useTokens();

  // all tokens
  const [aoTokens, loading] = useAoTokens();

  // assets
  const assets = useMemo(
    () => tokens.filter((token) => token.type === "asset"),
    [tokens]
  );

  // router push
  const [push] = useHistory();

  // handle aoClick
  function handleTokenClick(tokenId) {
    push(`/send/transfer/${tokenId}`);
  }

  return (
    <>
      <Heading>
        <ViewAll onClick={() => push("/tokens")}>
          {browser.i18n.getMessage("view_all")}
          <TokenCount>({assets.length + aoTokens.length})</TokenCount>
        </ViewAll>
      </Heading>
      <Spacer y={1} />
      {assets.length === 0 && aoTokens.length === 0 && (
        <NoTokens>{browser.i18n.getMessage("no_assets")}</NoTokens>
      )}
      <TokensList>
        {aoTokens.map((token) => (
          <Token
            loading={loading}
            key={token.id}
            error={token.balance === null}
            networkError={token.balance === ""}
            divisibility={token.Denomination}
            ao={true}
            type={"asset"}
            defaultLogo={token?.Logo}
            id={token.id}
            ticker={token.Ticker}
            balance={token.balance || "0"}
            onClick={() => handleTokenClick(token.id)}
          />
        ))}
        {assets.slice(0, 8).map((token, i) => (
          <Token
            {...token}
            onClick={() => push(`/token/${token.id}`)}
            key={i}
          />
        ))}
      </TokensList>
    </>
  );
}

const TokensList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.82rem;
`;

const NoTokens = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;
