import {
  formatTokenBalance,
  type DivisibilityOrDecimals,
  balanceToFractioned
} from "./currency";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import type { DisplayTheme } from "@arconnect/components";
import * as viewblock from "~lib/viewblock";
import { concatGatewayURL } from "~gateways/utils";
import { gql } from "~gateways/api";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { findGateway } from "~gateways/wayfinder";
import { type Gateway } from "~gateways/gateway";
import { ExtensionStorage } from "~utils/storage";
import { defaultTokens } from "~tokens";
import { defaultAoTokens, type TokenInfo } from "./aoTokens/ao";

export interface Token {
  id: string;
  name?: string;
  ticker: string;
  type: TokenType;
  gateway?: Gateway;
  dre?: string;
  balance: string | null;
  divisibility?: number;
  decimals?: number;
  defaultLogo?: string;
}

export interface TokenState {
  name?: string;
  ticker: string;
  balances: Record<string, number>;
  [key: string]: any;
}

export type TokenType = "asset" | "collectible";

/**
 * Get the initial state of a contract
 *
 * @param id Contract ID
 * @param gateway Gateway to fetch from
 */
export async function getInitialState(
  id: string,
  gateway: Gateway
): Promise<Record<any, any>> {
  const { data } = await gql(
    `query ($id: ID!) {
      transaction (id: $id) {
        tags {
          name
          value
        }
      }
    }`,
    { id },
    gateway
  );

  // init state tag
  const initState = data.transaction.tags.find(
    ({ name }) => name === "Init-State"
  )?.value;

  if (initState) {
    return JSON.parse(initState);
  }

  // init state tx tag
  const initStateTx = data.transaction.tags.find(
    ({ name }) => name === "Init-State-TX"
  )?.value;

  if (initStateTx) {
    const initState = await (
      await fetch(`${concatGatewayURL(gateway)}/${initStateTx}`)
    ).json();

    return initState;
  }

  // otherwise get the data of the contract tx
  const contractData = await (
    await fetch(`${concatGatewayURL(gateway)}/${id}`)
  ).json();

  return contractData;
}

/**
 * Get incoming and outgoing interactions (including transfers)
 * for an address using the specified contract
 *
 * @param contractId ID of the contract to get the interactions for
 * @param address User address to get the interactions for
 * @param gateway Optional gateway to fetch the interactions from
 * @param limit Limit of the interactions returned
 */
export async function getInteractionsTxsForAddress(
  contractId: string,
  address: string,
  gateway?: Gateway,
  limit = 6
) {
  if (!gateway) {
    gateway = await findGateway({ graphql: true });
  }

  // fetch outgoing interactions
  const { data: out } = await gql(
    `
      query($contractId: String!, $address: String!) {
        transactions(
          owners: [$address]
          tags: [
            { name: "App-Name", values: "SmartWeaveAction" }
            { name: "App-Version", values: "0.3.0" }
            { name: "Contract", values: [$contractId] }
          ]
        ) {
          edges {
            node {
              id
              recipient
              owner {
                address
              }
              quantity {
                ar
              }
              tags {
                name
                value
              }
              block {
                timestamp
              }
            }
          }
        }
      }
    `,
    { contractId, address },
    gateway
  );

  // fetch outgoing interactions
  const { data: incoming } = await gql(
    `
      query($contractId: String!, $address: String!) {
        transactions(
          recipients: [$address]
          tags: [
            { name: "App-Name", values: "SmartWeaveAction" }
            { name: "App-Version", values: "0.3.0" }
            { name: "Contract", values: [$contractId] }
          ]
        ) {
          edges {
            node {
              id
              recipient
              owner {
                address
              }
              quantity {
                ar
              }
              tags {
                name
                value
              }
              block {
                timestamp
              }
            }
          }
        }
      }
    `,
    { contractId, address },
    gateway
  );

  // sort interactions
  const interactions = out.transactions.edges
    .concat(incoming.transactions.edges)
    .filter((tx) => !!tx?.node.block?.timestamp)
    .sort((a, b) => b.node.block.timestamp - a.node.block.timestamp)
    .slice(0, limit);

  return interactions;
}

/**
 * Parse interactions from interaction txs
 *
 * @param interactions Interaction txs to parse
 * @param activeAddress Active wallet address
 * @param ticker Ticker of the token contract
 */
export function parseInteractions(
  interactions: GQLEdgeInterface[],
  activeAddress: string,
  ticker?: string,
  fractionsCfg?: DivisibilityOrDecimals
): TokenInteraction[] {
  return interactions.map((tx) => {
    // interaction input
    const input = JSON.parse(
      tx.node.tags.find((tag) => tag.name === "Input")?.value
    );
    const recipient = tx.node.recipient || input.target;

    // interaction data
    let type: TokenInteractionType = "interaction";
    let qty = tx.node.quantity.ar;
    let otherAddress: string;

    if (input.function === "transfer") {
      type = (recipient === activeAddress && "in") || "out";
      qty = balanceToFractioned(input.qty, fractionsCfg).toFixed();
      otherAddress =
        (recipient === activeAddress && tx.node.owner.address) || recipient;
    }

    // parsed interaction data
    return {
      id: tx.node.id,
      type,
      qty:
        formatTokenBalance(qty) +
        " " +
        (type === "interaction" ? "AR" : ticker || ""),
      function: input.function,
      otherAddress
    };
  });
}

type TokenInteractionType = "interaction" | "in" | "out";

export interface TokenInteraction {
  id: string;
  type: TokenInteractionType;
  // qty + ticker
  qty: string;
  // recipient for outgoing txs
  // sender for incoming txs
  otherAddress?: string;
  // interaction function
  function: string;
}

/**
 * Load token logo from Viewblock. If no logo
 * is returned, return the original logo from
 * the contract.
 *
 * @param id Contract ID of the token
 * @param defaultLogo Default logo tx ID in the contract state
 * @param theme UI theme to match the logo with
 */
export async function loadTokenLogo(
  id: string,
  defaultLogo?: string,
  theme?: DisplayTheme
) {
  const viewblockURL = viewblock.getTokenLogo(id, theme);

  try {
    const res = await fetch(viewblockURL);

    // not the token logo we expected
    if (res.status === 202 || res.status >= 400) {
      throw new Error();
    }

    // let's return an object URL so we
    // don't need to load the logo again
    const blob = await res.blob();

    // let's turn the
    return URL.createObjectURL(blob);
  } catch {
    // find gateway with wayfinder
    const gateway = await findGateway({ startBlock: 0 });

    // get token logo from settings
    if (defaultLogo) {
      return `${concatGatewayURL(gateway)}/${defaultLogo}`;
    }

    try {
      // try to see if the token logo is the data
      // of the token contract creation transaction
      const res = await fetch(`${concatGatewayURL(gateway)}/${id}`);
      const contentType = res.headers.get("content-type");

      if (!contentType.includes("image")) {
        throw new Error();
      }

      return URL.createObjectURL(await res.blob());
    } catch {
      // if there are no logos in settings, return the AR logo
      return theme === "dark" ? arLogoLight : arLogoDark;
    }
  }
}

/**
 * Parse settings from token state
 */
export function getSettings(state: TokenState) {
  let rawSettings = state?.settings || [];

  // transform object setting structure
  if (!Array.isArray(rawSettings)) {
    rawSettings = Object.entries(rawSettings);
  }

  return new Map<string, any>(rawSettings);
}

/**
 * Overrides for well-known tokens' types
 */
export const tokenTypeRegistry: Record<string, TokenType> = {
  "tfalT8Z-88riNtoXdF5ldaBtmsfcSmbMqWLh2DHJIbg": "asset"
};

export async function loadTokens() {
  const tokens: Token[] | undefined = await ExtensionStorage.get("tokens");
  const aoTokens: TokenInfo[] | undefined = await ExtensionStorage.get(
    "ao_tokens"
  );
  const aoSupport: boolean | undefined = await ExtensionStorage.get(
    "setting_ao_support"
  );

  // TODO: should this only be if it's undefined?
  if (!tokens || tokens.length === 0) {
    await ExtensionStorage.set("tokens", defaultTokens);
  }

  // TODO: should this only be if it's undefined?
  if (!aoTokens || aoTokens.length === 0) {
    await ExtensionStorage.set("ao_tokens", defaultAoTokens);
  }

  if (!aoSupport) {
    await ExtensionStorage.set("setting_ao_support", true);
  }
}
