import { JWKInterface } from "arweave/node/lib/wallet";
import { getStoreData } from "../../utils/background";
import { MessageFormat } from "../../utils/messenger";
import * as ledger from "../../utils/ledger";

/**
 * APIs for getting the user's address / addresses
 */

// get the currently selected (active)
// address from ArConnect
export const activeAddress = () =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    try {
      const address = (await getStoreData())["profile"];

      resolve({
        res: true,
        address
      });
    } catch {
      resolve({
        res: false,
        message: "Error getting current address from extension storage"
      });
    }
  });

// get the public key of the currently selected (active) address from ArConnect
export const publicKey = () =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    try {
      const address = (await getStoreData())["profile"];
      const wallets = (await getStoreData())?.["wallets"];

      if (wallets) {
        const wallet = wallets.find((wallet) => wallet.address === address);

        if (wallet?.type === "local") {
          const keyfile: JWKInterface = JSON.parse(atob(wallet.keyfile!));
          resolve({
            res: true,
            publicKey: keyfile.n
          });
        } else if (wallet?.type === "ledger") {
          resolve({
            res: true,
            publicKey: await ledger.getWalletOwner()
          });
        } else {
          resolve({
            res: false,
            message: "No wallets added"
          });
        }
      } else {
        resolve({
          res: false,
          message: "No wallets storage found"
        });
      }
    } catch {
      resolve({
        res: false,
        message: "Error getting public key of the current address"
      });
    }
  });

// get all addresses added to the
// extension
export const allAddresses = () =>
  new Promise<Partial<MessageFormat>>(async (resolve, _) => {
    try {
      const wallets = (await getStoreData())?.["wallets"];

      if (wallets)
        resolve({
          res: true,
          addresses: wallets.map((wallet) => wallet.address)
        });
      else
        resolve({
          res: false,
          message: "No wallets storage found"
        });
    } catch {
      resolve({
        res: false,
        message: "Error getting data from wallets storage"
      });
    }
  });
