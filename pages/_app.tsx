import '../styles/globals.css'
import type { AppProps } from 'next/app'
import dynamic from "next/dynamic"
import { useMemo } from "react"
import { ConnectionProvider } from "@solana/wallet-adapter-react"
import { clusterApiUrl } from "@solana/web3.js"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"

const SOLANA_NETWORK = WalletAdapterNetwork.Mainnet
const network = SOLANA_NETWORK

const WalletProvider = dynamic(
  () => import("../contexts/ClientWalletProvider"),
  {
    ssr: false,
  }
)

function MyApp({ Component, pageProps }: AppProps) {
  const endpoint = useMemo(() => clusterApiUrl(network), [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider>
        <Component {...pageProps} />
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default MyApp
