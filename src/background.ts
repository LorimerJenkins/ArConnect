import { addressChangeListener, walletsChangeListener } from "~wallets/event";
import { handleApiCalls, handleChunkCalls } from "~api";
import { handleTabUpdate } from "~applications/tab";
import { appsChangeListener } from "~applications";
import { getStorageConfig } from "~utils/storage";
import { Storage } from "@plasmohq/storage";
import { getWallets } from "~wallets";
import { onMessage } from "@arconnect/webext-bridge";
import handleFeeAlarm from "~api/modules/sign/fee";
import browser from "webextension-polyfill";

// open welcome page on extension install
browser.runtime.onInstalled.addListener(async () => {
  // get stored wallets
  const storedWallets = await getWallets();

  // open welcome page
  if (storedWallets.length !== 0) return;
  await browser.tabs.create({
    url: browser.runtime.getURL("tabs/welcome.html")
  });
});

// TODO: save decryption key here if the extension is
// running in firefox. firefox still uses manifest v2,
// so it should allow us, to store the decryption key
// in the background scipt and have it destroyed once
// the browser is closed

// watch for API calls
onMessage("api_call", handleApiCalls);

// watch for chunks
onMessage("chunk", handleChunkCalls);

// handle tab change (icon, context menus)
browser.tabs.onUpdated.addListener((tabId) => handleTabUpdate(tabId));
browser.tabs.onActivated.addListener(({ tabId }) => handleTabUpdate(tabId));

// handle fee alarm (send fees asyncronously)
browser.alarms.onAlarm.addListener(handleFeeAlarm);

// create storage client
const storage = new Storage(getStorageConfig());

// watch for active address changes / app
// list changes
// and send them to the content script to
// fire the wallet switch event
storage.watch({
  active_address: addressChangeListener,
  apps: appsChangeListener,
  wallets: walletsChangeListener
});

export {};
