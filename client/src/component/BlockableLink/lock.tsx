import { useContext, createContext } from 'react';
import { NavigateFunction, NavigateProps, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useState } from 'react';
import { useRef } from 'react';

type BlockReleaser = () => void;

interface BlockableLink {
  blockWithReleaseRequest: (onRequest: () => boolean) => BlockReleaser;
  greedyBlock: () => BlockReleaser;
  requestUnBlock: (navigate: NonNullable<() => void>) => void;
  getBlockStatus: () => boolean;
  subscribe: (cb: () => void) => void | (() => void);
}

function createLinkBlock(): BlockableLink {
  let linkBlock: null | Symbol = null;
  const subscribers = new Set<() => void>();
  let requestFn: (() => void) | null = null;

  let deferNav: (() => void) | null = null;

  function notifyOnUnblock() {
    subscribers.forEach((cb) => {
      cb();
    });
  }

  // declare var navigate: NavigateFunction;
  return {
    blockWithReleaseRequest: (_requestFn) => {
      if (typeof linkBlock === 'symbol') throw new Error();
      let hasUnblock = false;
      linkBlock = Symbol();

      notifyOnUnblock();

      requestFn = () => {
        const permit = _requestFn();
        if (permit && deferNav) {
          unsubscribe();
          notifyOnUnblock();
          hasUnblock = true;
          return deferNav();
        }
        if (!permit) {
          deferNav = null;
        }
      };

      const unsubscribe = () => {
        if (!hasUnblock && (hasUnblock = true)) {
          requestFn = null;
          linkBlock = null;
          notifyOnUnblock();
        }
      };
      return unsubscribe;
    },

    greedyBlock: () => () => {
      if (typeof linkBlock === 'symbol') throw new Error();
      let hasUnblock = false;
      linkBlock = Symbol();
      notifyOnUnblock();

      return () => {
        if (!hasUnblock && (hasUnblock = true)) {
          requestFn = null;
          linkBlock = null;
          notifyOnUnblock();
        }
      };
    },

    requestUnBlock(navigate: NonNullable<typeof deferNav>) {
      if (typeof linkBlock !== 'symbol') return true;
      deferNav = navigate;
      requestFn?.();
    },

    getBlockStatus: () => typeof linkBlock === 'symbol',
    subscribe: (cb) => {
      if (subscribers.has(cb)) return;
      subscribers.add(cb);
      let hasRemoved = false;
      return () => {
        if (hasRemoved) return;
        subscribers.delete(cb);
      };
    },
  };
}

type UseBlockLink = [
  getBlockStatus: () => boolean,
  actions: Pick<
    BlockableLink,
    'blockWithReleaseRequest' | 'greedyBlock' | 'requestUnBlock' | 'subscribe'
  >
];

const blockLink = createLinkBlock();
const useBlockLink = (): UseBlockLink => {
  const { getBlockStatus, ...rest } = useRef(blockLink).current;
  return [getBlockStatus, rest];
};

const useBlockLinkNavigate = () => {
  const [getBlockStatus, { requestUnBlock }] = useBlockLink();
  const navigate = useNavigate();
  return useCallback(({ to, ...restOption }: NavigateProps) => {
    if (getBlockStatus() && to !== location.pathname)
      return requestUnBlock(() => navigate(to, restOption));
    navigate(to, restOption);
  }, []);
};

export { useBlockLink, useBlockLinkNavigate };
