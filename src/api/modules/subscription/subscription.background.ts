import {
  isAddress,
  isPermission,
  isAppInfo,
  isSubscriptionType
} from "~utils/assertions";
import { getActiveAddress } from "~wallets";
import type { ModuleFunction } from "~api/background";
import authenticate from "../connect/auth";
import { getSubscriptionData } from "~subscriptions";
import {
  RecurringPaymentFrequency,
  type SubscriptionData
} from "~subscriptions/subscription";

const background: ModuleFunction<void> = async (
  appData,
  subscriptionData: SubscriptionData,
  type?: unknown
) => {
  // validate input
  isAddress(subscriptionData.arweaveAccountAddress);

  if (type) isSubscriptionType(type);
  const address = await getActiveAddress();
  // check if subsciption exists
  const subscriptions = await getSubscriptionData(address);

  // if (
  //   subscriptions.find(
  //     (subscription) =>
  //       subscription.arweaveAccountAddress ===
  //       subscriptionData.arweaveAccountAddress
  //   )
  // ) {
  //   throw new Error("Subscription already added");
  // }

  await authenticate({
    type: "subscription",
    url: appData.appURL,
    arweaveAccountAddress: subscriptionData.arweaveAccountAddress,
    applicationName: subscriptionData.applicationName,
    subscriptionName: subscriptionData.subscriptionName,
    subscriptionFeeAmount: subscriptionData.subscriptionFeeAmount,
    subsciptionStatus: subscriptionData.subscriptionStatus,
    recurringPaymentFrequency: subscriptionData.recurringPaymentFrequency,
    nextPaymentDue: subscriptionData.nextPaymentDue,
    subscriptionStartDate: subscriptionData.subscriptionStartDate,
    subscriptionEndDate: subscriptionData.subscriptionEndDate,
    applicationIcon: subscriptionData?.applicationIcon
  });
};

export default background;
