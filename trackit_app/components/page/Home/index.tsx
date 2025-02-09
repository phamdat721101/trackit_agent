"use client";
import Panel from "./Panel";
import List, { renderList } from "../List";
import Item from "./Item";
import { useContext, useEffect, useState } from "react";
import { TokenInfo } from "../../../types/interface";
import axios from "axios";
import CryptoTable from "./CryptoTable";
import GlobalContext from "../../../context/store";
import YieldInfo from "./YieldInfo";
import TokenCards from "./TokenCards";

export default function Page() {
  const { selectedChain } = useContext(GlobalContext);

  return (
    <div className="grow w-full">
      {selectedChain === "movement" ||
      selectedChain === "sui" ||
      selectedChain === "aptos" ? (
        <CryptoTable />
      ) : selectedChain === "viction" ? (
        <TokenCards />
      ) : (
        <YieldInfo />
      )}
    </div>
  );
}
