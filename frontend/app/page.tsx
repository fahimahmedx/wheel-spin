"use client";

import { useState, useEffect } from "react";
import Component from "./swapUI/swap";
import {
  DynamicContextProvider,
  DynamicWidget,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

export default function Home() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: "bcc038de-e9ae-498e-b33d-eda614968f83",
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      <DynamicWidget />
      <AuthenticatedComponent />
    </DynamicContextProvider>
  );
}

function AuthenticatedComponent() {
  const { primaryWallet } = useDynamicContext();
  const [showComponent, setShowComponent] = useState(false);

  useEffect(() => {
    if (primaryWallet) {
      setShowComponent(true);
    } else {
      setShowComponent(false);
    }
  }, [primaryWallet]);

  return (
    <>
      {showComponent && (
        <div>
          <Component />
        </div>
      )}
    </>
  );
}
