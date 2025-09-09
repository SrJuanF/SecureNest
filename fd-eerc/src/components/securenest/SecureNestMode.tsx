import { packPoint } from "@zk-kit/baby-jubjub";
import { toast } from "react-toastify";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS } from "../../config/contracts";
import { MAX_UINT256, DEMO_TOKEN_ABI as erc20Abi } from "../../pkg/constants";
import { TIMELOCK_NEST_ABI } from "../../pkg/TimeLockNestABI";
import { formatDisplayAmount } from "../../pkg/helpers";
import { RightTooltip } from "../Tooltip";
import { CurvePoint } from "../ecc/CurvePoint";
import { Operations } from "../operations/Operations";
import { useState, useEffect } from "react";

const eERC_CONVERTER_ADDRESS = CONTRACTS.EERC_CONVERTER;
const ERC20_ADDRESS = CONTRACTS.ERC20;
const TIMELOCK_NEST_ADDRESS = CONTRACTS.TIMELOCK_NEST;

interface SecureNestModeProps {
    showEncryptedDetails: boolean;
    setShowEncryptedDetails: (show: boolean) => void;
    handlePrivateDeposit: (amount: string) => Promise<void>;
    handlePrivateWithdraw: (amount: string) => Promise<void>;
    isDecryptionKeySet: boolean;
    publicKey: bigint[];
    owner: string;
    isAuditorKeySet: boolean;
    auditorPublicKey: bigint[];
    encryptedBalance: bigint[];
    decryptedBalance: bigint;
    refetchBalance: () => void;
    handlePrivateTransfer: (to: string, amount: string) => Promise<void>;
}

export function SecureNestMode({
    showEncryptedDetails,
    setShowEncryptedDetails,
    handlePrivateDeposit,
    handlePrivateWithdraw,
    isDecryptionKeySet,
    publicKey,
    owner,
    isAuditorKeySet,
    auditorPublicKey,
    encryptedBalance,
    decryptedBalance,
    refetchBalance,
    handlePrivateTransfer,
}: SecureNestModeProps) {
    const { address } = useAccount();
    const { writeContractAsync } = useWriteContract({});

    // Estados para el nest
    const [nestId, setNestId] = useState<number | null>(null);
    const [unlockTime, setUnlockTime] = useState<number>(0);
    const [nestWithdrawn, setNestWithdrawn] = useState<boolean>(false);
    const [requiredConfirmations, setRequiredConfirmations] = useState<number>(0);
    const [currentConfirmations, setCurrentConfirmations] = useState<number>(0);
    const [canWithdraw, setCanWithdraw] = useState<boolean>(false);
    const [canWithdrawTimeLock, setCanWithdrawTimeLock] = useState<boolean>(false);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [nestOwners, setNestOwners] = useState<string[]>([]);

    // Estados para la creación de nest personalizado
    const [unlockTimeInput, setUnlockTimeInput] = useState<string>("");
    const [requiredInput, setRequiredInput] = useState<string>("");
    const [ownersInput, setOwnersInput] = useState<string>("");

    // Obtener el nest del usuario
    const { data: userNestId, refetch: refetchUserNest } = useReadContract({
        abi: TIMELOCK_NEST_ABI,
        functionName: "getUserNest",
        args: address ? [address] : undefined,
        query: { enabled: !!address },
        address: TIMELOCK_NEST_ADDRESS,
    }) as { data: bigint; refetch: () => void };

    // Leer información del nest si existe
    const { data: nestInfo, refetch: refetchNestInfo } = useReadContract({
        abi: TIMELOCK_NEST_ABI,
        functionName: "getInfoNest",
        args: nestId ? [BigInt(nestId)] : undefined,
        query: { enabled: !!nestId && !!address },
        address: TIMELOCK_NEST_ADDRESS,
    }) as { data: [string[], bigint, boolean, bigint, bigint]; refetch: () => void };

    // Actualizar nestId cuando se obtenga el ID del usuario
    useEffect(() => {
        if (userNestId && Number(userNestId) > 0) {
            setNestId(Number(userNestId));
        } else {
            setNestId(null);
        }
    }, [userNestId]);

    // Actualizar estados cuando cambie la información del nest
    useEffect(() => {
        if (nestInfo) {
            const [owners, unlock, withdrawn, required, confirmations] = nestInfo;
            setNestOwners(owners);
            setUnlockTime(Number(unlock));
            setNestWithdrawn(withdrawn);
            setRequiredConfirmations(Number(required));
            setCurrentConfirmations(Number(confirmations));

            const currentTime = Math.floor(Date.now() / 1000);
            const canWithdrawNow = currentTime >= Number(unlock) && Number(confirmations) >= Number(required);
            const canWithdrawTimeLockNow = currentTime >= Number(unlock) && !withdrawn;
            setCanWithdraw(canWithdrawNow);
            setCanWithdrawTimeLock(canWithdrawTimeLockNow);

            if (Number(unlock) > currentTime) {
                setTimeRemaining(Number(unlock) - currentTime);
            } else {
                setTimeRemaining(0);
            }
        }
    }, [nestInfo]);

    // Timer para actualizar el tiempo restante
    useEffect(() => {
        if (timeRemaining > 0) {
            const timer = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setCanWithdraw(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeRemaining]);

    const { data: timeUntilNextRequest, refetch: refetchTimeUntilNextRequest } =
        useReadContract({
            abi: erc20Abi,
            functionName: "timeUntilNextRequest",
            args: [address as `0x${string}`],
            query: { enabled: !!address },
            address: ERC20_ADDRESS,
        }) as { data: bigint; refetch: () => void };

    const { data: erc20Balance, refetch: refetchErc20Balance } = useReadContract({
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
        query: { enabled: !!address },
        address: ERC20_ADDRESS,
    }) as { data: bigint; refetch: () => void };

    const { data: approveAmount, refetch: refetchApproveAmount } =
        useReadContract({
            abi: erc20Abi,
            functionName: "allowance",
            args: [address as `0x${string}`, eERC_CONVERTER_ADDRESS],
            query: { enabled: !!address },
            address: ERC20_ADDRESS,
        }) as { data: bigint; refetch: () => void };

    const { data: erc20Symbol } = useReadContract({
        abi: erc20Abi,
        functionName: "symbol",
        args: [],
        query: { enabled: !!address },
        address: ERC20_ADDRESS,
    }) as { data: string };

    const { data: erc20Decimals } = useReadContract({
        abi: erc20Abi,
        functionName: "decimals",
        args: [],
        query: { enabled: !!address },
        address: ERC20_ADDRESS,
    }) as { data: number };

    // Función para crear un nuevo nest
    const handleCreateNest = async (unlockTimeInMinutes: number) => {
        if (!address) return;

        const unlockTimestamp = Math.floor(Date.now() / 1000) + (unlockTimeInMinutes * 60);
        const owners = [address]; // Solo el usuario actual por ahora
        const required = 1; // Solo requiere 1 confirmación

        try {
            const txHash = await writeContractAsync({
                abi: TIMELOCK_NEST_ABI,
                functionName: "_storeNest",
                args: [owners, BigInt(unlockTimestamp), BigInt(required), BigInt(0)],
                address: TIMELOCK_NEST_ADDRESS,
                account: address as `0x${string}`,
            });

            toast.success(`Nest created successfully! Transaction: ${txHash}`);
            refetchUserNest();
            refetchNestInfo();
        } catch (error) {
            console.error("Error creating nest:", error);
            toast.error("Error al crear el nest");
        }
    };

    // Función para crear un nest personalizado
    const handleCreateCustomNest = async () => {
        if (!address || !unlockTimeInput || !requiredInput) return;

        const unlockTimeInMinutes = parseInt(unlockTimeInput);
        const required = parseInt(requiredInput);
        const unlockTimestamp = Math.floor(Date.now() / 1000) + (unlockTimeInMinutes * 60);

        // Procesar owners del input
        let owners: `0x${string}`[] = [];
        if (ownersInput.trim()) {
            const inputOwners = ownersInput
                .split(',')
                .map(addr => addr.trim())
                .filter(addr => addr && addr.startsWith('0x') && addr.length === 42)
                .map(addr => addr as `0x${string}`);
            owners = inputOwners;
        }

        try {
            const txHash = await writeContractAsync({
                abi: TIMELOCK_NEST_ABI,
                functionName: "_storeNest",
                args: [owners, BigInt(unlockTimestamp), BigInt(required), BigInt(0)],
                address: TIMELOCK_NEST_ADDRESS,
                account: address as `0x${string}`,
            });

            toast.success(`Custom nest created successfully! Transaction: ${txHash}`);
            refetchUserNest();
            refetchNestInfo();

            // Limpiar inputs
            setUnlockTimeInput("");
            setRequiredInput("");
            setOwnersInput("");
        } catch (error) {
            console.error("Error creating custom nest:", error);
            toast.error("Error al crear el nest personalizado");
        }
    };

    // Función para retirar del nest
    const handleNestWithdraw = async () => {
        if (!nestId || !canWithdrawTimeLock) return;

        try {
            const txHash = await writeContractAsync({
                abi: TIMELOCK_NEST_ABI,
                functionName: "withdraw",
                args: [BigInt(nestId)],
                address: TIMELOCK_NEST_ADDRESS,
                account: address as `0x${string}`,
            });

            toast.success(`Nest withdrawal successful! Transaction: ${txHash}`);
            refetchNestInfo();
        } catch (error) {
            console.error("Error withdrawing from nest:", error);
            toast.error("Error al retirar del nest");
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    };

    return (
        <>
            {/* Nest Management Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">


                {/* Encrypted Balance Section */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4 border border-indigo-500/20 mb-4">
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
                                <CurvePoint
                                    x={encryptedBalance[0] ?? 0}
                                    y={encryptedBalance[1] ?? 0}
                                    onChange={() => { }} // Empty function
                                    label={"C1"}
                                    shouldCollapse={false}
                                />
                            </div>
                            <div className="bg-black/20 rounded-md p-2 border border-indigo-500/20">
                                <h4 className="text-indigo-300 font-bold text-xs mb-1">C2</h4>
                                <CurvePoint
                                    x={encryptedBalance[2] ?? 0}
                                    y={encryptedBalance[3] ?? 0}
                                    onChange={() => { }} // Empty function
                                    label={"C2"}
                                    shouldCollapse={false}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Nest Status */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-purple-500/30">
                        <h3 className="text-purple-300 font-bold mb-1 text-xs">Nest ID</h3>
                        <p className="text-white text-sm">
                            {nestId ? `#${nestId}` : "No nest"}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-3 border border-blue-500/30">
                        <h3 className="text-blue-300 font-bold mb-1 text-xs">Status</h3>
                        <p className="text-white text-sm">
                            {nestWithdrawn ? "✅ Withdrawn" : nestId ? "🔒 Active" : "❌ No nest"}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-3 border border-green-500/30">
                        <h3 className="text-green-300 font-bold mb-1 text-xs">Can Withdraw</h3>
                        <p className="text-white text-sm">
                            {canWithdraw ? "✅ Yes" : "❌ No"}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg p-3 border border-yellow-500/30">
                        <h3 className="text-yellow-300 font-bold mb-1 text-xs">Time Remaining</h3>
                        <p className="text-white text-xs">
                            {timeRemaining > 0 ? formatTime(timeRemaining) : "Ready"}
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-3 border border-blue-500/30">
                        <h3 className="text-blue-300 font-bold mb-1 text-xs">Confirmations</h3>
                        <p className="text-white text-xs">
                            {currentConfirmations}/{requiredConfirmations}
                        </p>
                        <p className="text-blue-300 text-xs mt-1">
                            {currentConfirmations >= requiredConfirmations ? "✅" : "❌"}
                        </p>
                    </div>
                </div>

                {nestId && !nestWithdrawn && (
                    <div className="mb-6 bg-black/20 rounded-xl p-6 border border-white/10">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-gray-300 font-bold mb-2">Unlock Time</h4>
                                <p className="text-white">{new Date(unlockTime * 1000).toLocaleString()}</p>
                            </div>
                            <div>
                                <h4 className="text-gray-300 font-bold mb-2">Confirmations</h4>
                                <p className="text-white">{currentConfirmations}/{requiredConfirmations}</p>
                            </div>
                        </div>
                        {nestOwners.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-gray-300 font-bold mb-2">Participants</h4>
                                <div className="flex flex-wrap gap-2">
                                    {nestOwners.map((owner, index) => (
                                        <span key={index} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">
                                            {owner.slice(0, 6)}...{owner.slice(-4)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Create Nest */}
                {(!nestId || nestWithdrawn) && (
                    <div className="text-center">
                        <div className="text-6xl mb-6">
                            {nestWithdrawn ? "🎉" : "🏗️"}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">
                            {nestWithdrawn ? "Nest Successfully Withdrawn" : "Create Your Secure Nest"}
                        </h3>
                        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                            {nestWithdrawn
                                ? "Your nest has been successfully withdrawn. You can create a new nest anytime."
                                : "Create a new nest to lock your encrypted tokens for a specified time period. You can only have one active nest at a time."
                            }
                        </p>

                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 max-w-2xl mx-auto">
                            <h4 className="text-lg font-bold text-purple-300 mb-4">Nest Configuration</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Unlock Time (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="525600"
                                        placeholder="60"
                                        className="w-full bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 outline-none font-mono transition-all duration-200 placeholder:text-purple-300 placeholder:opacity-100"
                                        onChange={(e) => setUnlockTimeInput(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Required Confirmations
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        placeholder="1"
                                        className="w-full bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 outline-none font-mono transition-all duration-200 placeholder:text-purple-300 placeholder:opacity-100"
                                        onChange={(e) => setRequiredInput(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Owners
                                </label>
                                <input
                                    type="text"
                                    placeholder="0x1234..., 0x5678... (separated by commas, spaces allowed)"
                                    className="w-full bg-gradient-to-r from-slate-800/50 to-slate-700/50 text-white px-4 py-2 rounded-lg border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 outline-none font-mono transition-all duration-200 placeholder:text-purple-300 placeholder:opacity-100"
                                    onChange={(e) => setOwnersInput(e.target.value)}
                                />
                            </div>

                            <button
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                onClick={handleCreateCustomNest}
                                disabled={!unlockTimeInput || !requiredInput || !address}
                            >
                                🏗️ Create Custom Nest
                            </button>
                        </div>


                    </div>
                )}

                {/* Withdraw Nest */}
                {nestId && canWithdrawTimeLock && (
                    <div className="text-center">
                        <div className="text-6xl mb-6">✅</div>
                        <h3 className="text-2xl font-bold text-white mb-4">Nest Ready for Withdrawal!</h3>
                        <p className="text-gray-300 mb-8">
                            Your nest has reached its unlock time. You can now withdraw from the TimeLockNest (this will increment confirmations).
                        </p>
                        <button
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            onClick={handleNestWithdraw}
                            disabled={!address}
                        >
                            💰 Withdraw from Nest
                        </button>
                    </div>
                )}

                {/* Locked Nest */}
                {nestId && !canWithdrawTimeLock && !nestWithdrawn && (
                    <div className="text-center">
                        <div className="text-6xl mb-6">⏳</div>
                        <h3 className="text-2xl font-bold text-white mb-4">Nest is Locked</h3>
                        <p className="text-gray-300 mb-4">
                            Your nest is currently locked. Wait for the unlock time to withdraw from the TimeLockNest.
                        </p>
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30 max-w-md mx-auto">
                            <p className="text-yellow-300 font-bold text-lg">
                                Time Remaining: {formatTime(timeRemaining)}
                            </p>
                        </div>
                    </div>
                )}

            </div>


            {/* Operations with conditional access */}
            <Operations
                handlePrivateMint={() => Promise.resolve()}
                handlePrivateBurn={() => Promise.resolve()}
                handlePrivateTransfer={canWithdraw ? handlePrivateTransfer : () => Promise.resolve()}
                handlePrivateWithdraw={canWithdraw ? handlePrivateWithdraw : () => Promise.resolve()}
                refetchBalance={refetchBalance}
                mode="converter"
                isDecryptionKeySet={isDecryptionKeySet}
            />
        </>
    );
}


