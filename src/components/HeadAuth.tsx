import type React from "react";
import { useState } from "react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useAuthRequests } from "~utils/auth/auth.hooks";
import type { AuthRequestStatus } from "~utils/auth/auth.types";

export interface HeadAuthProps {
  title?: string;
  back?: () => void;
}

export const HeadAuth: React.FC<HeadAuthProps> = ({ title, back }) => {
  const [areLogsExpanded, setAreLogsExpanded] = useState(false);
  const { authRequests, currentAuthRequestIndex, setCurrentAuthRequestIndex } =
    useAuthRequests();

  const url = authRequests[currentAuthRequestIndex]?.url || "";

  return (
    <>
      <HeadV2
        title={title}
        showOptions={false}
        // allowOpen={false}
        showBack={!!back}
        back={back}
        url={url}
      />

      <DivTransactionTracker>
        <DivTransactionsList>
          {process.env.NODE_ENV === "development" ? (
            <ButtonExpandLogs
              onClick={() =>
                setAreLogsExpanded(
                  (prevAreLogsExpanded) => !prevAreLogsExpanded
                )
              }
            />
          ) : null}

          {authRequests.map((authRequest, i) => (
            <ButtonTransactionButton
              key={authRequest.authID}
              isCurrent={i === currentAuthRequestIndex}
              status={authRequest.status}
              onClick={() => setCurrentAuthRequestIndex(i)}
            />
          ))}

          <DivTransactionButtonSpacer />
        </DivTransactionsList>

        {process.env.NODE_ENV === "development" && areLogsExpanded ? (
          <DivLogWrapper>
            {authRequests.map((authRequest, i) => {
              if (authRequest.type === "sign") {
                // TODO: Consider removing `authRequest.transaction.data` if large
              } else if (authRequest.type === "signKeystone") {
                // TODO: Consider removing `authRequest.data` if large.
              }

              return (
                <PreLogItem
                  key={authRequest.authID}
                  isCurrent={i === currentAuthRequestIndex}
                  status={authRequest.status}
                >
                  {JSON.stringify(authRequest, null, "  ")}
                </PreLogItem>
              );
            })}
          </DivLogWrapper>
        ) : null}
      </DivTransactionTracker>
    </>
  );
};

const DivTransactionTracker = styled.div`
  position: relative;
`;

const DivTransactionsList = styled.div`
  position: relative;
  display: flex;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid rgb(31, 30, 47);
`;

interface AuthRequestIndicatorProps {
  isCurrent: boolean;
  status: AuthRequestStatus;
}

const colorsByStatus: Record<AuthRequestStatus, string> = {
  pending: "white",
  accepted: "green",
  rejected: "red",
  aborted: "grey"
};

function getAuthRequestButtonIndicatorBorderColor({
  status
}: AuthRequestIndicatorProps) {
  return colorsByStatus[status];
}

function getAuthRequestButtonIndicatorBackgroundColor({
  isCurrent,
  status
}: AuthRequestIndicatorProps) {
  return isCurrent ? colorsByStatus[status] : "transparent";
}

const ButtonTransactionButton = styled.button<AuthRequestIndicatorProps>`
  border: 2px solid ${getAuthRequestButtonIndicatorBorderColor};
  background: ${getAuthRequestButtonIndicatorBackgroundColor};
  border-radius: 128px;
  min-width: 20px;
  height: 12px;
  cursor: pointer;
`;

const DivTransactionButtonSpacer = styled.button`
  background: rgba(255, 255, 255, 0.125);
  border-radius: 128px;
  flex: 1 0 auto;
`;

const ButtonExpandLogs = styled.button`
  border: 2px solid white;
  border-radius: 128px;
  width: 12px;
`;

const DivLogWrapper = styled.div`
  position: absolute;
  background: black;
  top: 100%;
  left: 0;
  right: 0;
  height: 50vh;
  overflow: scroll;
  z-index: 1;
  border-bottom: 1px solid rgb(31, 30, 47);
`;

function getAuthRequestLogIndicatorStyles(props: AuthRequestIndicatorProps) {
  let styles = "";

  styles += `background: ${getAuthRequestButtonIndicatorBorderColor(props)};`;

  if (!props.isCurrent) styles += "opacity: 0.25;";

  return styles;
}

const PreLogItem = styled.pre<AuthRequestIndicatorProps>`
  position: relative;
  padding: 16px 16px 16px 32px;

  &::before {
    content: "";
    position: absolute;
    top: 6px;
    bottom: 6px;
    left: 16px;
    width: 4px;
    border-radius: 128px;
    transform: translate(-50%, 0);
    ${getAuthRequestLogIndicatorStyles};
  }

  & + & {
    border-top: 1px solid rgb(31, 30, 47);
  }
`;
