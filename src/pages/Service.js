import './App.css';
import { ethers } from 'ethers'
import React, { useEffect, useState } from "react";
import Panel from '../components/Panel';
import Steps from '../components/Steps';
import { useSearchParams } from "react-router-dom";
import WalletConnectProvider from "@walletconnect/web3-provider"
import { networks } from '../constants/networks';
import { contracts } from '../constants/contracts';
import { tokenNames } from '../constants/tokenNames';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

function Service() {

  const [searchParams] = useSearchParams();
  
  const [contract, setContract] = useState(undefined);
  const [referral, setReferral] = useState('');
  const [isLogin, setIsLogin] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [minted, setMinted] = useState(false);
  const [sloted, setSloted] = useState(false);
  // const [errorMessage, setErrorMessage] = useState('');
  const [defaultAccount, setDefaultAccount] = useState(null);
  const [connButtonText, setConnButtonText] = useState('Connect BSC Wallet');
  const [tokenName, setTokenName] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [connButtonAlertClass, setConnButtonAlertClass] = useState(false);
  const MySwal = withReactContent(Swal)

  useEffect(() => {
    document.body.classList.remove('bg-loading');
    if (!defaultAccount) return;
    const r = searchParams.get("r")
    if (r && r !== defaultAccount) {
      try {
        let referral = localStorage.getItem('R_' + defaultAccount)
        if (referral) {
          firstOrCreateReferral(referral)
        } else {
          firstOrCreateReferral(r)
        }
      } catch (error) {
      }
    } else {
      let referral = localStorage.getItem('R_' + defaultAccount)
      if (referral) {
        firstOrCreateReferral(referral)
      }
    }
  });

  function firstOrCreateReferral(referral) {
    ethers.utils.getAddress(referral)
    setReferral(referral)
    localStorage.setItem('R_' + defaultAccount, referral);
  }

  function onSessionUpdate(address, chainId) {
    setWalletConnected(true)
    setDefaultAccount(address)
    const lastFive = address.substr(address.length - 5).toUpperCase();
    const firstSix = address.substr(0, 6).toUpperCase();
    setConnButtonText(firstSix + '...' + lastFive);
  };

  function onConnect(payload) {
    const { accounts } = payload.params[0];
    const address = accounts[0];
    setWalletConnected(true)
    setDefaultAccount(address)
  };

  function resetWalletConnection() {
    localStorage.removeItem('walletconnect')
    localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
  }

  function reset() {
    localStorage.removeItem(defaultAccount);
    setTimeout(() => {
      window.location.reload();
    }, 500)
  }

  async function setLoginStatus(status) {
    if (status) {
      setIsLogin(status)
      const minted = await contract.getMintedNumber()
      if (minted) {
        setMinted(true)
      }
      const slots = await contract.getSlotNumber()
      if (slots > 2) {
        setSloted(true)
      }
    }
  }

  const resetComfirm = async () => {
    MySwal.fire({
      title: 'Are you sure?',
      text: "You can restore 2FA account with same wallet and passcode in register process",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        MySwal.fire(
          'Deleted!',
          'Your data has been deleted.',
          'success'
        )
        resetWalletConnection()
        reset()
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        MySwal.fire(
          'Cancelled',
          'Your data is fine',
          'error'
        )
      }
    })
  }

  const connectWalletHandler = async () => {
    if (defaultAccount === null) {
      try {
        var provider;
        var network;
        if (window.ethereum) {
          const result = await window.ethereum.request({ method: 'eth_requestAccounts' })
          if (result.length < 1) throw new Error('Please create an account in wallet');
          provider = new ethers.providers.Web3Provider(window.ethereum);
          network = await provider.getNetwork()
          onSessionUpdate(result[0], network.chainId);

          window.ethereum.on('accountsChanged', function (accounts) {
            window.location.reload();
          });
          window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
          });
        } else {
          const walletconnectProvider = new WalletConnectProvider({
            rpc: {
              56: "https://bsc-dataseed.binance.org",
              97: "https://data-seed-prebsc-1-s1.binance.org:8545",
            },
            supportedChainIds: [56,97],
            qrcode: true,
            network: 'binance',
            qrcodeModalOptions: {
              mobileLinks: [
                "metamask",
                "trust",
              ]
            }
          });

          walletconnectProvider.networkId = 56;

          await walletconnectProvider.enable();

          walletconnectProvider.on("accountsChanged", (accounts) => {
            console.log(accounts);
          });

          // Subscribe to chainId change
          walletconnectProvider.on("chainChanged", (chainId) => {
            console.log(chainId);
            window.location.reload();
          });

          // Subscribe to session disconnection
          walletconnectProvider.on("disconnect", (code, reason) => {
            console.log(code, reason);
            window.location.reload();
          });

          walletconnectProvider.on("connect", (error, payload) => {
            console.log(`connector.on("connect")`);
            if (error) {
              throw error;
            }
            onConnect(payload);
          });

          walletconnectProvider.on("session_update", async (error, payload) => {
            console.log(`connector.on("session_update")`);
            if (error) {
              throw error;
            }
            const { chainId, accounts } = payload.params[0];
            onSessionUpdate(accounts[0], chainId);
          });

          if (walletconnectProvider.connected) {
            const { chainId, accounts } = walletconnectProvider;
            onSessionUpdate(accounts[0], chainId);
          }

          provider = new ethers.providers.Web3Provider(walletconnectProvider)
          network = await provider.getNetwork()
        }

        console.log(network.chainId);
        setChainId(network.chainId)

        if (!networks[network.chainId]) {
          setConnButtonText('Wrong Network');
          setConnButtonAlertClass(true)
          setDefaultAccount(null)
          setIsLogin(false)
          resetWalletConnection()
          MySwal.fire({
            icon: 'warning',
            title: 'Wrong Network, please use BSC wallet',
          }).then(() => {
            setTimeout(() => {
              window.location.reload();
            }, 500)
          })
          return;
        } else {
          setConnButtonAlertClass(false)
          var Uni2fa = contracts[network.chainId]
          setTokenName(tokenNames[network.chainId])
        }

        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        setDefaultAccount(signerAddress);

        const uni2fa = await new ethers.Contract(
          Uni2fa.address,
          Uni2fa.abi,
          signer);

        setContract(uni2fa);
        setWalletConnected(true)
      } catch (error) {
        let message = error.message
        if (error.message === 'Already processing eth_requestAccounts. Please wait.') message = 'Already requested, please unlock your wallet.'
        MySwal.fire({
          icon: 'warning',
          title: message,
        })
      }
    } else {
      resetWalletConnection()
      MySwal.fire({
        icon: 'success',
        title: 'Wallet disconnected!',
      }).then(() => {
        setTimeout(() => {
          window.location.reload();
        }, 500)
      })
    }
  }

  return (
    <div className="relactive h-full">
      <div className='block'>
        <main className="lg:pb-14 lg:overflow-hidden px-4">
          <div className="mx-auto max-w-7xl">
            <div className="lg:grid lg:grid-cols-6 lg:gap-4">
              <div className="lg:col-start-2 lg:col-span-4">
                <div className="pt-6">
                  <div className="flex items-center flex-1">
                    <div className="flex items-center justify-between w-full">
                      <div className="bg-white rounded-full p-2 h-12 w-12">
                        <img className="h-8 w-auto sm:h-10" src="./watchdog.svg" alt="" />
                      </div>
                      <div className='float-right'>
                        <button onClick={connectWalletHandler} className={connButtonAlertClass ? "btn-3d-alert" : "btn-3d"}>
                          {connButtonText}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden rounded-lg panel mt-7">
                  <div className="px-4 pt-6 sm:px-10">
                    <div className={defaultAccount ? 'hidden' : 'pb-10'}>
                      <div className='walletCard'>
                        <h3 className='text-2xl text-gray-700 font-bold text-center'>Get Started</h3>
                        <div>
                          <Steps login={isLogin} wallet={walletConnected} minted={minted} sloted={sloted}></Steps>
                        </div>
                      </div>
                    </div>
                    <div className={defaultAccount ? '' : 'hidden'}>
                      <div className='walletCard'>
                        <Panel contract={contract} account={defaultAccount} onLogin={setLoginStatus} tokenName={tokenName} referral={referral}></Panel>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className='my-6 mx-3 text-center'>
            <p className='text-white font-bold'>Keep it safe & accessible forever<br />
              Losing or switching phone will never be a problem
            </p>
          </div>
          <div className='my-6 mx-3 text-center'>
            <div onClick={resetComfirm} className='text-gray-500 underline underline-offset-1'>Clear Browser Data</div>
            <div className='mt-2 text-gray-800'>{chainId}</div>
          </div>
        </main>
      </div>

    </div>
  );
}

export default Service;
