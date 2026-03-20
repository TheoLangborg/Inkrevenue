import { useEffect, useState } from "react";

function normalizePathname(pathname) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function getLocationSnapshot() {
  if (typeof window === "undefined") {
    return {
      pathname: "/",
      search: "",
      hash: ""
    };
  }

  return {
    pathname: normalizePathname(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash
  };
}

function scrollToHash(hash) {
  if (typeof window === "undefined") {
    return;
  }

  if (!hash) {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    return;
  }

  const element = document.getElementById(decodeURIComponent(hash.slice(1)));

  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function navigateTo(href, { replace = false } = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = new URL(href, window.location.href);

  if (nextUrl.origin !== window.location.origin) {
    window.location.assign(nextUrl.toString());
    return;
  }

  const nextRoute = `${normalizePathname(nextUrl.pathname)}${nextUrl.search}${nextUrl.hash}`;
  const currentRoute = `${normalizePathname(window.location.pathname)}${window.location.search}${window.location.hash}`;

  if (nextRoute !== currentRoute) {
    window.history[replace ? "replaceState" : "pushState"]({}, "", nextRoute);
    window.dispatchEvent(new Event("site:navigate"));
  }

  window.requestAnimationFrame(() => scrollToHash(nextUrl.hash));
}

export function useSiteLocation() {
  const [location, setLocation] = useState(() => getLocationSnapshot());

  useEffect(() => {
    const handleLocationChange = () => {
      setLocation(getLocationSnapshot());
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("site:navigate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("site:navigate", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(() => scrollToHash(location.hash));
  }, [location.pathname, location.search, location.hash]);

  return location;
}

export function SiteLink({ href, onClick, target, rel, ...props }) {
  function handleClick(event) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target
    ) {
      return;
    }

    const nextUrl = new URL(href, window.location.href);

    if (nextUrl.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    navigateTo(href);
  }

  return <a href={href} onClick={handleClick} target={target} rel={rel} {...props} />;
}
