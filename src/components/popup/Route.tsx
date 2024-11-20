import { AnimatePresence, motion, type Variants } from "framer-motion";
import { createElement, type PropsWithChildren } from "react";
import { useRoute, Route as BaseRoute } from "wouter";
import styled from "styled-components";

/**
 * Custom Route component that allows iOS-like animations
 */
const Route: typeof BaseRoute = ({ path, component, children }) => {
  const [matches, params] = useRoute(path);
  if (!matches) return null;

  const routeContent = component
    ? createElement(component, { params })
    : typeof children === "function"
    ? children(params)
    : children;

  return <Page>{routeContent}</Page>;
};

const PageWrapper = styled(motion.main)`
  position: relative;
  top: 0;
  width: 100%;
  min-height: 100vh;
  max-height: max-content;
`;

export const Page = ({ children }: PropsWithChildren) => {
  const opacityAnimation: Variants = {
    initial: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <PageWrapper
      id="Page"
      initial="initial"
      animate="enter"
      exit="exit"
      variants={opacityAnimation}
    >
      {children}
    </PageWrapper>
  );
};

export default Route;
