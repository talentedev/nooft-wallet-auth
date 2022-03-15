import type { NextPage } from 'next'
import Head from 'next/head'
import { useCallback, useState, useEffect, useReducer } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import WalletConnectProvider from '@walletconnect/web3-provider'
import { providers } from 'ethers'
import Web3Modal from 'web3modal'
import { getPulseAddress, ellipseAddress } from '../utils/helpers';
import styles from '../styles/Home.module.css'

const enum Chain {
  Ethereum = 'Ethereum',
  BSC = 'BSC',
  Polygon = 'Polygon',
  FTM = 'FTM',
  Solana = 'Solana',
}

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.INFURA_ID,
      rpc: {
        1: process.env.ETHEREUM_RPC,
        56: process.env.BSC_RPC,
        137: process.env.POLYGON_RPC,
        250: process.env.FTM_RPC,
      },
    },
  }
}

let web3Modal: any;
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: process.env.NETWORK,
    cacheProvider: true,
    providerOptions,
  })
}

type StateType = {
  provider?: any
  web3Provider?: any
  address?: string
  pulseBalance?: number
}

type ActionType =
  | {
      type: 'SET_WEB3_PROVIDER'
      provider?: StateType['provider']
      web3Provider?: StateType['web3Provider']
      address?: StateType['address']
      pulseBalance?: StateType['pulseBalance']
    }
  | {
      type: 'RESET_WEB3_PROVIDER'
    }

const initialState: StateType = {
  provider: null,
  web3Provider: null,
  address: '',
  chainId: 0,
  pulseBalance: 0
}

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        chainId: action.chainId,
        pulseBalance: action.pulseBalance
      }
    case 'RESET_WEB3_PROVIDER':
      return initialState
    default:
      throw new Error()
  }
}

const Home: NextPage = () => {
  const [isLogged, setIsLogged] = useState(false)
  const [network, setNetwork] = useState(Chain.Ethereum)
  const [state, dispatch] = useReducer(reducer, initialState)
  const { provider, web3Provider, address, chainId } = state
  const { publicKey } = useWallet()

  function handleChangeNetwork(event: any) {
    setNetwork(event.target.value);
  }

  function getChainID(network: Chain) {
    switch(network) {
      case Chain.Ethereum: return "0x1"
      case Chain.BSC: return "0x38"
      case Chain.Polygon: return "0x89"
      case Chain.FTM: return "0xFA"
      default: return "0x01"
    }
  }

  // Connect wallet for Pulse
  const connect = useCallback(async function () {
    const provider = await web3Modal.connect()

    console.log(getChainID(network))

    // Change network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: getChainID(network) }],
    });

    const web3Provider = new providers.Web3Provider(provider)

    const signer = web3Provider.getSigner()
    const address = await signer.getAddress()

    setIsLogged(true)

    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
    })
  }, [network])

  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider()
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect()
      }

      setIsLogged(false)

      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      })
    },
    [provider]
  )

  useEffect(() => {
    if(network == Chain.Solana) {
      if (publicKey) {
        setIsLogged(true)
      } else {
        setIsLogged(false)
      }
    }
  }, [publicKey])

  return (
    <div className={styles.container}>
      <Head>
        <title>Nooft Wallet Auth</title>
        <meta name="description" content="Wallet Authentication" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.grid}>
          <select onChange={handleChangeNetwork}>
            <option disabled>Select Network</option>
            {Object.keys(Chain).map((chain, i) => {
              return <option key={i}>{chain}</option>
            })}
          </select>
          {network == Chain.Solana?
            <WalletMultiButton /> :
            (isLogged? <button type="button" onClick={disconnect}>{ellipseAddress(address)}</button>
              : <button type="button" onClick={connect}>Connect wallet</button>)
          }
        </div>
        <div>
          {isLogged?
            <>
              <p>You are already logged</p>
              <p>Your wallet address: {network == Chain.Solana? publicKey && publicKey.toBase58(): address}</p>
            </>
            : <p>please login with wallet</p>
          }
        </div>
      </main>

    </div>
  )
}

export default Home
