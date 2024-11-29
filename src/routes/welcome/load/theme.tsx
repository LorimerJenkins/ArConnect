import { ButtonV2, Spacer, Text } from "@arconnect/components";
import { useRoute } from "wouter";
import {
  ArrowRightIcon,
  DashboardIcon,
  MoonIcon,
  SunIcon
} from "@iconicicons/react";
import browser from "webextension-polyfill";
import useSetting from "~settings/hook";
import styled from "styled-components";
import { useEffect } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { useLocation } from "~wallets/router/router.utils";

// TODO: Convert to View
export default function Theme() {
  const { navigate } = useLocation();
  // TODO: Replace with useParams:
  const [, params] = useRoute<{ setup: string; page: string }>("/:setup/:page");

  // theme
  const [theme, setTheme] = useSetting("display_theme");

  // Segment
  // TODO: specify if this is an imported or new wallet
  useEffect(() => {
    trackPage(PageType.ONBOARD_THEME);
  }, []);

  return (
    <>
      <Text heading>{browser.i18n.getMessage("choose_theme")}</Text>
      <ThemeOption active={theme === "light"} onClick={() => setTheme("light")}>
        <SunIcon />
        {browser.i18n.getMessage("light_theme")}
      </ThemeOption>
      <Spacer y={0.5} />
      <ThemeOption active={theme === "dark"} onClick={() => setTheme("dark")}>
        <MoonIcon />
        {browser.i18n.getMessage("dark_theme")}
      </ThemeOption>
      <Spacer y={0.5} />
      <ThemeOption
        active={theme === "system"}
        onClick={() => setTheme("system")}
      >
        <DashboardIcon />
        {browser.i18n.getMessage("system_theme")}
      </ThemeOption>
      <Spacer y={2.5} />
      <ButtonV2
        fullWidth
        onClick={() => navigate(`/${params.setup}/${Number(params.page) + 1}`)}
      >
        {browser.i18n.getMessage("next")}
        <ArrowRightIcon style={{ marginLeft: "5px" }} />
      </ButtonV2>
    </>
  );
}

const ThemeOption = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 500;
  padding: 1.35rem 1.45rem;
  color: rgb(${(props) => props.theme.theme});
  background-color: ${(props) =>
    props.active ? "rgba(" + props.theme.theme + ", .2)" : "transparent"};
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) => props.theme.theme},
      ${(props) => (props.active ? ".2" : ".1")}
    );
  }
`;
