import {
  type CompatiblePublicClient,
  type CompatibleWalletClient,
  useEERC,
} from "@avalabs/eerc-sdk";
import { useEffect, useState, useRef } from "react";
import { Bounce, toast } from "react-toastify";
import { parseUnits } from "viem";
import {
  useAccount,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { SecureNestMode } from "../components/securenest/SecureNestMode";
import { Deposit } from "../components/operations/Deposit";
import { useWebComponents } from "../components/web-components";
import { ErrorBoundary } from "../components/ErrorBoundary";
import {
  CIRCUIT_CONFIG,
  CONTRACTS,
  EXPLORER_BASE_URL,
  EXPLORER_BASE_URL_TX,
} from "../config/contracts";
import { DEMO_TOKEN_ABI as erc20Abi, MAX_UINT256 } from "../pkg/constants";
import { useAppKit } from "@reown/appkit/react";
import { packPoint } from "@zk-kit/baby-jubjub";
import { formatDisplayAmount } from "../pkg/helpers";
import { RightTooltip } from "../components/Tooltip";

export function EERC() {
  useWebComponents();
  const [txHash, setTxHash] = useState<`0x${string}`>("" as `0x${string}`);
  const [showEncryptedDetails, setShowEncryptedDetails] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [transactionType, setTransactionType] = useState<string>("");
  const [approveAmountInput, setApproveAmountInput] = useState<string>("");
  const [currentSection, setCurrentSection] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const sections = [
    "System Setup & Smart Contracts & Deposit",
    "Nest Management & Encrypted Operations"
  ];

  const { data: transactionReceipt, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
    confirmations: 1,
  });
  const { disconnectAsync } = useDisconnect();
  const { open } = useAppKit();

  // Handle slider scroll
  const handleSliderScroll = () => {
    if (sliderRef.current) {
      const scrollLeft = sliderRef.current.scrollLeft;
      const sectionWidth = sliderRef.current.scrollWidth / sections.length;
      const newSection = Math.round(scrollLeft / sectionWidth);
      setCurrentSection(newSection);
    }
  };

  useEffect(() => {
    if (txHash && isSuccess && transactionReceipt) {
      toast.success(
        <div>
          <p>Transaction successful</p>
          <a
            href={`${EXPLORER_BASE_URL_TX}${transactionReceipt?.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-green underline hover:text-cyber-green/80"
          >
            See on Explorer →
          </a>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          transition: Bounce,
        }
      );

      setTxHash("" as `0x${string}`);
      setIsRegistering(false);
      setIsTransactionPending(false);
      setTransactionType("");
    }
  }, [txHash, isSuccess, transactionReceipt]);

  const { address, isConnected, isConnecting } = useAccount();

  const publicClient = usePublicClient({ chainId: avalancheFuji.id });
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract({});


  // use eerc
  const {
    owner,
    isAuditorKeySet,
    auditorPublicKey,
    isRegistered,
    isDecryptionKeySet,
    generateDecryptionKey,
    register,
    useEncryptedBalance,
    isAddressRegistered,
    publicKey,
  } = useEERC(
    publicClient as CompatiblePublicClient,
    walletClient as CompatibleWalletClient,
    CONTRACTS.EERC_CONVERTER,
    CIRCUIT_CONFIG
  );


  // use encrypted balance
  const {
    privateTransfer,
    deposit,
    withdraw,
    decimals,
    encryptedBalance,
    decryptedBalance,
    refetchBalance,
  } = useEncryptedBalance(CONTRACTS.ERC20);


  // handle private transfer
  const handlePrivateTransfer = async (to: string, amount: string) => {
    if (!isConnected) {
      console.log("Not connected");
      return;
    }

    setIsTransactionPending(true);
    setTransactionType("Private Transferring");
    try {
      const { isRegistered: isToRegistered } = await isAddressRegistered(
        to as `0x${string}`
      );
      if (!isToRegistered) {
        toast.error("Recipient is not registered");
        setIsTransactionPending(false);
        setTransactionType("");
        return;
      }

      const parsedAmount = parseUnits(amount, Number(decimals));

      const { transactionHash } = await privateTransfer(to, parsedAmount);
      setTxHash(transactionHash as `0x${string}`);
      refetchBalance();
    } catch (error) {
      console.error(error);
      toast.error("Transfer failed");
      setIsTransactionPending(false);
      setTransactionType("");
    }
  };

  // handle private deposit
  const handlePrivateDeposit = async (amount: string) => {
    if (!isConnected) {
      console.log("Not connected");
      return;
    }

    setIsTransactionPending(true);
    setTransactionType("Private Depositing");
    try {
      if (!erc20Decimals) {
        console.log("No decimals");
        setIsTransactionPending(false);
        setTransactionType("");
        return;
      }

      const parsedAmount = parseUnits(amount, erc20Decimals);

      const { transactionHash } = await deposit(parsedAmount);
      setTxHash(transactionHash as `0x${string}`);
      refetchBalance();
      refetchErc20Balance();
    } catch (error) {
      console.error(error);
      toast.error("Deposit failed");
      setIsTransactionPending(false);
      setTransactionType("");
    }
  };

  // handle private withdraw
  const handlePrivateWithdraw = async (amount: string) => {
    if (!isConnected) {
      console.log("Not connected");
      return;
    }

    setIsTransactionPending(true);
    setTransactionType("Private Withdrawing");
    try {
      if (!decimals) {
        console.log("No decimals");
        setIsTransactionPending(false);
        setTransactionType("");
        return;
      }

      const parsedAmount = parseUnits(amount, Number(decimals));

      const { transactionHash } = await withdraw(parsedAmount);
      setTxHash(transactionHash as `0x${string}`);
      refetchBalance();
      refetchErc20Balance();
    } catch (error) {
      console.error(error);
      toast.error("Withdrawal failed");
      setIsTransactionPending(false);
      setTransactionType("");
    }
  };

  const { data: erc20Decimals } = useReadContract({
    abi: erc20Abi,
    functionName: "decimals",
    args: [],
    query: { enabled: !!address },
    address: CONTRACTS.ERC20,
  }) as { data: number };

  const { data: erc20Balance, refetch: refetchErc20Balance } = useReadContract({
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
    address: CONTRACTS.ERC20,
  }) as { data: bigint; refetch: () => void };

  const { data: erc20Symbol } = useReadContract({
    abi: erc20Abi,
    functionName: "symbol",
    args: [],
    query: { enabled: !!address },
    address: CONTRACTS.ERC20,
  }) as { data: string };

  const { data: approveAmount, refetch: refetchApproveAmount } = useReadContract({
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, CONTRACTS.EERC_CONVERTER],
    query: { enabled: !!address },
    address: CONTRACTS.ERC20,
  }) as { data: bigint; refetch: () => void };

  const { data: timeUntilNextRequest, refetch: refetchTimeUntilNextRequest } = useReadContract({
    abi: erc20Abi,
    functionName: "timeUntilNextRequest",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
    address: CONTRACTS.ERC20,
  }) as { data: bigint; refetch: () => void };




  return (
    <>
      <style>{`
        .slider-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header with Logo and Wallet Connection */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Title */}
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="SecureNest Logo"
                  className="w-12 h-12 rounded-lg"
                />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    SecureNest
                  </h1>
                  <p className="text-sm text-gray-300">
                    Secure encrypted token savings
                  </p>
                </div>
              </div>

              {/* Wallet Connection */}
              <div className="flex items-center gap-4">
                {isConnected ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-300">Connected</p>
                      <p className="text-xs text-gray-400 font-mono">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      onClick={async () => {
                        if (!isConnected) {
                          console.log("Not connected");
                          return;
                        }
                        disconnectAsync();
                      }}
                    >
                      🔌 Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isConnected}
                    onClick={() => {
                      if (isConnected) {
                        console.log("Already connected");
                        return;
                      }

                      open().then(() => {
                        console.log("Connected");
                      });
                    }}
                  >
                    {isConnecting ? "🔄 Connecting..." : "🔗 Connect Wallet"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
                SecureNest
              </h1>
              <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
                Create secure nests for encrypted token savings with time-locked withdrawals and multi-participant support.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <span className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 text-sm px-4 py-2 rounded-full border border-purple-500/30">
                  🔒 Privacy-Preserving
                </span>
                <span className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 text-sm px-4 py-2 rounded-full border border-blue-500/30">
                  ⏰ Time-Locked
                </span>
                <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 text-sm px-4 py-2 rounded-full border border-green-500/30">
                  🛡️ ZK-Powered
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Description Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-gray-300 text-lg max-w-4xl mx-auto">
                SecureNest works by creating a Nest during a specified time period with the possibility of integrating other participants into that Nest.
                During this time, savings are deposited in encrypted tokens, and once the agreed time has passed and participants have agreed to withdraw the funds,
                each one can withdraw their funds from the encrypted token.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                <div className="text-4xl mb-4">🏗️</div>
                <h3 className="text-xl font-bold text-white mb-3">Create Nest</h3>
                <p className="text-gray-300">
                  Create a secure nest with multiple participants and set a time period for locked savings.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-3">Deposit Savings</h3>
                <p className="text-gray-300">
                  Add encrypted tokens to your nest at any time during the active period.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="text-xl font-bold text-white mb-3">Withdraw When Ready</h3>
                <p className="text-gray-300">
                  Once the time lock expires and participants agree, withdraw your encrypted tokens.
                </p>
              </div>
            </div>
          </div>

          {/* Sliding Window Section */}
          <div className="bg-black/10 backdrop-blur-sm border-b border-purple-500/20 mb-8">
            <div className="max-w-7xl mx-auto px-6 py-6">
              {/* Section Index Indicator */}
              <div className="text-center mb-6">
                {/* Navigation Dots */}
                <div className="flex justify-center gap-2 mb-4">
                  {sections.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (sliderRef.current) {
                          const sectionWidth = sliderRef.current.scrollWidth / sections.length;
                          sliderRef.current.scrollTo({
                            left: index * sectionWidth,
                            behavior: 'smooth'
                          });
                        }
                      }}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentSection
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 scale-125'
                        : 'bg-white/30 hover:bg-white/50'
                        }`}
                    />
                  ))}
                </div>

                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">

                  <span className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    {sections[currentSection]}
                  </span>
                  <span className="text-sm text-gray-400">
                    ({currentSection + 1} of {sections.length})
                  </span>
                </div>
              </div>

              {/* Sliding Window Container */}
              <div
                ref={sliderRef}
                className="slider-container flex overflow-x-auto gap-6 pb-4"
                onScroll={handleSliderScroll}
                style={{
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {/* First Section: System Setup & Smart Contracts & Deposit */}
                <div className="flex-shrink-0 w-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10" style={{ scrollSnapAlign: 'start' }}>
                  {/* System Setup & Status */}
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-white mb-4 text-center">⚙️ System Setup & Status</h2>

                    {/* Status Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-3 border border-blue-500/30">
                        <h3 className="text-blue-300 font-bold text-sm mb-1">Wallet</h3>
                        <p className="text-white text-xs">
                          {isConnected ? "✅ Connected" : "❌ Not Connected"}
                        </p>
                        {isConnected && address && (
                          <p className="text-gray-300 text-xs mt-1">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </p>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-purple-500/30">
                        <h3 className="text-purple-300 font-bold text-sm mb-1">eERC Converter</h3>
                        <p className="text-white text-xs">
                          {publicClient && walletClient ? "✅ Ready" : "❌ Not Ready"}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-yellow-500/30">
                        <h3 className="text-yellow-300 font-bold text-sm mb-1">Decryption Key</h3>
                        <p className="text-white text-xs">
                          {isDecryptionKeySet ? "✅ Generated" : "❌ Not Generated"}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-green-500/30">
                        <h3 className="text-green-300 font-bold text-sm mb-1">Registration</h3>
                        <p className="text-white text-xs">
                          {isRegistered ? "✅ Registered" : "❌ Not Registered"}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Decryption Key */}
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h3 className="text-purple-300 font-bold text-sm mb-2">🔑 Generate Decryption Key</h3>
                        <p className="text-gray-300 text-xs mb-3">
                          Create a local encryption key for your wallet
                        </p>
                        <button
                          type="button"
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                          disabled={isDecryptionKeySet}
                          onClick={async () => {
                            if (!isConnected) {
                              console.log("Not connected");
                              return;
                            }

                            generateDecryptionKey()
                              .then(() => {
                                toast.success("🔑 Decryption key generated!", {
                                  position: "top-right",
                                  autoClose: 5000,
                                  hideProgressBar: true,
                                  closeOnClick: true,
                                  pauseOnHover: false,
                                  draggable: true,
                                  progress: undefined,
                                  transition: Bounce,
                                });
                              })
                              .catch((error) => {
                                toast.error("Error generating decryption key");
                                console.error(error);
                              });
                          }}
                        >
                          {isDecryptionKeySet
                            ? "✅ Key Generated"
                            : "🔑 Generate Key"}
                        </button>
                      </div>

                      {/* Registration */}
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4 border border-green-500/20">
                        <h3 className="text-green-300 font-bold text-sm mb-2">🧾 Register Wallet</h3>
                        <p className="text-gray-300 text-xs mb-3">
                          Register your wallet to use SecureNest
                        </p>
                        <button
                          type="button"
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                          disabled={isRegistered || isRegistering || !isDecryptionKeySet}
                          onClick={async () => {
                            setIsRegistering(true);
                            try {
                              const { transactionHash } = await register();
                              setTxHash(transactionHash as `0x${string}`);
                            } catch (error) {
                              console.error(error);
                              toast.error("Registration failed");
                              setIsRegistering(false);
                            }
                          }}
                        >
                          {isRegistered ? (
                            "✅ Registered"
                          ) : isRegistering ? (
                            <div className="flex flex-col items-center gap-1">
                              <span>🔄 Registering...</span>
                              {txHash && (
                                <span className="text-xs text-gray-300">
                                  {txHash.slice(0, 6)}...{txHash.slice(-4)}
                                </span>
                              )}
                            </div>
                          ) : (
                            "📝 Register Wallet"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Smart Contracts Section */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">📜 Smart Contracts</h2>

                    {/* Detailed Contract Information */}
                    <div className="space-y-4">
                      {/* eERC Converter Contract Information */}
                      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 border border-blue-500/30 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-xl">🔧</div>
                          <h3 className="text-lg font-bold text-blue-300">eERC20 Converter Contract</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="bg-black/20 rounded p-2 border border-blue-500/20">
                              <div className="text-blue-300 font-semibold text-xs mb-1">Contract Address</div>
                              <div className="text-white font-mono text-xs break-all bg-black/30 rounded p-1">
                                {CONTRACTS.EERC_CONVERTER}
                              </div>
                              <a
                                href={`${EXPLORER_BASE_URL}${CONTRACTS.EERC_CONVERTER}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs underline mt-1 inline-block"
                              >
                                View on Explorer →
                              </a>
                            </div>

                            <div className="bg-black/20 rounded p-2 border border-blue-500/20">
                              <div className="text-blue-300 font-semibold text-xs mb-1">Owner</div>
                              <div className="text-white font-mono text-xs break-all">
                                {owner ?? "N/A"}
                              </div>
                            </div>

                            <div className="bg-black/20 rounded p-2 border border-blue-500/20">
                              <div className="text-blue-300 font-semibold text-xs mb-1">Mode</div>
                              <div className="text-white text-xs">
                                Converter with SecureNest
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="bg-black/20 rounded p-2 border border-blue-500/20">
                              <div className="text-blue-300 font-semibold text-xs mb-1">Auditor Key Status</div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isAuditorKeySet ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-white text-xs">
                                  {isAuditorKeySet ? "Set" : "Not Set"}
                                </span>
                              </div>
                            </div>

                            <div className="bg-black/20 rounded p-2 border border-blue-500/20">
                              <div className="text-blue-300 font-semibold text-xs mb-1">Auditor Public Key</div>
                              <div className="text-white font-mono text-xs break-all bg-black/30 rounded p-1">
                                {isAuditorKeySet
                                  ? `0x${packPoint(auditorPublicKey as [bigint, bigint]).toString(16)}`
                                  : "N/A"}
                              </div>
                            </div>

                            <div className="bg-black/20 rounded p-2 border border-blue-500/20">
                              <div className="text-blue-300 font-semibold text-xs mb-1">User Public Key</div>
                              <div className="text-white font-mono text-xs break-all bg-black/30 rounded p-1">
                                {!!publicKey.length && publicKey[0] !== 0n && publicKey[1] !== 0n
                                  ? `0x${packPoint(publicKey as [bigint, bigint]).toString(16)}`
                                  : "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ERC-20 Token Information */}
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 border border-green-500/30 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-xl">🪙</div>
                          <h3 className="text-lg font-bold text-green-300">ERC-20 Token Details</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="bg-black/20 rounded p-2 border border-green-500/20">
                              <div className="text-green-300 font-semibold text-xs mb-1">Token Decimals</div>
                              <div className="text-white text-sm font-bold">
                                {erc20Decimals}
                              </div>
                            </div>

                            <div className="bg-black/20 rounded p-2 border border-green-500/20">
                              <div className="text-green-300 font-semibold text-xs mb-1">Your Balance</div>
                              <div className="text-white text-sm font-bold">
                                {formatDisplayAmount(erc20Balance ?? 0n, erc20Decimals)} {erc20Symbol?.replace('AVAXTEST', 'AVAXTEST')}
                              </div>
                              <RightTooltip
                                content="You can only request test tokens once every hour."
                                id="request-erc20-tooltip"
                              >
                                <button
                                  className={`mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-1 px-3 rounded text-xs transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${timeUntilNextRequest !== 0n ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title={`Request ERC-20 in ${timeUntilNextRequest} seconds`}
                                  onClick={async () => {
                                    const transactionHash = await writeContractAsync({
                                      abi: erc20Abi,
                                      functionName: "requestTokens",
                                      args: [],
                                      address: CONTRACTS.ERC20,
                                      account: address as `0x${string}`,
                                    });
                                    await refetchErc20Balance();
                                    await refetchTimeUntilNextRequest();
                                    console.log("[TRANSACTION HASH]", transactionHash);

                                    toast.success("ERC-20 requested successfully");
                                  }}
                                  disabled={timeUntilNextRequest !== 0n}
                                  type="button"
                                >
                                  {timeUntilNextRequest !== 0n ? `Wait ${timeUntilNextRequest}s` : "Request Tokens"}
                                </button>
                              </RightTooltip>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="bg-black/20 rounded p-2 border border-green-500/20">
                              <div className="text-green-300 font-semibold text-xs mb-1">Current Allowance</div>
                              <div className="text-white text-sm font-bold">
                                {approveAmount === MAX_UINT256
                                  ? "MAX"
                                  : `${formatDisplayAmount(approveAmount ?? 0n, erc20Decimals)} ${erc20Symbol?.replace('AVAXTEST', 'AVAXTEST')}`}
                              </div>

                              <div className="mt-2 space-y-2">
                                <div className="flex gap-1">
                                  <input
                                    type="number"
                                    placeholder="Amount"
                                    value={approveAmountInput}
                                    onChange={(e) => setApproveAmountInput(e.target.value)}
                                    className="flex-1 bg-black/30 border border-green-500/30 rounded px-2 py-1 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-green-400"
                                  />
                                  <span className="text-gray-300 text-xs flex items-center px-1">{erc20Symbol?.replace('AVAXTEST', 'AVAXTEST')}</span>
                                </div>

                                <div className="flex gap-1">
                                  <RightTooltip
                                    content="Approve a specific amount of tokens."
                                    id="approve-specific-tooltip"
                                  >
                                    <button
                                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-1 px-2 rounded text-xs transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                      onClick={async () => {
                                        if (!approveAmountInput || !erc20Decimals) return;
                                        const amount = parseUnits(approveAmountInput, erc20Decimals);
                                        await writeContractAsync({
                                          abi: erc20Abi,
                                          functionName: "approve",
                                          args: [CONTRACTS.EERC_CONVERTER, amount],
                                          address: CONTRACTS.ERC20,
                                          account: address as `0x${string}`,
                                        });
                                        await refetchApproveAmount();
                                        setApproveAmountInput("");
                                      }}
                                      disabled={!approveAmountInput || !erc20Decimals}
                                      type="button"
                                    >
                                      Approve
                                    </button>
                                  </RightTooltip>

                                  <RightTooltip
                                    content="Approve the maximum amount of tokens."
                                    id="approve-max-tooltip"
                                  >
                                    <button
                                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-1 px-2 rounded text-xs transition-all duration-200 transform hover:scale-105"
                                      onClick={async () => {
                                        await writeContractAsync({
                                          abi: erc20Abi,
                                          functionName: "approve",
                                          args: [CONTRACTS.EERC_CONVERTER, MAX_UINT256],
                                          address: CONTRACTS.ERC20,
                                          account: address as `0x${string}`,
                                        });
                                        await refetchApproveAmount();
                                      }}
                                      type="button"
                                    >
                                      Max
                                    </button>
                                  </RightTooltip>
                                </div>
                              </div>
                            </div>

                            <div className="bg-black/20 rounded p-2 border border-green-500/20">
                              <div className="text-green-300 font-semibold text-xs mb-1">Contract Address</div>
                              <div className="text-white font-mono text-xs break-all bg-black/30 rounded p-1">
                                {CONTRACTS.ERC20}
                              </div>
                              <a
                                href={`${EXPLORER_BASE_URL}${CONTRACTS.ERC20}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300 text-xs underline mt-1 inline-block"
                              >
                                View on Explorer →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Contract Overview Cards */}
                      <div className="grid md:grid-cols-1 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 group relative">
                          <h3 className="text-lg font-bold text-purple-300 mb-3">TimeLock Nest</h3>
                          <div className="text-gray-300 text-sm font-mono break-all mb-3">
                            {CONTRACTS.TIMELOCK_NEST}
                          </div>
                          <a
                            href={`${EXPLORER_BASE_URL}${CONTRACTS.TIMELOCK_NEST}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 text-sm underline"
                          >
                            View on Explorer →
                          </a>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* Encrypted Operations (Deposit) Section */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">🔒 Encrypted Deposit</h2>

                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                      {/* Encrypted Balance Section */}
                      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20 mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🔐</div>
                            <div>
                              <h3 className="text-indigo-300 font-bold text-sm">Encrypted Balance</h3>
                              <p className="text-indigo-300 font-bold text-lg">
                                {formatDisplayAmount(decryptedBalance)} e.{erc20Symbol?.replace('AVAXTEST', 'AVAXTEST')}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-1.5 px-3 rounded-md transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs"
                            disabled={encryptedBalance.length === 0}
                            onClick={() => {
                              setShowEncryptedDetails(!showEncryptedDetails);
                            }}
                          >
                            {showEncryptedDetails ? "Hide" : "Show"} Points
                          </button>
                        </div>

                        {/* Encrypted Points Display - Compact */}
                        {showEncryptedDetails && encryptedBalance.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="bg-black/20 rounded-md p-2 border border-indigo-500/20">
                              <h4 className="text-indigo-300 font-bold text-xs mb-1">C1</h4>
                              <div className="text-xs text-gray-300 font-mono">
                                x: {encryptedBalance[0]?.toString() || '0'}
                              </div>
                              <div className="text-xs text-gray-300 font-mono">
                                y: {encryptedBalance[1]?.toString() || '0'}
                              </div>
                            </div>
                            <div className="bg-black/20 rounded-md p-2 border border-indigo-500/20">
                              <h4 className="text-indigo-300 font-bold text-xs mb-1">C2</h4>
                              <div className="text-xs text-gray-300 font-mono">
                                x: {encryptedBalance[2]?.toString() || '0'}
                              </div>
                              <div className="text-xs text-gray-300 font-mono">
                                y: {encryptedBalance[3]?.toString() || '0'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Deposit Section */}
                      <div className="text-center">
                        <div className="text-6xl mb-6">💰</div>
                        <h3 className="text-xl font-bold text-white mb-4">Deposit Encrypted Tokens</h3>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                          Deposit your tokens into the encrypted system for secure, private transactions.
                        </p>

                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30 max-w-md mx-auto">
                          <ErrorBoundary>
                            <Deposit
                              handlePrivateDeposit={handlePrivateDeposit}
                              isDecryptionKeySet={isDecryptionKeySet}
                            />
                          </ErrorBoundary>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-8">
                    <p className="text-gray-400 text-sm mb-4">
                      Deployed on <span className="text-purple-400 font-semibold">Avalanche Fuji Testnet</span> •
                      <a href="https://docs.avacloud.io/encrypted-erc" target="_blank" rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline ml-1">
                        Learn More →
                      </a>
                    </p>
                  </div>
                </div>

                {/* Second Section: Nest Management & Withdraw & Transfer */}
                <div className="flex-shrink-0 w-full bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10" style={{ scrollSnapAlign: 'start' }}>
                  {/* Nest Management Section */}
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">🏠 Nest Management</h2>

                    <div className="text-center">


                      <div className="grid md:grid-cols-2 gap-6 mt-8">
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
                          <div className="text-3xl mb-4">🏗️</div>
                          <h4 className="text-lg font-bold text-white mb-3">Create New Nest</h4>
                          <p className="text-gray-300 text-sm">
                            Set up a new time-locked nest with multiple participants and custom parameters.
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
                          <div className="text-3xl mb-4">👥</div>
                          <h4 className="text-lg font-bold text-white mb-3">Manage Participants</h4>
                          <p className="text-gray-300 text-sm">
                            Add or remove participants from your nests and manage permissions.
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                          <div className="text-3xl mb-4">📊</div>
                          <h4 className="text-lg font-bold text-white mb-3">View Nest Status</h4>
                          <p className="text-gray-300 text-sm">
                            Monitor your nests, view balances, and track time-lock progress.
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
                          <div className="text-3xl mb-4">⚙️</div>
                          <h4 className="text-lg font-bold text-white mb-3">Configure Settings</h4>
                          <p className="text-gray-300 text-sm">
                            Customize nest parameters, time locks, and withdrawal conditions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Encrypted Operations (Withdraw & Transfer) Section */}
                  <div>
                    <ErrorBoundary>
                      <SecureNestMode
                        showEncryptedDetails={showEncryptedDetails}
                        setShowEncryptedDetails={setShowEncryptedDetails}
                        handlePrivateDeposit={handlePrivateDeposit}
                        handlePrivateWithdraw={handlePrivateWithdraw}
                        isDecryptionKeySet={isDecryptionKeySet}
                        publicKey={publicKey}
                        owner={owner}
                        isAuditorKeySet={isAuditorKeySet}
                        auditorPublicKey={auditorPublicKey}
                        encryptedBalance={encryptedBalance}
                        decryptedBalance={decryptedBalance}
                        refetchBalance={refetchBalance}
                        handlePrivateTransfer={handlePrivateTransfer}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>

            </div>
          </div>





          {/* Transaction Pending Indicator */}
          {isTransactionPending && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-8 mb-8 border border-yellow-500/30">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {transactionType} in progress...
                </h3>
                {txHash && (
                  <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                    <p className="text-gray-300 mb-3">Transaction Hash:</p>
                    <div className="bg-black/40 rounded-lg p-4 mb-4">
                      <span className="text-yellow-300 font-mono text-sm break-all">
                        {txHash}
                      </span>
                    </div>
                    <a
                      href={`${EXPLORER_BASE_URL_TX}${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      🔍 View on Explorer →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
