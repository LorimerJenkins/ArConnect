import {
  balanceToFractioned,
  formatFiatBalance,
  formatTokenBalance
} from "~tokens/currency";
import { concatGatewayURL } from "~gateways/utils";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Loading, Section, Spacer, Text } from "@arconnect/components";
import { DREContract, DRENode } from "@arconnect/warp-dre";
import { usePrice, usePriceHistory } from "~lib/redstone";
import { useEffect, useMemo, useState } from "react";
import { getDreForToken, useTokens } from "~tokens";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { getCommunityUrl } from "~utils/format";
import { useLocation } from "~wallets/router/router.utils";
import { useTheme } from "~utils/theme";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CloseIcon,
  EyeIcon,
  GlobeIcon,
  MessageIcon,
  ShareIcon,
  WarningTriangleIcon
} from "@iconicicons/react";
import {
  getInteractionsTxsForAddress,
  getSettings,
  loadTokenLogo,
  parseInteractions,
  type TokenInteraction,
  type TokenState
} from "~tokens/token";
import Title, { Heading } from "~components/popup/Title";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import Interaction from "~components/popup/asset/Interaction";
import PriceChart from "~components/popup/asset/PriceChart";
import TokenLoading from "~components/popup/asset/Loading";
import * as viewblock from "~lib/viewblock";
import browser from "webextension-polyfill";
import Skeleton from "~components/Skeleton";
import useSetting from "~settings/hook";
import styled from "styled-components";
import { STAKED_GQL_FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";

export interface AssetViewParams {
  id: string;
}

export type AssetViewProps = CommonRouteProps<AssetViewParams>;

export function AssetView({ params: { id } }: AssetViewProps) {
  const { navigate } = useLocation();

  // load state
  const [state, setState] = useState<TokenState>();
  const [validity, setValidity] = useState<{ [id: string]: boolean }>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const dre = await getDreForToken(id);
      const contract = new DREContract(id, new DRENode(dre));
      // @ts-expect-error
      const { state, validity } = await contract.getState<TokenState>();

      setState(state);
      setValidity(validity);
      setLoading(false);
    })();
  }, [id]);

  // price period
  const [period, setPeriod] = useState("Day");

  // community settings
  const settings = useMemo(() => {
    if (!state || !state.settings) return undefined;

    return getSettings(state);
  }, [state]);

  // chat link urls
  const chatLinks = useMemo<string[]>(() => {
    const val = settings?.get("communityDiscussionLinks");

    if (!val) return [];

    return val as string[];
  }, [settings]);

  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // balance in units of the token
  const tokenBalance = useMemo(() => {
    if (!state) return "0";

    const val = balanceToFractioned(
      String(state.balances?.[activeAddress] || "0"),
      {
        id,
        decimals: state.decimals,
        divisibility: state.divisibility
      }
    );

    return formatTokenBalance(val);
  }, [id, state, activeAddress]);

  // token gateway
  const tokens = useTokens();
  const defaultGateway = useGateway(STAKED_GQL_FULL_HISTORY);
  const gateway = useMemo(
    () => tokens.find((t) => t.id === id)?.gateway || defaultGateway,
    [id, defaultGateway]
  );

  // fetch interactions
  const [interactions, setInteractions] = useState<TokenInteraction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  useEffect(() => {
    (async () => {
      if (!activeAddress || !validity || !id) {
        return;
      }

      setLoadingInteractions(true);
      setInteractions([]);

      try {
        // fetch interactions
        const allInteractions = await getInteractionsTxsForAddress(
          id,
          activeAddress,
          gateway
        );

        // compare validity
        const validInteractions = allInteractions.filter(
          (tx) => !!validity[tx.node.id]
        );

        setInteractions(
          parseInteractions(
            validInteractions,
            activeAddress,
            state?.ticker,
            state?.divisibility
          )
        );
      } catch {}

      setLoadingInteractions(false);
    })();
  }, [id, activeAddress, validity, state, gateway]);

  // token price
  const { price, loading: loadingPrice } = usePrice(state?.ticker);

  // token historical prices
  const { prices: historicalPrices, loading: loadingHistoricalPrices } =
    usePriceHistory(period, state?.ticker);

  // currency setting
  const [currency] = useSetting<string>("currency");

  // balance in fiat
  const fiatBalance = useMemo(() => {
    if (!state) {
      return "0";
    }

    if (!price) {
      return `?? ${currency.toUpperCase()}`;
    }

    const bal = balanceToFractioned(
      String(state.balances?.[activeAddress] || "0"),
      {
        id,
        decimals: state.decimals,
        divisibility: state.divisibility
      }
    );

    return formatFiatBalance(bal.multipliedBy(price), currency);
  }, [id, state, activeAddress, price, currency]);

  const [priceWarningShown, setPriceWarningShown] = useStorage({
    key: "price_warning_shown",
    instance: ExtensionStorage
  });

  // display theme
  const theme = useTheme();

  // token logo
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLogo(viewblock.getTokenLogo(id));

      if (!state) return;
      const settings = getSettings(state);

      setLogo(await loadTokenLogo(id, settings.get("communityLogo"), theme));
    })();
  }, [id, state, theme]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("asset")} />
      <Spacer y={0.75} />
      <AnimatePresence>
        {state && (
          <motion.div
            variants={opacityAnimation}
            initial="hidden"
            animate="shown"
            exit="hidden"
          >
            <PriceChart
              token={{
                name: state.name || state.ticker || "",
                logo
              }}
              priceData={historicalPrices}
              latestPrice={+price}
              loading={loadingHistoricalPrices}
            >
              <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
            </PriceChart>
          </motion.div>
        )}
      </AnimatePresence>
      {!state && (
        <Section size="slim" style={{ paddingTop: 0, paddingBottom: "0.3rem" }}>
          <Skeleton height="160px" />
        </Section>
      )}
      <Spacer y={0.15} />
      <Section>
        <BalanceSection>
          <div>
            <BalanceLabel>
              {(state && browser.i18n.getMessage("your_balance")) || (
                <Skeleton width="3.4rem" />
              )}
            </BalanceLabel>
            <Spacer y={0.38} />
            <TokenBalance>
              {(state && (
                <>
                  {tokenBalance}
                  <span>{state.ticker || ""}</span>
                </>
              )) || <Skeleton width="5rem" addMargin />}
            </TokenBalance>
            <FiatBalance>
              {((loading || loadingPrice || !state) && (
                <Skeleton width="3.7rem" />
              )) ||
                fiatBalance}
            </FiatBalance>
          </div>
          <AnimatePresence>
            {state && (
              <motion.div
                variants={opacityAnimation}
                initial="hidden"
                animate="shown"
                exit="hidden"
              >
                <TokenActions>
                  <TokenAction
                    onClick={() => navigate(`/send/transfer/${id}`)}
                  />
                  <ActionSeparator />
                  <TokenAction
                    as={ArrowDownLeftIcon}
                    onClick={() => navigate("/receive")}
                  />
                </TokenActions>
              </motion.div>
            )}
          </AnimatePresence>
        </BalanceSection>
        <AnimatePresence>
          {state && price && !priceWarningShown && (
            <PriceWarning
              variants={opacityAnimation}
              initial="hidden"
              animate="shown"
              exit="hidden"
            >
              <PriceWarningContent>
                <WarningTriangleIcon />
                {browser.i18n.getMessage("token_price_estimate_warning")}{" "}
                <a
                  href="https://redstone.finance"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Redstone
                </a>
              </PriceWarningContent>
              <CloseIcon onClick={() => setPriceWarningShown(true)} />
            </PriceWarning>
          )}
        </AnimatePresence>
        <Spacer y={1.45} />
        <Title noMargin>{browser.i18n.getMessage("about_title")}</Title>
        <Spacer y={0.6} />
        <Description>
          {(state && (
            <>
              {(settings && settings.get("communityDescription")) ||
                state.description ||
                browser.i18n.getMessage("no_description")}
            </>
          )) ||
            new Array(5)
              .fill("")
              .map((_, i) => (
                <Skeleton
                  addMargin
                  height="1rem"
                  width={i === 4 ? "80%" : "100%"}
                  key={i}
                />
              ))}
        </Description>
        <Spacer y={1.45} />
        <Title noMargin>{browser.i18n.getMessage("info_title")}</Title>
        <Spacer y={0.6} />
        {chatLinks.map((link, i) => (
          <div key={i}>
            <Link href={link}>
              <MessageIcon />
              {getCommunityUrl(link)}
            </Link>
            <Spacer y={0.22} />
          </div>
        ))}
        {settings?.get("communityAppUrl") && (
          <>
            <Link href={settings.get("communityAppUrl") as string}>
              <ShareIcon />
              {getCommunityUrl(settings.get("communityAppUrl") as string)}
            </Link>
            <Spacer y={0.22} />
          </>
        )}
        {((!loading || chatLinks.length > 0 || !!settings) && (
          <>
            <Link href={`https://sonar.warp.cc/#/app/contract/${id}`}>
              <GlobeIcon />
              Sonar
            </Link>
            <Spacer y={0.22} />
            <Link href={`https://viewblock.io/arweave/address/${id}`}>
              <EyeIcon />
              Viewblock
            </Link>
          </>
        )) ||
          new Array(4)
            .fill("")
            .map((_, i) => (
              <Skeleton addMargin height="1rem" width="6.8rem" key={i} />
            ))}
        <Spacer y={1.45} />
        <Heading>
          <Title noMargin>{browser.i18n.getMessage("history")}</Title>
          <AnimatePresence>
            {loadingInteractions && (
              <LoadingWrapper
                variants={opacityAnimation}
                initial="hidden"
                animate="shown"
                exit="hidden"
              >
                <Loading />
              </LoadingWrapper>
            )}
          </AnimatePresence>
        </Heading>
        <Spacer y={0.6} />
        <InteractionsList>
          {loadingInteractions &&
            new Array(6)
              .fill("")
              .map((_, i) => <Skeleton height="42px" key={i} />)}
          <AnimatePresence>
            {!loadingInteractions &&
              interactions.map((interaction, i) => (
                <motion.div
                  variants={opacityAnimation}
                  initial="hidden"
                  animate="shown"
                  exit="hidden"
                  key={i}
                >
                  <Interaction
                    {...interaction}
                    onClick={() => {
                      if (gateway.host !== "arweave.net") {
                        navigate(
                          `/transaction/${interaction.id}/${encodeURIComponent(
                            concatGatewayURL(gateway)
                          )}`
                        );
                      } else {
                        navigate(`/transaction/${interaction.id}`);
                      }
                    }}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
          {interactions.length === 0 && !loadingInteractions && (
            <NoInteractions>
              {browser.i18n.getMessage("no_interaction_history")}
            </NoInteractions>
          )}
        </InteractionsList>
      </Section>
      <AnimatePresence>{loading && <TokenLoading />}</AnimatePresence>
    </>
  );
}

const opacityAnimation: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 }
};

const BalanceSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BalanceLabel = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.69rem;
`;

const TokenBalance = styled(Text).attrs({
  noMargin: true,
  heading: true
})`
  display: flex;
  gap: 0.3rem;
  align-items: baseline;
  font-size: 1.85rem;
  line-height: 1.1em;

  span {
    font-size: 0.57em;
    text-transform: uppercase;
  }
`;

const FiatBalance = styled(Text).attrs({
  noMargin: true
})`
  color: rgb(${(props) => props.theme.primaryText});
  font-weight: 600;
  font-size: 0.74rem;
`;

const TokenActions = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(${(props) => props.theme.theme}, 0.15);
  padding: 0.55rem 0.74rem;
  gap: 0.74rem;
  border-radius: 14px;
`;

const TokenAction = styled(ArrowUpRightIcon)`
  font-size: 1.45rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  color: rgb(${(props) => props.theme.theme});
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.9);
  }
`;

const ActionSeparator = styled.div`
  width: 1.5px;
  height: 1.25rem;
  background-color: rgba(${(props) => props.theme.theme}, 0.3);
  border-radius: 2px;
`;

const Description = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.9rem;
  text-align: justify;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferrer"
})`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: rgb(${(props) => props.theme.secondaryText});
  font-weight: 500;
  font-size: 0.9rem;
  text-decoration: none;
  width: max-content;
  transition: all 0.23s ease-in-out;

  svg {
    font-size: 1.2em;
    width: 1em;
    height: 1em;
  }

  &:hover {
    opacity: 0.8;
  }
`;

const InteractionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const NoInteractions = styled(Text).attrs({
  noMargin: true
})`
  text-align: center;
`;

const LoadingWrapper = styled(motion.div)`
  display: flex;
  color: rgb(${(props) => props.theme.theme});
  font-size: 1.075rem;
`;

const PriceWarning = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgb(255, 184, 0);
  background-color: rgba(255, 184, 0, 0.2);
  cursor: pointer;
  padding: 0.9rem 0.8rem;
  border-radius: 19px;
  margin-top: 1rem;

  &:active {
    transform: scale(0.97);
  }

  svg {
    font-size: 1rem;
    width: 1em;
    height: 1em;
  }
`;

const PriceWarningContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;

  a {
    color: rgb(255, 184, 0);
    text-decoration: underline;
  }
`;
