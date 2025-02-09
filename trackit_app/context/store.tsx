"use client";
import { TokenInfo, TokenInfoSui } from "../types/interface";
import { createContext, Dispatch, SetStateAction, useState } from "react";

interface ContextProps {
  isLogged: boolean;
  setIsLogged: Dispatch<SetStateAction<boolean>>;
  loadingFullScreen: boolean;
  setLoadingFullScreen: Dispatch<SetStateAction<boolean>>;
  selectedToken: TokenInfo | TokenInfoSui | null;
  setSelectedToken: Dispatch<SetStateAction<TokenInfo | TokenInfoSui | null>>;
  selectedChain: string;
  setSelectedChain: Dispatch<SetStateAction<string>>;
  selectedNav: string;
  setSelectedNav: Dispatch<SetStateAction<string>>;
}

const GlobalContext = createContext<ContextProps>({
  isLogged: false,
  setIsLogged: () => {},
  loadingFullScreen: false,
  setLoadingFullScreen: () => {},
  selectedToken: null,
  setSelectedToken: () => {},
  selectedChain: "movement",
  setSelectedChain: () => {},
  selectedNav: "Meme",
  setSelectedNav: () => {},
});

export default GlobalContext;

export const GlobalContextProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [isLogged, setIsLogged] = useState(false);
  const [loadingFullScreen, setLoadingFullScreen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<
    TokenInfo | TokenInfoSui | null
  >(token);
  const [selectedChain, setSelectedChain] = useState<string>("movement");
  const [selectedNav, setSelectedNav] = useState<string>("Meme");

  return (
    <GlobalContext.Provider
      value={{
        isLogged,
        setIsLogged,
        loadingFullScreen,
        setLoadingFullScreen,
        selectedToken,
        setSelectedToken,
        selectedChain,
        setSelectedChain,
        selectedNav,
        setSelectedNav,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

const token = {
  id: "a90ffda0-ad6e-11ef-9d7e-fb2b1f0dc49c",
  name: "Selfie",
  tickerSymbol: "SELFIE",
  desc: null,
  creator: "0xbbf0540b817ebd012b335c7ce3575bcbf58d0ed05d37a9f777c01213cb7a375f",
  mintAddr:
    "0xbbf0540b817ebd012b335c7ce3575bcbf58d0ed05d37a9f777c01213cb7a375f::SELFIE::SELFIE",
  image: "https://hatchy.s3.us-east-2.amazonaws.com/1732787626438-source.gif",
  twitter: null,
  telegram: null,
  website: null,
  status: "ACTIVE",
  cdate: "2024-11-28T09:53:46.000Z",
  creatorName: "Leo Wong",
  creatorWalletAddr:
    "0xbbf0540b817ebd012b335c7ce3575bcbf58d0ed05d37a9f777c01213cb7a375f",
  creatorAvatar: null,
  replies: 0,
  marketCapUSD: 28898.2429290334,
  trades: [],
  aptosUSDPrice: 288.982429290334,
  holderPercentage: "1",
  bondinCurvepercentage: 0,
  seeded: null,
};
