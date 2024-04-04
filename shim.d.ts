import type { ProtocolWithReturn } from "@arconnect/webext-bridge";
import type { DisplayTheme } from "@arconnect/components";
import type { Chunk } from "~api/modules/sign/chunks";
import type { InjectedEvents } from "~utils/events";
import "styled-components";

declare module "@arconnect/webext-bridge" {
  export interface ProtocolMap {
    api_call: ProtocolWithReturn<ApiCall, ApiResponse>;
    auth_result: AuthResult;
    switch_wallet_event: string | null;
    copy_address: string;
    chunk: ProtocolWithReturn<ApiCall<Chunk>, ApiResponse<number>>;
    event: Event;
    auth_listening: number;
    auth_chunk: Chunk;
    ar_protocol: ProtocolWithReturn<{ url: string }, { url: sting }>;
  }
}

interface ApiCall<DataType = any> extends JsonValue {
  type: string;
  data?: DataType;
  callID: number | string;
}

interface ApiResponse<DataType = any> extends ApiCall<DataType> {
  error?: boolean;
}

interface AuthResult<DataType = any> {
  type: string;
  authID: string;
  error?: boolean;
  data?: DataType;
}

interface Event {
  name: keyof InjectedEvents;
  value: unknown;
}

declare module "styled-components" {
  export interface DefaultTheme {
    displayTheme: DisplayTheme;
    theme: string;
    primaryText: string;
    secondaryText: string;
    background: string;
    cardBorder: string;
    cardBackground: string;
    // New styles:
    backgroundv2: string;
    primary: string;
    primaryBtnHover: string;
    secondaryBtnHover: string;
    secondaryItemHover: string;
    buttonDisabled: string;
    primaryTextv2: string;
    secondaryTextv2: string;
    buttonDisabledText: string;
    inputField: string;
    success: string;
    fail: string;
    backgroundSecondary: string;
    delete: string;
    secondaryDelete: string;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    BETA_VERSION?: string;
  }
}
