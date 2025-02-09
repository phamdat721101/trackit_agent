"use client";

import { cn } from "../../../lib/utils";
import {
  Link as Chain,
  Scan,
  PanelLeftIcon,
  PanelLeft,
  Settings2,
  Menu,
  ListCheckIcon,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Frame,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
  ComponentIcon,
  CoinsIcon,
  ScanSearchIcon,
  SlidersVerticalIcon,
  LogOutIcon,
  FlameIcon,
  UsersIcon,
  ChartColumnIncreasingIcon,
  DatabaseIcon,
  FileChartColumnIncreasingIcon,
  LogInIcon,
  NewspaperIcon,
  SquareStackIcon,
  SendIcon,
  RocketIcon,
  ViewIcon,
  ChartSplineIcon,
  FishSymbolIcon,
  HandCoinsIcon,
  ChartCandlestickIcon,
  RadarIcon,
  MessageSquareMoreIcon,
  TrophyIcon,
} from "lucide-react";
import { NavMain } from "../Sidebar/NavMain";
import { NavUser } from "../Sidebar/nav-user";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "../../ui/Sheet";
import {
  SidebarMenuButton,
  SidebarMenuSubButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuItem,
  SidebarMenu,
  SidebarGroup,
  SidebarSeparator,
  SidebarHeader,
} from "../../ui/sidebar";
import { VisuallyHidden, Root } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import Link from "next/link";
import GlobalContext from "../../../context/store";
import { useState } from "react";
import { useContext } from "react";

interface ChainButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  isNew?: boolean;
  logo: string;
  name: string;
}

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Drawer using Sheet component */}
      <div className="md:hidden z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="fixed top-4 left-4 z-50 p-2 bg-[#112548] rounded-lg hover:bg-primary/90 border">
              <Menu className="h-6 w-6 text-primary-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[300px] p-0 bg-primary text-gray-50"
          >
            <VisuallyHidden>
              <SheetTitle>Main</SheetTitle>
            </VisuallyHidden>
            <div className="h-full flex flex-col">
              <MobileSidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div
          className={`
          relative 
          ${isCollapsed ? "w-[93px]" : "w-[210px]"}
          transition-all duration-300
          h-screen
        `}
        >
          {/* <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 bg-bluesky hover:bg-blue-300 rounded-full p-1 z-10"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-primary-foreground" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-primary-foreground" />
            )}
          </button> */}

          <div className="flex flex-col h-full sidebar">
            <DesktopSidebarContent isCollapsed={isCollapsed} />
          </div>
        </div>
      </div>
    </>
  );
}

function MobileSidebarContent() {
  const { selectedChain, setSelectedChain } = useContext(GlobalContext);
  const { selectedNav, setSelectedNav } = useContext(GlobalContext);

  return (
    <>
      <div className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="trackit" height={40} width={40} />
          <span className="font-bold text-2xl">TrackIt</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <SidebarGroup>
          <SidebarMenu>
            {mainNav.map((nav) => (
              <SidebarMenuItem
                key={nav.name}
                className={`${selectedNav === nav.name ? "selected-nav" : ""}`}
              >
                <SidebarMenuButton
                  asChild
                  onClick={() => setSelectedNav(nav.name)}
                >
                  <a
                    href={nav.url}
                    className={
                      selectedNav === nav.name
                        ? "text-bluesky"
                        : "text-gray-500"
                    }
                  >
                    {nav.icon}
                    <span
                      className={
                        selectedNav === nav.name
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      {nav.name}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="my-4 bg-itemborder" />
        <SidebarGroup className="grid grid-cols-3 gap-2 p-0">
          {chains.map((chain) => (
            <ChainButton
              key={chain.name}
              logo={chain.logo}
              name={chain.name}
              isActive={selectedChain === chain.value}
              onClick={() => setSelectedChain(chain.value)}
            />
          ))}
        </SidebarGroup>
        <SidebarSeparator className="bg-gray-500" />
        <SidebarGroup>
          <SidebarMenu className="gap-4">
            {secondNav.map((nav) => (
              <SidebarMenuItem
                key={nav.name}
                className={`${selectedNav === nav.name ? "selected-nav" : ""}`}
              >
                <SidebarMenuButton
                  asChild
                  onClick={() => setSelectedNav(nav.name)}
                >
                  <a
                    href={nav.url}
                    className={
                      selectedNav === nav.name
                        ? "text-bluesky"
                        : "text-gray-500"
                    }
                  >
                    {nav.icon}
                    <span
                      className={
                        selectedNav === nav.name
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      {nav.name}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="bg-gray-500" />
        <SidebarGroup>
          <SidebarHeader className="uppercase text-sm font-semibold">
            Premium Tools
          </SidebarHeader>
          <SidebarMenu className="gap-4">
            {thirdNav.map((nav) => (
              <SidebarMenuItem
                key={nav.name}
                className={`${selectedNav === nav.name ? "selected-nav" : ""}`}
              >
                <SidebarMenuButton
                  asChild
                  onClick={() => setSelectedNav(nav.name)}
                >
                  <a
                    href={nav.url}
                    className={
                      selectedNav === nav.name
                        ? "text-bluesky"
                        : "text-gray-500"
                    }
                  >
                    {nav.icon}
                    <span
                      className={
                        selectedNav === nav.name
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      {nav.name}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </div>

      <div className="p-4">
        <NavUser user={data.user} />
      </div>
    </>
  );
}

function DesktopSidebarContent({ isCollapsed }: { isCollapsed: boolean }) {
  const { selectedNav, setSelectedNav, isLogged, setIsLogged } =
    useContext(GlobalContext);
  return (
    <>
      <div className="py-4 mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="trackit" height={40} width={40} />
          {!isCollapsed && <span className="font-bold text-2xl">TrackIt</span>}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-0 pl-6">
        <SidebarGroup>
          <SidebarMenu className="gap-4">
            {mainNav.map((nav) => (
              <SidebarMenuItem
                key={nav.name}
                className={`${selectedNav === nav.name ? "selected-nav" : ""}`}
              >
                <SidebarMenuButton
                  asChild
                  onClick={() => setSelectedNav(nav.name)}
                >
                  <a
                    href={nav.url}
                    className={
                      selectedNav === nav.name
                        ? "text-bluesky"
                        : "text-gray-500"
                    }
                  >
                    {nav.icon}
                    <span
                      className={
                        selectedNav === nav.name
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      {nav.name}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="bg-gray-500" />
        <SidebarGroup>
          <SidebarMenu className="gap-4">
            {secondNav.map((nav) => (
              <SidebarMenuItem
                key={nav.name}
                className={`${selectedNav === nav.name ? "selected-nav" : ""}`}
              >
                <SidebarMenuButton
                  asChild
                  onClick={() => setSelectedNav(nav.name)}
                >
                  <a
                    href={nav.url}
                    className={
                      selectedNav === nav.name
                        ? "text-bluesky"
                        : "text-gray-500"
                    }
                  >
                    {nav.icon}
                    <span
                      className={
                        selectedNav === nav.name
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      {nav.name}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="bg-gray-500" />
        <SidebarGroup>
          <SidebarHeader className="uppercase text-sm font-semibold">
            Premium Tools
          </SidebarHeader>
          <SidebarMenu className="gap-4">
            {thirdNav.map((nav) => (
              <SidebarMenuItem
                key={nav.name}
                className={`${selectedNav === nav.name ? "selected-nav" : ""}`}
              >
                <SidebarMenuButton
                  asChild
                  onClick={() => setSelectedNav(nav.name)}
                >
                  <a
                    href={nav.url}
                    className={
                      selectedNav === nav.name
                        ? "text-bluesky"
                        : "text-gray-500"
                    }
                  >
                    {nav.icon}
                    <span
                      className={
                        selectedNav === nav.name
                          ? "text-gray-400"
                          : "text-gray-500"
                      }
                    >
                      {nav.name}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </div>

      <div className="p-4 pl-6 space-y-6">
        {/* <NavUser user={data.user} showDetails={!isCollapsed} /> */}
        <SidebarGroup>
          <SidebarMenu>
            {isLogged && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton className="text-gray-400">
                    <SlidersVerticalIcon />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="text-gray-400"
                    onClick={() => setIsLogged(false)}
                  >
                    <LogOutIcon />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
            {!isLogged && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="text-gray-400"
                  onClick={() => setIsLogged(true)}
                >
                  <LogInIcon />
                  <span>Login</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </div>
    </>
  );
}

function ChainButton({
  isActive,
  isNew,
  logo,
  name,
  className,
  ...props
}: ChainButtonProps) {
  return (
    <button
      className={cn(
        "group relative flex flex-col items-center justify-center rounded-xl p-4 text-center",
        isActive && "bg-gray-600",
        className
      )}
      {...props}
    >
      {isNew && (
        <span className="absolute right-2 top-2 rounded bg-emerald-500 px-1.5 py-0.5 text-xs font-medium text-white">
          NEW
        </span>
      )}
      <Image
        src={logo}
        alt={name}
        width={20}
        height={20}
        className="mb-2 text-2xl"
      />
      <span className="text-xs font-medium text-gray-50">{name}</span>
    </button>
  );
}

const data = {
  user: {
    name: "Dang Hoang Lam",
    email: "m@example.com",
    avatar: "/logo.png",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Chains",
      url: "#",
      icon: Chain,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Dexes",
      url: "#",
      icon: Scan,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Dashboard",
      url: "#",
      icon: PanelLeft,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "More",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};

const items = [
  {
    title: "Chains",
    url: "#",
    icon: Chain,
    collapsible: true,
    items: [
      {
        title: (
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/movement-mark.svg"
              alt="WarpGate"
              width={24}
              height={24}
            />
            <span>MOVE</span>
          </div>
        ),
        url: "#",
      },
      {
        title: (
          <div className="flex items-center justify-center gap-2">
            <Image src="/Aptos_mark.png" alt="Aptos" width={24} height={24} />
            <span>APT</span>
          </div>
        ),
        url: "#",
      },
    ],
  },
  {
    title: "Dexes",
    url: "#",
    icon: Scan,
    collapsible: true,
    items: [
      {
        title: (
          <div className="flex items-center justify-center gap-2">
            <Image src="/warpgate.png" alt="WarpGate" width={24} height={24} />
            <span>WarpGate</span>
          </div>
        ),
        url: "#",
      },
      {
        title: (
          <div className="flex items-center justify-center gap-2">
            <Image src="/routex.png" alt="RouteX" width={24} height={24} />
            <span>RouteX</span>
          </div>
        ),
        url: "#",
      },
    ],
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: PanelLeft,
    collapsible: false,
  },
];

const chains = [
  {
    name: "Movement",
    logo: "/chains/movement-mark.svg",
    value: "movement",
  },
  {
    name: "Sui",
    logo: "/chains/sui.svg",
    value: "sui",
  },
  {
    name: "Aptos",
    logo: "/chains/aptos.png",
    value: "aptos",
  },
  {
    name: "Viction",
    logo: "/chains/viction.svg",
    value: "viction",
  },
  {
    name: "Kaia",
    logo: "/chains/kaia.svg",
    value: "kaia",
  },
  {
    name: "Polkadot",
    logo: "/chains/polkadot.svg",
    value: "polkadot",
  },
  {
    name: "Berachain",
    logo: "/chains/berachain.png",
    value: "berachain",
  },
  {
    name: "Starknet",
    logo: "/chains/starknet.svg",
    value: "starknet",
  },

  {
    name: "Manta",
    logo: "/chains/manta.svg",
    value: "manta",
  },
  {
    name: "Ancient8",
    logo: "/chains/ancient8.svg",
    value: "ancient8",
  },
];

const mainNav = [
  {
    icon: <FlameIcon />,
    name: "Meme",
    url: "/",
  },
  {
    icon: <UsersIcon />,
    name: "New Pair",
    url: "#",
  },
  {
    icon: <ChartColumnIncreasingIcon />,
    name: "Trending",
    url: "#",
  },
  {
    icon: <DatabaseIcon />,
    name: "Holding",
    url: "#",
  },
  {
    icon: <FileChartColumnIncreasingIcon />,
    name: "Follow",
    url: "#",
  },
];

const secondNav = [
  {
    icon: <ChartSplineIcon />,
    name: "Token Analytics",
    url: "#",
  },
  {
    icon: <ViewIcon />,
    name: "Wallet Analyzer",
    url: "#",
  },
  {
    icon: <FishSymbolIcon />,
    name: "Whales Tracker",
    url: "#",
  },
  {
    icon: <RocketIcon />,
    name: "IPSO Launchpad",
    url: "#",
  },
  {
    icon: <SendIcon />,
    name: "Telegram Bot",
    url: "#",
  },
  {
    icon: <SquareStackIcon />,
    name: "Multicharts",
    url: "#",
  },
  {
    icon: <NewspaperIcon />,
    name: "News Aggregator",
    url: "#",
  },
];

const thirdNav = [
  {
    icon: <TrophyIcon />,
    name: "Top Traders",
    url: "#",
  },
  {
    icon: <MessageSquareMoreIcon />,
    name: "InsightsGPT",
    url: "#",
  },
  {
    icon: <RadarIcon />,
    name: "Dump Risk Radar",
    url: "#",
  },
  {
    icon: <ChartCandlestickIcon />,
    name: "Smart Traders Moves",
    url: "#",
  },
  {
    icon: <HandCoinsIcon />,
    name: "Hype Tracker",
    url: "#",
  },
];
