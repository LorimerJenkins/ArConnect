import type { AppInfo } from "~applications/application";
import type { PermissionType } from "~applications/permissions";
import type { Gateway } from "~gateways/gateway";
import type { SubscriptionData } from "~subscriptions/subscription";
import type { TokenType } from "~tokens/token";
import type { SplitTransaction } from "~api/modules/sign/transaction_builder";
import type { RawDataItem } from "~api/modules/sign_data_item/types";
import type { Transaction } from "arbundles";

// COMMON:

export type AuthRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "aborted"
  | "error";

interface CommonAuthRequestProps {
  url: string;
  tabID: number;
  authID: string;
  requestedAt: number;
  completedAt?: number;
  status: AuthRequestStatus;
}

// RESULTS:

export interface AuthSuccessResult<T = any> {
  type: string;
  authID: string;
  data?: T;
}

export interface AuthErrorResult {
  type: string;
  authID: string;
  error: string;
}

export type AuthResult<T> = AuthSuccessResult<T> | AuthErrorResult;

export function isAuthErrorResult(data: any): data is AuthErrorResult {
  return (
    !!data.type &&
    !!data.authID &&
    !!data.error &&
    typeof data.type === "string" &&
    typeof data.authID === "string" &&
    typeof data.error === "string"
  );
}

// AuthRequestData:

// CONNECT:

export interface ConnectAuthRequestData {
  type: "connect";
  permissions: PermissionType[];
  appInfo: AppInfo;
  gateway?: Gateway;
}

// ALLOWANCE:

export interface AllowanceAuthRequestData {
  type: "allowance";
  spendingLimitReached: boolean;
}

// TOKEN AUTH:

export interface TokenAuthRequestData {
  type: "token";
  tokenID: string;
  tokenType?: TokenType;
  dre?: string;
}

// SIGN:

export interface SignAuthRequestData {
  type: "sign";
  address: string;
  transaction: SplitTransaction;
  collectionID: string;
}

// SUBSCRIPTION:

export interface SubscriptionAuthRequestData extends SubscriptionData {
  type: "subscription";
}

// SIGN KEYSTONE:

export interface SignKeystoneAuthRequestData {
  type: "signKeystone";
  collectionID: string;
  keystoneSignType: string;
}

// SIGNATURE:

export interface SignatureAuthRequestData {
  type: "signature";
  message: number[];
}

// SIGN DATA ITEM:

export interface SignDataItemAuthRequestData {
  type: "signDataItem";
  data: RawDataItem;
}

// BATCH SIGN DATA ITEM:

export interface BatchSignDataItemAuthRequestData {
  type: "batchSignDataItem";
  data: RawDataItem;
}

// AuthRequestMessageData:

export type ConnectAuthRequestMessageData = ConnectAuthRequestData &
  CommonAuthRequestProps;
export type AllowanceAuthRequestMessageData = AllowanceAuthRequestData &
  CommonAuthRequestProps;
export type TokenAuthRequestMessageData = TokenAuthRequestData &
  CommonAuthRequestProps;
export type SignAuthRequestMessageData = SignAuthRequestData &
  CommonAuthRequestProps;
export type SubscriptionAuthRequestMessageData = SubscriptionAuthRequestData &
  CommonAuthRequestProps;
export type SignKeystoneAuthRequestMessageData = SignKeystoneAuthRequestData &
  CommonAuthRequestProps;
export type SignatureAuthRequestMessageData = SignatureAuthRequestData &
  CommonAuthRequestProps;
export type SignDataItemAuthRequestMessageData = SignDataItemAuthRequestData &
  CommonAuthRequestProps;
export type BatchSignDataItemAuthRequestMessageData =
  BatchSignDataItemAuthRequestData & CommonAuthRequestProps;

// AuthRequest:

export type ConnectAuthRequest = ConnectAuthRequestMessageData;
export type AllowanceAuthRequest = AllowanceAuthRequestMessageData;
export type TokenAuthRequest = TokenAuthRequestMessageData;

export interface SignAuthRequest
  extends Omit<SignAuthRequestMessageData, "transaction"> {
  transaction: SplitTransaction | Transaction;
}

export type SubscriptionAuthRequest = SubscriptionAuthRequestMessageData;

export interface SignKeystoneAuthRequest
  extends SignKeystoneAuthRequestMessageData {
  data?: Buffer;
}

export type SignatureAuthRequest = SignatureAuthRequestMessageData;
export type SignDataItemAuthRequest = SignDataItemAuthRequestMessageData;
export type BatchSignDataItemAuthRequest =
  BatchSignDataItemAuthRequestMessageData;

// Unions & Misc:

export type AuthType = AuthRequestData["type"];

export type AuthRequestData =
  | ConnectAuthRequestData
  | AllowanceAuthRequestData
  | TokenAuthRequestData
  | SignAuthRequestData
  | SubscriptionAuthRequestData
  | SignKeystoneAuthRequestData
  | SignatureAuthRequestData
  | SignDataItemAuthRequestData
  | BatchSignDataItemAuthRequestData;

export type AuthRequestMessageData =
  | ConnectAuthRequestMessageData
  | AllowanceAuthRequestMessageData
  | TokenAuthRequestMessageData
  | SignAuthRequestMessageData
  | SubscriptionAuthRequestMessageData
  | SignKeystoneAuthRequestMessageData
  | SignatureAuthRequestMessageData
  | SignDataItemAuthRequestMessageData
  | BatchSignDataItemAuthRequestMessageData;

export type AuthRequest =
  | ConnectAuthRequest
  | AllowanceAuthRequest
  | TokenAuthRequest
  | SignAuthRequest
  | SubscriptionAuthRequest
  | SignKeystoneAuthRequest
  | SignatureAuthRequest
  | SignDataItemAuthRequest
  | BatchSignDataItemAuthRequest;

export type AuthRequestByType = {
  connect: ConnectAuthRequest;
  allowance: AllowanceAuthRequest;
  token: TokenAuthRequest;
  sign: SignAuthRequest;
  subscription: SubscriptionAuthRequest;
  signKeystone: SignKeystoneAuthRequest;
  signature: SignatureAuthRequest;
  signDataItem: SignDataItemAuthRequest;
  batchSignDataItem: BatchSignDataItemAuthRequest;
};
