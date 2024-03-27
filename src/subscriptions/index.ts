import {
  RecurringPaymentFrequency,
  type SubscriptionData,
  type SubscriptionStatus
} from "./subscription";
import { ExtensionStorage } from "~utils/storage";

// get subscription data from storage
export async function getSubscriptionData(
  activeAddress: string
): Promise<SubscriptionData[]> {
  try {
    const subscriptionData = await ExtensionStorage.get<SubscriptionData[]>(
      `subscriptions_${activeAddress}`
    );
    return subscriptionData || [];
  } catch (err) {
    console.log("Error getting subscription data:", err);
    return [];
  }
}

export async function deleteSubscription(
  activeAddress: string,
  deleteId: string
) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === deleteId
    );

    if (subscriptionIndex !== -1) {
      subscriptions.splice(subscriptionIndex, 1);

      await ExtensionStorage.set(
        `subscriptions_${activeAddress}`,
        subscriptions
      );
    } else {
      console.log("No subscription found with the given ID");
    }
  } catch (err) {
    console.log("Error deleting subscription:", err);
  }
}

export function calculateNextPaymentDate(
  currentNextPaymentDue: Date | string,
  recurringPaymentFrequency: RecurringPaymentFrequency
) {
  const currentDate =
    typeof currentNextPaymentDue === "string"
      ? new Date(currentNextPaymentDue)
      : currentNextPaymentDue;

  switch (recurringPaymentFrequency) {
    case RecurringPaymentFrequency.ANNUALLY:
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      break;
    case RecurringPaymentFrequency.QUARTERLY:
      currentDate.setMonth(currentDate.getMonth() + 3);
      break;
    case RecurringPaymentFrequency.MONTHLY:
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
    case RecurringPaymentFrequency.WEEKLY:
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    default:
      console.error("Invalid recurring payment frequency");
  }

  return currentDate;
}

export async function updateSubscription(
  activeAddress: string,
  updateId: string,
  newStatus: SubscriptionStatus,
  nextPaymentDue?: Date | string
) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === updateId
    );
    if (subscriptionIndex !== -1) {
      const recurringPaymentFrequency =
        subscriptions[subscriptionIndex].recurringPaymentFrequency;
      if (nextPaymentDue !== undefined) {
        // update nextPaymentDue
        subscriptions[subscriptionIndex].nextPaymentDue =
          calculateNextPaymentDate(nextPaymentDue, recurringPaymentFrequency);
      }
      // update status
      subscriptions[subscriptionIndex].subscriptionStatus = newStatus;

      await ExtensionStorage.set(
        `subscriptions_${activeAddress}`,
        subscriptions
      );
    } else {
      console.log("No subscription found with the given ID");
    }
  } catch (err) {
    console.log("err", err);
  }
}

export async function addSubscription(
  activeAddress: string,
  newSubscription: SubscriptionData
) {
  // get existing subs
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    if (subscriptions) {
      subscriptions.push(newSubscription);
      await ExtensionStorage.set(
        `subscriptions_${activeAddress}`,
        subscriptions
      );
    } else {
      await ExtensionStorage.set(`subscriptions_${activeAddress}`, [
        newSubscription
      ]);
    }
  } catch (err) {
    console.error("error saving subscription");
  }
}

// get subscription auto withdrawal allowance
export async function getAutoAllowance(): Promise<number> {
  const subscriptionAllowance = await ExtensionStorage.get<number>(
    "setting_subscription_allowance"
  );
  return subscriptionAllowance;
}
