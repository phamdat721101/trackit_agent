"use client";

import {
  Star,
  Flame,
  ArrowUpRight,
  ArrowRight,
  EarthIcon,
  TwitterIcon,
  SendIcon,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDownIcon,
  ExternalLink,
  CopyIcon,
  GlobeIcon,
  ZapIcon,
  FilterIcon,
  FilterXIcon,
  ClipboardCheckIcon,
  SparklesIcon,
  Loader2,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "../../ui/scroll-area";
import { Button } from "../../ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/Table";
import { useRouter } from "next/navigation";
import {
  PricePredictionData,
  TokenInfo,
  TokenInfoSui,
} from "../../../types/interface";
import {
  formatAddress,
  formatTokenPrice,
  formatVolume,
  isTokenInfo,
} from "../../../types/helper";
import { format, formatDistanceToNowStrict } from "date-fns";
import { useContext, useEffect, useState } from "react";
import GlobalContext from "../../../context/store";
import axios from "axios";
import { Skeleton } from "../../ui/Skeleton";
import { Alert, AlertDescription, AlertTitle } from "../../ui/Alert"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../ui/tooltip";
import { Badge } from "../../ui/badge";
import Image from "next/image";
import Twitter from "../../icons/twitter";
import PricePredictionModal from "./PricePrediction";
import { PriceFormatter } from "../PriceFormatter";

export default function CryptoTable() {
  const { setSelectedToken, selectedChain } = useContext(GlobalContext);
  const [tokenInfoList, setTokenInfoList] = useState<
    TokenInfo[] | TokenInfoSui[]
  >(intitialList);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>("1m");
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [copiedTokenIds, setCopiedTokenIds] = useState<Set<string>>(new Set());
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [pricePrediction, setPricePrediction] =
    useState<PricePredictionData | null>(null);
  const itemsPerPage = 8;

  const clickHandler = (token: TokenInfo | TokenInfoSui) => {
    setSelectedToken(token);
    if (isTokenInfo(token)) {
      router.push(`/token/${token.mintAddr}`);
    } else {
      router.push(`/token/${token.token_address}`);
    }
  };

  const copyAddress = async (token: TokenInfo | TokenInfoSui) => {
    setSelectedToken(token);
    try {
      if (isTokenInfo(token)) {
        await navigator.clipboard.writeText(token.mintAddr);
      } else {
        await navigator.clipboard.writeText(token.token_address);
      }
      setCopiedTokenIds((prev) => {
        const newSet = new Set(prev);
        if (isTokenInfo(token)) {
          newSet.add(token.id);
        } else {
          newSet.add(token.symbol);
        }
        return newSet;
      });
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedTokenIds((prev) => {
          const newSet = new Set(prev);
          if (isTokenInfo(token)) {
            newSet.delete(token.id);
          } else {
            newSet.delete(token.symbol);
          }
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Cannot copy address");
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const predictionHandler = async (name: string, symbol: string) => {
    setIsPredictionLoading(true);
    setIsPredictionOpen(true);
    const url = "https://api.trackit-app.xyz/v1/agent/price_prediction";
    const value = {
      name,
      symbol,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      });

      const result = await response.json();
      console.log(result);
      setPricePrediction(result);
      setIsPredictionLoading(false);
    } catch (error) {
      console.log("Failed to prediction.");
    }
  };

  useEffect(() => {
    const fetchTokenInfoList = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_TRACKIT_API_HOST}/token/list?limit=${itemsPerPage}&offset=${currentPage}&chain=${selectedChain}`
        );
        // console.log(response);
        if (response.status === 200) {
          const data: TokenInfo[] | TokenInfoSui[] = response.data;
          setTokenInfoList(data);
        }
      } catch (err) {
        setError("Failed to fetch governance data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenInfoList();
  }, [currentPage, itemsPerPage, selectedChain]);

  return (
    <div className="w-full h-[calc(100vh-6rem)] text-gray-100 overflow-hidden flex flex-col shadow-lg">
      {/* Time Filters */}
      <div className="mb-4 md:flex">
        <div className="border border-[#1a3c78] rounded-lg w-fit mb-3 md:mb-0">
          {timeFilters.map((filter) => (
            <Button
              key={filter}
              variant="ghost"
              onClick={() => setSelectedTime(filter)}
              className={`${
                selectedTime === filter
                  ? "bg-[#005880] text-gray-300"
                  : "bg-[#102447] text-gray-500"
              } text-sm border-r border-r-[#1a3c78] last:border-none rounded-none first:rounded-s-lg last:rounded-e-lg hover:bg-[#005880] hover:text-current`}
            >
              {filter}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-4">
          {/* <Button variant="outline" className="gap-2">
            <ZapIcon className="h-4 w-4" />
            Buy
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">0</Button>
            <Button variant="outline">$</Button>
          </div> */}
          <Button
            className="px-5 text-gray-300 bg-[#102447] hover:bg-[#005880] hover:text-current"
            onClick={() => setIsFiltered(!isFiltered)}
          >
            {!isFiltered ? <FilterIcon /> : <FilterXIcon />}
            <span className="text-[15px]">Filter Token</span>
          </Button>
          <Button
            variant="default"
            className="px-5 bg-bluesky text-base font-semibold hover:bg-bluesky/80"
          >
            Connect
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 max-w-full overflow-hidden">
        <ScrollArea className="w-full h-full">
          {/* Desktop View */}
          <Table className="hidden md:table bg">
            <TableHeader className="sticky top-0 z-10 bg">
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-52 text-gray-400 font-medium">
                  Token
                </TableHead>
                <TableHead className="min-w-28 text-gray-400 font-medium">
                  Exchange
                </TableHead>
                <TableHead className="min-w-32 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    Age <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-28 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    Price <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-28 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    Liq/MC <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-28 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    % Holder <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-28 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    TXs <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-28 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    Vol <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-20 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    1m% <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-20 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    5m% <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className="min-w-20 text-gray-400 font-medium">
                  <button className="flex gap-1 items-center">
                    1h% <ChevronsUpDownIcon width={14} height={14} />
                  </button>
                </TableHead>
                <TableHead className=""></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(10)].map((_, index) => <LoadingRow key={index} />)}
              {!isLoading &&
                tokenInfoList.map((token: TokenInfo | TokenInfoSui) => {
                  if (isTokenInfo(token)) {
                    return (
                      <TableRow key={token.id} className="hover:bg-blue-900">
                        <TableCell>
                          {/* Token info cell content */}
                          <div className="flex items-center gap-2">
                            <img
                              src={token.image}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-400">
                                  {token.tickerSymbol}
                                </span>
                                <button
                                  className={`${
                                    copiedTokenIds.has(token.id)
                                      ? "text-green-500"
                                      : "text-gray-500"
                                  }`}
                                  onClick={() => copyAddress(token)}
                                >
                                  {!copiedTokenIds.has(token.id) ? (
                                    <CopyIcon width={12} height={12} />
                                  ) : (
                                    <ClipboardCheckIcon
                                      width={12}
                                      height={12}
                                    />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {token.creator
                                    ? formatAddress(token.creator)
                                    : formatAddress(token.creator)}
                                </span>
                                {token.website && (
                                  <button
                                    className="text-gray-500"
                                    onClick={() =>
                                      window.open(
                                        token.website ||
                                          "https://www.movementnetwork.xyz/",
                                        "_blank",
                                        "noopener noreferrer"
                                      )
                                    }
                                  >
                                    <GlobeIcon width={12} height={12} />
                                  </button>
                                )}
                                {token.twitter && (
                                  <button
                                    className="text-gray-500"
                                    onClick={() =>
                                      window.open(
                                        token.twitter || "https://x.com/",
                                        "_blank",
                                        "noopener noreferrer"
                                      )
                                    }
                                  >
                                    <Twitter />
                                  </button>
                                )}
                                {token.telegram && (
                                  <button
                                    className="text-gray-500"
                                    onClick={() =>
                                      window.open(
                                        token.telegram ||
                                          "https://telegram.org",
                                        "_blank",
                                        "noopener noreferrer"
                                      )
                                    }
                                  >
                                    <SendIcon width={12} height={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Image
                              src="/dexes/routex.png"
                              alt="routex"
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <Image
                              src="/dexes/warpgate.png"
                              alt="routex"
                              width={32}
                              height={32}
                              className="rounded-full -ml-4"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            {/* Wrap the date cell content with a Tooltip */}
                            <TooltipTrigger asChild>
                              {/* Use TooltipTrigger for accessibility */}
                              <span className="text-green-400 font-medium text-[15px] cursor-pointer">
                                {/* Make it look clickable */}
                                {calculateDaysSinceCreation(token.cdate)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-50 text-gray-900">
                              {/* Tooltip content shows the original date */}
                              {format(new Date(token.cdate), "yyyy-MM-dd")}
                              {/* Format the date as you like */}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex text-gray-400 font-bold text-[15px]">
                                $
                                {token.aptosUSDPrice && (
                                  <PriceFormatter price={token.aptosUSDPrice} />
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-50 text-gray-900">
                              {formatTokenPrice(token.aptosUSDPrice)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 font-semibold text-[15px]">
                            {formatVolume(token.marketCapUSD)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 font-bold text-[15px]">
                            5%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 font-bold text-[15px]">
                            10
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sky-600 font-bold text-[15px]">
                            ${formatVolume(15000000)}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`font-semibold text-[15px] ${
                            false ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          -1.1%
                        </TableCell>
                        <TableCell
                          className={`font-semibold text-[15px] ${
                            false ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          -0.5%
                        </TableCell>
                        <TableCell
                          className={`font-semibold text-[15px] ${
                            true ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          5.09%
                        </TableCell>
                        <TableCell className="flex items-center gap-3">
                          <Button
                            size="sm"
                            onClick={() => clickHandler(token)}
                            className="px-5 flex items-center bg-transparent hover:bg-bluesky text-[#8899A8] hover:text-gray-50 border border-bluesky"
                          >
                            <Image
                              src="/flash.png"
                              alt="flash"
                              width={20}
                              height={20}
                            />
                            <span className="text-[15px] font-medium">Buy</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              predictionHandler(token.name, token.tickerSymbol)
                            }
                            className="px-2.5 bg-transparent hover:bg-bluesky text-yellow-400 border border-bluesky rounded-full"
                          >
                            <SparklesIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    return (
                      <TableRow
                        key={token.symbol}
                        className="hover:bg-blue-900"
                      >
                        <TableCell>
                          {/* Token info cell content */}
                          <div className="flex items-center gap-2">
                            <img
                              src={token.token_metadata.iconUrl}
                              alt=""
                              className="h-8 w-8 rounded-full"
                            />
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-400">
                                  {token.token_metadata.symbol}
                                </span>
                                <button
                                  className={`${
                                    copiedTokenIds.has(token.token_address)
                                      ? "text-green-500"
                                      : "text-gray-500"
                                  }`}
                                  onClick={() => copyAddress(token)}
                                >
                                  {!copiedTokenIds.has(token.symbol) ? (
                                    <CopyIcon width={12} height={12} />
                                  ) : (
                                    <ClipboardCheckIcon
                                      width={12}
                                      height={12}
                                    />
                                  )}
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                  {formatAddress(token.created_by)}
                                </span>
                                {token.website && (
                                  <button
                                    className="text-gray-500"
                                    onClick={() =>
                                      window.open(
                                        token.website,
                                        "_blank",
                                        "noopener noreferrer"
                                      )
                                    }
                                  >
                                    <GlobeIcon width={12} height={12} />
                                  </button>
                                )}
                                {token.twitter && (
                                  <button
                                    className="text-gray-500"
                                    onClick={() =>
                                      window.open(
                                        token.twitter,
                                        "_blank",
                                        "noopener noreferrer"
                                      )
                                    }
                                  >
                                    <Twitter />
                                  </button>
                                )}
                                {token.telegram && (
                                  <button
                                    className="text-gray-500"
                                    onClick={() =>
                                      window.open(
                                        token.telegram,
                                        "_blank",
                                        "noopener noreferrer"
                                      )
                                    }
                                  >
                                    <SendIcon width={12} height={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Image
                              src="/dexes/sui_dex.png"
                              alt="sui_dex"
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            {/* Wrap the date cell content with a Tooltip */}
                            <TooltipTrigger asChild>
                              {/* Use TooltipTrigger for accessibility */}
                              <span className="text-green-400 font-medium text-[15px] cursor-pointer">
                                {/* Make it look clickable */}
                                {calculateDaysSinceCreation(token.created_at)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-50 text-gray-900">
                              {/* Tooltip content shows the original date */}
                              {format(new Date(token.created_at), "yyyy-MM-dd")}
                              {/* Format the date as you like */}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex text-gray-400 font-bold text-[15px]">
                                $
                                {token.token_price_usd && (
                                  <PriceFormatter
                                    price={token.token_price_usd}
                                  />
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-50 text-gray-900">
                              {formatTokenPrice(token.token_price_usd)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 font-semibold text-[15px]">
                            {formatVolume(token.market_cap_usd)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 font-bold text-[15px]">
                            5%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400 font-bold text-[15px]">
                            10
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sky-600 font-bold text-[15px]">
                            ${formatVolume(+token.volume_usd)}
                          </span>
                        </TableCell>
                        <TableCell
                          className={`font-semibold text-[15px] ${
                            false ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          -1.1%
                        </TableCell>
                        <TableCell
                          className={`font-semibold text-[15px] ${
                            false ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          -0.5%
                        </TableCell>
                        <TableCell
                          className={`font-semibold text-[15px] ${
                            true ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          5.09%
                        </TableCell>
                        <TableCell className="flex items-center gap-3">
                          <Button
                            size="sm"
                            onClick={() => clickHandler(token)}
                            className="px-5 flex items-center bg-transparent hover:bg-bluesky text-[#8899A8] hover:text-gray-50 border border-bluesky"
                          >
                            <Image
                              src="/flash.png"
                              alt="flash"
                              width={20}
                              height={20}
                            />
                            <span className="text-[15px] font-medium">Buy</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              predictionHandler(
                                token.token_metadata.name,
                                token.token_metadata.symbol
                              )
                            }
                            className="px-2.5 bg-transparent hover:bg-bluesky text-yellow-400 border border-bluesky rounded-full"
                          >
                            <SparklesIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                })}
            </TableBody>
          </Table>
          {isPredictionLoading && !pricePrediction && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          )}
          {!isPredictionLoading && pricePrediction && (
            <PricePredictionModal
              isOpen={isPredictionOpen}
              onClose={() => setIsPredictionOpen(false)}
              data={pricePrediction}
            />
          )}
          {/* Mobile View */}
          <ul className="md:hidden divide-y divide-itemborder">
            {!isLoading &&
              tokenInfoList.map((token) => {
                if (isTokenInfo(token)) {
                  return (
                    <li key={token.id} className="p-4 hover:bg-item/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={token.image}
                            alt=""
                            className="h-8 w-8 rounded-full"
                          />
                          <div>
                            <div className="font-semibold">
                              {token.tickerSymbol}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatAddress(token.creator)}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => clickHandler(token)}
                          className="px-5 flex items-center bg-transparent hover:bg-bluesky text-[#8899A8] hover:text-gray-50"
                        >
                          <Image
                            src="/flash.png"
                            alt="flash"
                            width={20}
                            height={20}
                          />
                          <span className="text-[15px] font-medium">Buy</span>
                        </Button>
                      </div>
                      <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="text-gray-400">Price</dt>
                          <dd className="font-medium">
                            ${token.aptosUSDPrice.toFixed(2)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">Market Cap</dt>
                          <dd>{formatVolume(token.marketCapUSD)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">24h Change</dt>
                          <dd
                            className={true ? "text-green-500" : "text-red-500"}
                          >
                            2.99%
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400">Volume</dt>
                          <dd>{formatVolume(15000000)}</dd>
                        </div>
                      </dl>
                    </li>
                  );
                } else {
                  <li key={token.symbol} className="p-4 hover:bg-item/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={token.token_metadata.iconUrl}
                          alt=""
                          className="h-8 w-8 rounded-full"
                        />
                        <div>
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-xs text-gray-400">
                            {formatAddress(token.created_by)}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => clickHandler(token)}
                        className="px-5 flex items-center bg-transparent hover:bg-bluesky text-[#8899A8] hover:text-gray-50"
                      >
                        <Image
                          src="/flash.png"
                          alt="flash"
                          width={20}
                          height={20}
                        />
                        <span className="text-[15px] font-medium">Buy</span>
                      </Button>
                    </div>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-gray-400">Price</dt>
                        <dd className="font-medium">
                          ${token.token_price_usd.toFixed(2)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Market Cap</dt>
                        <dd>{formatVolume(token.market_cap_usd)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">24h Change</dt>
                        <dd
                          className={true ? "text-green-500" : "text-red-500"}
                        >
                          2.99%
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Volume</dt>
                        <dd>{formatVolume(15000000)}</dd>
                      </div>
                    </dl>
                  </li>;
                }
              })}
          </ul>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Pagination */}

      <div className="flex justify-between items-center p-4 border-t border-itemborder">
        <span className="text-sm text-gray-400 hidden sm:inline">
          Showing {itemsPerPage} tokens per page
        </span>
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 text-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2">Page {currentPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            className="h-8 text-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const LoadingRow = () => (
  <TableRow className="border-itemborder bg">
    <TableCell colSpan={12} className="h-8">
      <Skeleton className="h-3 w-full rounded-md" />
    </TableCell>
  </TableRow>
);

const ErrorAlert = ({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) => (
  <Alert variant="destructive" className="my-4">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="flex flex-col gap-2">
      <p>{message}</p>
      <button
        onClick={retry}
        className="text-sm underline hover:text-red-400 w-fit"
      >
        Try again
      </button>
    </AlertDescription>
  </Alert>
);

// Utility Components
const SocialButton = ({ icon: Icon, link }: { icon: any; link: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button className="p-1 rounded-full hover:bg-gray-700/50 transition-colors">
        <Icon className="h-3 w-3 text-gray-400" />
      </button>
    </TooltipTrigger>
    <TooltipContent>Visit Website</TooltipContent>
  </Tooltip>
);

const CopyableAddress = ({
  address,
  onClick,
}: {
  address: string;
  onClick: () => void;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        onClick={onClick}
      >
        <span>{formatAddress(address)}</span>
        <Copy className="h-3 w-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent>Copy Address</TooltipContent>
  </Tooltip>
);

const PriceChangeCell = ({ value }: { value: number }) => (
  <TableCell>
    <span
      className={`flex items-center gap-1 ${
        value >= 0 ? "text-green-500" : "text-red-500"
      }`}
    >
      {value >= 0 ? "+" : ""}
      {value}%
      <ArrowUpRight
        className={`h-3 w-3 ${value >= 0 ? "rotate-0" : "rotate-180"}`}
      />
    </span>
  </TableCell>
);

const timeFilters = ["1m", "5m", "1h", "6h", "24h"];

const intitialList = [
  {
    id: "194276b0-e001-11ef-b8c0-4d00584636d5",
    name: "Karina",
    tickerSymbol: "KARINA",
    desc: null,
    creator:
      "0x6c609ba89c1fbb827fe4e315e0ee4726246de43e5e75a40e18c2e918e9af2ca2",
    mintAddr:
      "0x6c609ba89c1fbb827fe4e315e0ee4726246de43e5e75a40e18c2e918e9af2ca2::KARINA::KARINA",
    image:
      "https://hatchy.s3.us-east-2.amazonaws.com/1738348079325-501195195949017f54ab79e6cfe40e63.jpg",
    twitter: null,
    telegram: null,
    website: null,
    status: "ACTIVE",
    cdate: "2025-01-31T18:27:59.000Z",
    creatorName: "Movement Diddy",
    creatorWalletAddr:
      "0x6c609ba89c1fbb827fe4e315e0ee4726246de43e5e75a40e18c2e918e9af2ca2",
    creatorAvatar:
      "https://hatchy.s3.us-east-2.amazonaws.com/1730711933101-download.jpeg",
    replies: 0,
    marketCapUSD: 52959.2714075277,
    trades: [],
    aptosUSDPrice: 529.592714075277,
    holderPercentage: "1",
    bondinCurvepercentage: 0,
    seeded: null,
  },
  {
    id: "a0110fc0-df5d-11ef-b8c0-4d00584636d5",
    name: "KUENTOL",
    tickerSymbol: "KUENTOL",
    desc: "NOTHING ",
    creator:
      "0x162bf8aa221f53df07614478cdbfeb9b415183fba98bc02df7195a224a9e25ab",
    mintAddr:
      "0x162bf8aa221f53df07614478cdbfeb9b415183fba98bc02df7195a224a9e25ab::KUENTOL::KUENTOL",
    image:
      "https://hatchy.s3.us-east-2.amazonaws.com/1738277867896-240715-NewJeans-Hanni-Instagram-Update-documents-2.jpeg",
    twitter: null,
    telegram: null,
    website: null,
    status: "ACTIVE",
    cdate: "2025-01-30T22:57:48.000Z",
    creatorName: "tragicmolester",
    creatorWalletAddr:
      "0x162bf8aa221f53df07614478cdbfeb9b415183fba98bc02df7195a224a9e25ab",
    creatorAvatar: null,
    replies: 0,
    marketCapUSD: 6372353.06198591,
    trades: [
      {
        side: "BUY",
        count: "2",
        volume: "1007.000000000000000000",
      },
    ],
    aptosUSDPrice: 529.592714075277,
    holderPercentage: "1",
    bondinCurvepercentage: 249.2325,
    seeded: "IN_PROGRESS",
  },
  {
    id: "f9176470-de04-11ef-b8c0-4d00584636d5",
    name: "Micky ",
    tickerSymbol: "MICKY",
    desc: null,
    creator:
      "0x18394ec9e2a191e2470612a57547624b12254c9fbb552acaff6750237491d644",
    mintAddr:
      "0x18394ec9e2a191e2470612a57547624b12254c9fbb552acaff6750237491d644::MICKY::MICKY",
    image:
      "https://hatchy.s3.us-east-2.amazonaws.com/1738129841016-Screenshot_2025-01-24_at_2.03.24_PM.png",
    twitter: null,
    telegram: null,
    website: null,
    status: "ACTIVE",
    cdate: "2025-01-29T05:50:41.000Z",
    creatorName: "finishingcustodian",
    creatorWalletAddr:
      "0x18394ec9e2a191e2470612a57547624b12254c9fbb552acaff6750237491d644",
    creatorAvatar: null,
    replies: 0,
    marketCapUSD: 63929.6935066372,
    trades: [
      {
        side: "BUY",
        count: "1",
        volume: "9.970000000000000000",
      },
    ],
    aptosUSDPrice: 529.592714075277,
    holderPercentage: "2",
    bondinCurvepercentage: 2.467575,
    seeded: null,
  },
  {
    id: "9839d8d0-dde2-11ef-b8c0-4d00584636d5",
    name: "LPWEB",
    tickerSymbol: "LPWEB",
    desc: "LPWEB",
    creator:
      "0x3186a5a0185043dd27fb28b45520fc2c3ddc708ac5d565be88561056a5c77d8f",
    mintAddr:
      "0x3186a5a0185043dd27fb28b45520fc2c3ddc708ac5d565be88561056a5c77d8f::LPWEB::LPWEB",
    image: "https://hatchy.s3.us-east-2.amazonaws.com/1738115075635-usc.gif",
    twitter: null,
    telegram: null,
    website: null,
    status: "ACTIVE",
    cdate: "2025-01-29T01:44:35.000Z",
    creatorName: "contractualself",
    creatorWalletAddr:
      "0x3186a5a0185043dd27fb28b45520fc2c3ddc708ac5d565be88561056a5c77d8f",
    creatorAvatar: null,
    replies: 0,
    marketCapUSD: 64016.842309759,
    trades: [
      {
        side: "BUY",
        count: "3",
        volume: "10.070697000000000000",
      },
      {
        side: "SELL",
        count: "1",
        volume: "0.024691100000000000",
      },
    ],
    aptosUSDPrice: 529.592714075277,
    holderPercentage: "2",
    bondinCurvepercentage: 2.4863247325,
    seeded: null,
  },
  {
    id: "06c50fa0-dde2-11ef-b8c0-4d00584636d5",
    name: "RZRWEB",
    tickerSymbol: "RZRWEB",
    desc: "RZRWEB",
    creator:
      "0x085ac0fb7f5fc94debe86ba9490dd76855bbec19d78c42e40075deb7f7c94081",
    mintAddr:
      "0x085ac0fb7f5fc94debe86ba9490dd76855bbec19d78c42e40075deb7f7c94081::RZRWEB::RZRWEB",
    image: "https://hatchy.s3.us-east-2.amazonaws.com/1738114831559-usc.gif",
    twitter: null,
    telegram: null,
    website: null,
    status: "ACTIVE",
    cdate: "2025-01-29T01:40:31.000Z",
    creatorName: "astonishingpredecessor",
    creatorWalletAddr:
      "0x085ac0fb7f5fc94debe86ba9490dd76855bbec19d78c42e40075deb7f7c94081",
    creatorAvatar: null,
    replies: 0,
    marketCapUSD: 64016.0649293167,
    trades: [
      {
        side: "BUY",
        count: "3",
        volume: "10.069799700000000000",
      },
      {
        side: "SELL",
        count: "1",
        volume: "0.024471550000000000",
      },
    ],
    aptosUSDPrice: 529.592714075277,
    holderPercentage: "2",
    bondinCurvepercentage: 2.48615754,
    seeded: null,
  },
];

const calculateDaysSinceCreation = (cdate: string): string => {
  try {
    const date = new Date(cdate);
    return formatDistanceToNowStrict(date, { addSuffix: false }); // Use strict mode
  } catch (error) {
    console.error("Error parsing date:", error);
    return "Invalid date"; // Or a suitable fallback
  }
};
