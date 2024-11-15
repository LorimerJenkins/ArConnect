import { decryptWallet, freeDecryptedWallet } from "./encryption";
import browser from "webextension-polyfill";
import { getWallets, type LocalWallet } from "./index";
import { ExtensionStorage } from "~utils/storage";
import { createAuthPopup, onPopupClosed } from "~utils/auth/auth.utils";
import type { ModuleAppData } from "~api/background/background-modules";
import { ERR_MSG_USER_CANCELLED_AUTH } from "~utils/assertions";
import type { StorageChange } from "~utils/runtime";

/**
 * Unlock wallets and save decryption key
 *
 * **Warning**: SHOULD ONLY BE CALLED FROM THE AUTH/POPUP VIEW / VIEWS
 *
 * @param password Password for unlocking
 */
export async function unlock(password: string) {
  // validate password
  if (!(await checkPassword(password))) {
    return false;
  }

  // save decryption key
  await setDecryptionKey(password);

  // schedule the key for removal
  await scheduleKeyRemoval();

  return true;
}

/**
 * Check password against decryption key
 * or try to decrypt with it.
 *
 * @param password Password to check
 */
export async function checkPassword(password: string) {
  let decryptionKey = await getDecryptionKey();

  if (!!decryptionKey) {
    return decryptionKey === password;
  }

  // try decrypting
  const wallets = await getWallets();
  const localWallets = wallets.filter(
    (w) => w.type === "local"
  ) as LocalWallet[];

  // if there are no wallets, this is a new password
  if (localWallets.length === 0) {
    return true;
  }

  try {
    // try decrypting the wallet
    const wallet = await decryptWallet(localWallets[0].keyfile, password);

    // remove wallet from memory
    freeDecryptedWallet(wallet);

    return true;
  } catch {
    return false;
  }
}

type UnlockCallback = (decryptionKey: string) => void;

function onUnlock(cb: UnlockCallback) {
  const watchFn = ({ newValue }: StorageChange<string>) => {
    const decryptionKey = newValue ? atob(newValue) : undefined;

    cb(decryptionKey);
  };

  ExtensionStorage.watch({
    decryption_key: watchFn
  });

  return () => {
    ExtensionStorage.unwatch({
      decryption_key: watchFn
    });
  };
}

/**
 * Returns the `decryptionKey` if the wallet is unlocked. Otherwise, it opens an auth popup and waits for the user to
 * enter their password to unlock the wallet.
 */
export async function getDecryptionKeyOrRequestUnlock(appData: ModuleAppData) {
  return new Promise<string>(async (resolve, reject) => {
    const decryptionKey = await getDecryptionKey();

    if (decryptionKey) {
      resolve(decryptionKey);

      return;
    }

    console.log(`[WALLET AUTH] Requesting unlock...`);

    let removePopupClosedListener = () => {};
    let removeUnlockListener = () => {};

    removePopupClosedListener = onPopupClosed(() => {
      console.log(`[WALLET AUTH] Popup closed. Rejecting...`);

      removeUnlockListener();

      reject(new Error(ERR_MSG_USER_CANCELLED_AUTH));
    });

    removeUnlockListener = onUnlock((decryptionKey) => {
      console.log(
        `[WALLET AUTH] ${decryptionKey ? "Unlocked." : "No key. Rejecting..."}`
      );

      removePopupClosedListener();

      if (decryptionKey) {
        resolve(decryptionKey);
      } else {
        reject(new Error("The key could not be read"));
      }
    });

    // Open the auth popup to prompt the user to unlock the wallet but do not wait for the response (thus, we use
    // `createAuthPopup` rather than `requestUserAuthorization`), as `UnlockRequest`s are not enqueued:

    createAuthPopup(null, appData).catch((err) => {
      console.log(`Unlock popup could not be opened:`, err);

      reject(err);
    });
  });
}

/**
 * Get wallet decryption key
 */
export async function getDecryptionKey() {
  const val = await ExtensionStorage.get("decryption_key");

  // check if defined
  if (!val) {
    return undefined;
  }

  return atob(val);
}

/**
 * Set wallet decryption key
 *
 * @param val Decryption key to set
 */
export async function setDecryptionKey(val: string) {
  const decryptionKey = btoa(val);

  return await ExtensionStorage.set("decryption_key", decryptionKey);
}

/**
 * Remove decryption key
 */
export async function removeDecryptionKey() {
  return await ExtensionStorage.remove("decryption_key");
}

/**
 * Schedule removing the decryption key.
 * Removal occurs after one day.
 */
async function scheduleKeyRemoval() {
  // schedule removal of the key for security reasons
  browser.alarms.create("remove_decryption_key_scheduled", {
    periodInMinutes: 60 * 24
  });
}
