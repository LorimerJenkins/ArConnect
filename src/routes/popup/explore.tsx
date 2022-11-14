import { Card, Section, Spacer, Text } from "@arconnect/components";
import { getMarketChart, getArPrice } from "~lib/coingecko";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import getArweaveNewsFeed, { ArweaveNewsArticle } from "~lib/arweave_news";
import PeriodPicker from "~components/popup/asset/PeriodPicker";
import viewblockLogo from "url:/assets/ecosystem/viewblock.png";
import metaweaveLogo from "url:/assets/ecosystem/metaweave.png";
import PriceChart from "~components/popup/asset/PriceChart";
import arDriveLogo from "url:/assets/ecosystem/ardrive.svg";
import aftrLogo from "url:/assets/ecosystem/aftrmarket.png";
import warpLogo from "url:/assets/ecosystem/warp.svg";
import AppIcon from "~components/popup/home/AppIcon";
import browser from "webextension-polyfill";
import Head from "~components/popup/Head";
import useSetting from "~settings/hook";
import styled from "styled-components";

export default function Explore() {
  // ar price period
  const [period, setPeriod] = useState("Day");

  // currency setting
  const [currency] = useSetting<string>("currency");

  // load ar price history
  const [priceData, setPriceData] = useState([]);

  useEffect(() => {
    (async () => {
      const days = {
        Day: "1",
        Week: "7",
        Month: "31",
        Year: "365",
        All: "max"
      };
      const { prices } = await getMarketChart(currency, days[period]);

      setPriceData(prices.map(([, price]) => price));
    })();
  }, [period, currency]);

  // load latest ar price
  const [latestPrice, setLatestPrice] = useState(0);

  useEffect(() => {
    (async () => {
      const price = await getArPrice(currency);

      setLatestPrice(price);
    })();
  }, [currency]);

  // active featured news page
  const [featuredPage, setFeaturedPage] = useState<number>(0);

  useEffect(() => {
    const id = setTimeout(
      () =>
        setFeaturedPage((v) => {
          if (v > 1) return 0;
          else return v + 1;
        }),
      4000
    );

    return () => clearInterval(id);
  }, [featuredPage]);

  // parse arweave.news RSS
  const [feed, setFeed] = useState<ArweaveNewsArticle[]>();

  useEffect(() => {
    getArweaveNewsFeed()
      .then((res) => setFeed(res.items as any))
      .catch();
  }, []);

  return (
    <>
      <Head title={browser.i18n.getMessage("explore")} />
      <PriceChart
        token={{
          name: "Arweave",
          ticker: "AR"
        }}
        priceData={priceData}
        latestPrice={latestPrice}
      >
        <PeriodPicker period={period} onChange={(p) => setPeriod(p)} />
      </PriceChart>
      <Section>
        <Text heading noMargin>
          {browser.i18n.getMessage("news_and_updates")}
        </Text>
        <Spacer y={0.75} />
        <FeaturedArticles>
          <AnimatePresence>
            <FeaturedArticle
              key={featuredPage}
              background="https://arweave.news/wp-content/uploads/2022/11/bdfgbndgbdgnsgnsns.png"
              onClick={() =>
                browser.tabs.create({
                  url: feed?.[featuredPage]?.link
                })
              }
            >
              <ArticleTitle style={{ textAlign: "center" }}>
                {feed?.[featuredPage]?.title || ""}
              </ArticleTitle>
            </FeaturedArticle>
          </AnimatePresence>
          <Paginator>
            {new Array(3).fill("").map((_, i) => (
              <Page
                active={i === featuredPage}
                onClick={() => setFeaturedPage(i)}
                key={i}
              />
            ))}
          </Paginator>
        </FeaturedArticles>
        <Spacer y={1} />
        <Card smallPadding>
          <ShortcutsLabel>
            {browser.i18n.getMessage("shortcuts")}
          </ShortcutsLabel>
          <Shortcuts>
            <AppIcon color="#ffa4b5">
              <img src={arDriveLogo} alt={"ArDrive"} draggable={false} />
            </AppIcon>
            <AppIcon color="#000">
              <img src={aftrLogo} alt={"AFTR"} draggable={false} />
            </AppIcon>
            <AppIcon color="#7bc0de">
              <img src={viewblockLogo} alt={"Viewblock"} draggable={false} />
            </AppIcon>
            <AppIcon color="#ffbdfd">
              <img src={metaweaveLogo} alt={"Metaweave"} draggable={false} />
            </AppIcon>
            <AppIcon color="#b7caff">
              <img src={warpLogo} alt={"Sonar"} draggable={false} />
            </AppIcon>
          </Shortcuts>
        </Card>
        <Spacer y={1} />
        <SmallerArticles>
          <SquareArticle></SquareArticle>
          <LongArticle></LongArticle>
        </SmallerArticles>
      </Section>
    </>
  );
}

const FeaturedArticles = styled(Card)`
  position: relative;
  display: flex;
  background-color: #000;
  padding: 0;
  overflow: hidden;
  border: none;
  height: 125px;
`;

const Paginator = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  gap: 0.42rem;
  bottom: 0.9rem;
  left: 50%;
  transform: translateX(-50%);
`;

const Page = styled.div<{ active?: boolean }>`
  width: 4px;
  height: 4px;
  border-radius: 100%;
  border: 1px solid #fff;
  background-color: ${(props) => (props.active ? "#fff" : "transparent")};
  cursor: pointer;
  transition: all 0.23s ease-in-out;
`;

const FeaturedArticle = styled(motion.div).attrs({
  initial: { x: 1000, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -1000, opacity: 0 },
  transition: {
    x: { type: "spring", stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  }
})<{ background: string }>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  background-image: url(${(props) => props.background});
  background-size: cover;
  cursor: pointer;
  padding: 3rem 0 1.95rem;
`;

const ArticleTitle = styled(Text)`
  color: #fff;
  margin: 0;
`;

const ShortcutsLabel = styled(Text)`
  display: flex;
  justify-content: space-between;
  font-size: 0.73rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const Shortcuts = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SmallerArticles = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const SquareArticle = styled(Card)`
  padding: 0.2rem;
  height: calc(105px - 0.2rem * 2);
  width: calc(105px - 0.2rem * 2);
`;

const LongArticle = styled(SquareArticle)`
  width: calc(100% - 105px - 0.2rem * 2 - 1rem);
`;