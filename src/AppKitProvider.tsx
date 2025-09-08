import { createAppKit } from "@reown/appkit/react";

import { WagmiProvider } from "wagmi";
import { avalancheFuji } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
// import { injected, metaMask, walletConnect } from "@reown/appkit/connectors";

// 0. Setup queryClient
const queryClient = new QueryClient();

// Usar un projectId válido para desarrollo (projectId de ejemplo de Reown)
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "a01e2bc3b109db80e81f365a4c4a0e8e";

// 2. Create a metadata object - optional
const metadata = {
  name: "AppKit",
  description: "AppKit Example",
  url: window.location.origin, // This will automatically match the current domain
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// 3. Set the networks
const networks = [avalancheFuji];

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [avalancheFuji],
  projectId,
  metadata,
  features: {
    analytics: true, // Deshabilitar analytics para evitar errores de autenticación
  },
});

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
