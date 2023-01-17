import Application, { AppInfo } from "~applications/application";
import { defaultGateway, gql } from "~applications/gateway";
import Graph, { GraphText } from "~components/popup/Graph";
import { useEffect, useMemo, useState } from "react";
import { useStorage } from "@plasmohq/storage/hook";
import { useHistory } from "~utils/hash_router";
import { Spacer } from "@arconnect/components";
import { getArPrice } from "~lib/coingecko";
import { getAppURL } from "~utils/format";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeIcon,
  SettingsIcon
} from "@iconicicons/react";
import useActiveTab from "~applications/useActiveTab";
import AppIcon, { NoAppIcon } from "./AppIcon";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";
import Arweave from "arweave";

export default function Balance() {
  // grab address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    area: "local",
    isSecret: true
  });

  // balance in AR
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      if (!activeAddress) return;

      const arweave = new Arweave(defaultGateway);

      // fetch balance
      const winstonBalance = await arweave.wallets.getBalance(activeAddress);

      setBalance(Number(arweave.ar.winstonToAr(winstonBalance)));
    })();
  }, [activeAddress]);

  // balance in local currency
  const [fiat, setFiat] = useState(0);
  const [currency] = useSetting<string>("currency");

  useEffect(() => {
    (async () => {
      if (!currency) return;

      // fetch price in currency
      const arPrice = await getArPrice(currency);

      // calculate fiat balance
      setFiat(arPrice * balance);
    })();
  }, [balance, currency]);

  // balance display
  const [hideBalance, setHideBalance] = useStorage<boolean>(
    {
      key: "hide_balance",
      area: "local",
      isSecret: true
    },
    false
  );

  // active app
  const activeTab = useActiveTab();
  const activeApp = useMemo<Application | undefined>(() => {
    if (!activeTab?.url) {
      return undefined;
    }

    return new Application(getAppURL(activeTab.url));
  }, [activeTab]);

  // active app data
  const [activeAppData, setActiveAppData] = useState<AppInfo>();

  useEffect(() => {
    (async () => {
      if (!activeApp) return;

      const connected = await activeApp.isConnected();
      if (!connected) return;

      setActiveAppData(await activeApp.getAppData());
    })();
  }, [activeApp]);

  // balance history
  const [historicalBalance, setHistoricalBalance] = useStorage<number[]>(
    {
      key: "historical_balance",
      area: "local",
      isSecret: true
    },
    []
  );

  useEffect(() => {
    if (!activeAddress) return;

    balanceHistory(activeAddress, defaultGateway)
      .then((res) => setHistoricalBalance(res))
      .catch();
  }, [activeAddress]);

  // router push
  const [push] = useHistory();

  return (
    <Graph
      actionBar={
        <>
          <Spacer x={0.18} />
          <ActionButton onClick={() => push("/send/transfer")} />
          <ActionButton
            as={ArrowDownLeftIcon}
            onClick={() => push("/receive")}
          />
          <ActionButton as={GlobeIcon} onClick={() => push("/explore")} />
          <ActionButton
            as={SettingsIcon}
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL("tabs/dashboard.html")
              })
            }
          />
          <Spacer x={0.18} />
        </>
      }
      data={historicalBalance}
    >
      <BalanceHead>
        <div>
          <BalanceText title noMargin>
            {(!hideBalance &&
              balance.toLocaleString(undefined, {
                maximumFractionDigits: 2
              })) ||
              "*".repeat(balance.toFixed(2).length)}
            <Ticker>AR</Ticker>
          </BalanceText>
          <FiatBalanceText noMargin>
            {(!hideBalance &&
              fiat.toLocaleString(undefined, {
                style: "currency",
                currency: currency.toLowerCase(),
                currencyDisplay: "narrowSymbol",
                maximumFractionDigits: 2
              })) ||
              "*".repeat(fiat.toFixed(2).length) + " " + currency.toUpperCase()}
            <HideBalanceButton
              onClick={() => setHideBalance((val) => !val)}
              as={hideBalance ? EyeOffIcon : EyeIcon}
            />
          </FiatBalanceText>
        </div>
        {activeAppData && (
          <ActiveAppIcon
            outline="#000"
            onClick={() =>
              browser.tabs.create({
                url: browser.runtime.getURL(
                  `tabs/dashboard.html#/apps/${activeApp.url}`
                )
              })
            }
            title={activeAppData.name || ""}
          >
            {(activeAppData.logo && (
              <img
                src={activeAppData.logo}
                alt={activeAppData.name || ""}
                draggable={false}
              />
            )) || <NoAppIcon />}
          </ActiveAppIcon>
        )}
      </BalanceHead>
    </Graph>
  );
}

async function balanceHistory(address: string, gateway = defaultGateway) {
  const arweave = new Arweave(gateway);

  // find txs coming in and going out
  const inTxs = (
    await gql(
      `
      query($recipient: String!) {
        transactions(recipients: [$recipient], first: 100) {
          edges {
            node {
              owner {
                address
              }
              fee {
                ar
              }
              quantity {
                ar
              }
              block {
                timestamp
              }
            }
          }
        }
      }
    `,
      { recipient: address }
    )
  ).data.transactions.edges;
  const outTxs = (
    await gql(
      `
      query($owner: String!) {
        transactions(owners: [$owner], first: 100) {
          edges {
            node {
              owner {
                address
              }
              fee {
                ar
              }
              quantity {
                ar
              }
              block {
                timestamp
              }
            }
          }
        }
      }    
    `,
      { owner: address }
    )
  ).data.transactions.edges;

  // sort txs
  const txs = inTxs
    .concat(outTxs)
    .map((edge) => edge.node)
    .filter((tx) => !!tx?.block?.timestamp)
    .sort((a, b) => a.block.timestamp - b.block.timestamp);

  // get initial balance
  let balance = parseFloat(
    arweave.ar.winstonToAr(await arweave.wallets.getBalance(address))
  );

  const res = [balance];

  // go back in time by tx and calculate
  // historical balance
  for (const tx of txs) {
    balance -= parseFloat(tx.fee.ar);

    if (tx.owner.address === address) {
      balance -= parseFloat(tx.quantity.ar);
    } else {
      balance += parseFloat(tx.quantity.ar);
    }

    res.push(balance);
  }

  return res;
}

const BalanceHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BalanceText = styled(GraphText)`
  font-size: 2.3rem;
  font-weight: 600;
`;

const Ticker = styled.span`
  margin-left: 0.33rem;
`;

const FiatBalanceText = styled(GraphText)`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 400;
`;

const HideBalanceButton = styled(EyeIcon)`
  font-size: 1em;
  width: 1em;
  height: 1em;
  color: #fff;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.86);
  }
`;

const ActionButton = styled(ArrowUpRightIcon)`
  color: #fff;
  font-size: 1.9rem;
  width: 1em;
  height: 1em;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.8;
  }

  &:active {
    transform: scale(0.87);
  }
`;

const ActiveAppIcon = styled(AppIcon)`
  transition: all 0.07s ease-in-out;

  &:active {
    transform: scale(0.93);
  }
`;
