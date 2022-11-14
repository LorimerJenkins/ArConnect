import { Card } from "@arconnect/components";
import styled from "styled-components";

export const Wrapper = styled.div`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
`;

export const GenerateCard = styled(Card)`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 350px;
  transform: translate(-50%, -50%);
`;

export const Paginator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
`;

export const Page = styled.div<{ active?: boolean }>`
  width: 2.5rem;
  height: 2px;
  background-color: rgba(
    ${(props) => props.theme.theme + ", " + (props.active ? "1" : ".45")}
  );
  transition: all 0.23s ease-in-out;
`;