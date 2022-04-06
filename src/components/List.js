import { ethers } from 'ethers'
import { useState, useEffect } from 'react'
import CryptoJS from 'crypto-js';
import Clock from './Clock';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
const totp = require("totp-generator");
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

let mintChecker;
let punchChecker;

export default function List({ contract, account, hashKey, tokenName, referral }) {

  const [statusMessage, setStatusMessage] = useState('');
  const [note, setNote] = useState('');
  const [secret, setSecret] = useState('');
  const [secrets, setSecrets] = useState([]);
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [idList, setIds] = useState([]);
  const [slots, setSlots] = useState(2);
  const [minted, setMinted] = useState(0);
  const [counter, setCounter] = useState(0);
  const [mintError, setMintError] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [mintModal, setMintModal] = useState(false);
  const MySwal = withReactContent(Swal)

  useEffect(() => {
    init();
  },[]);

  useEffect(() => {
    checkMint();
    checkPunch();
  },[counter, account]);

  async function checkMint() {
    if (mintChecker === null || typeof mintChecker === 'undefined') return;
    const tokenIds = await contract.getTokenIds();
    const diff = tokenIds.length - idList.length;
    if (diff > 0) {
      clearInterval(mintChecker);
      setIds(tokenIds);
      MySwal.fire({
        icon: 'success',
        title: 'Your transaction is completed and successful.',
        text: 'Click ok to check on your 2FA',
      })
      init();
    }
  }

  async function checkPunch() {
    if (punchChecker === null || typeof punchChecker === 'undefined') return;
    var slotNumber = await contract.getSlotNumber();
    if (slotNumber === 0) {
      slotNumber = await contract.getDefaultSlots();
    }
    const slotDiff = slotNumber - slots;
    if (slotDiff > 0) {
      clearInterval(punchChecker);
      setSlots(slotNumber);
      MySwal.fire({
        icon: 'success',
        title: 'Your transaction is completed and successful.',
        text: 'Click ok to check on your 2FA',
      })
      init();
    }
  }

  async function init() {
    try {
      const temp = await contract.getPrice();
      setPrice(ethers.utils.formatEther(temp))
      setQuantity(await contract.getQuantity())
      var currntSlot = await contract.getSlotNumber();
      if (currntSlot === 0) currntSlot = await contract.getDefaultSlots();
      const minted = await contract.getMintedNumber();

      _setSlot(currntSlot)
      _setMinte(minted)

      const ids = await contract.getTokenIds();
      setIds(ids);
      var rows = []
      for (let i = 0; i < ids.length; i += 1) {
        const secret = await contract.getSecret(ids[i]);
        const bytes32 = await contract.getNote(ids[i]);
        const note = ethers.utils.parseBytes32String(bytes32);

        try {
          rows.push({ id: ids[i].toNumber(), note, secret, top: totp(decrypt(hashKey, secret)) })
        } catch (error) {
          console.log(error)
        }
      }
      setStatusMessage('')
      setSecrets(rows)
    } catch (error) {
      console.log(error)
    }
  };

  function _setSlot(slot) {
    if (slot < 1) return;
    if (typeof slot === 'number') {
      setSlots(slot)
    } else {
      setSlots(slot.toNumber())
    }
  }

  function _setMinte(minted) {
    if (!minted) return;
    if (typeof minted === 'number') {
      setMinted(minted)
    } else {
      setMinted(minted.toNumber())
    }
  }

  function mintCheckerStart() {
    mintChecker = setInterval(() => {
      setCounter(counter => (counter + 1));
    }, 5000);
  }

  function punchCheckerStart() {
    punchChecker = setInterval(() => {
      setCounter(counter => (counter + 1));
    }, 5000);
  }

  async function mint() {

    if (secret.length === 0) {
      setMintError('2-Step verification secret is required')
      return;
    }

    if (note.length === 0) {
      setMintError('Service Name is required')
      return;
    }

    if (note.length > 32) {
      setMintError('Service Name is too long')
      return;
    }

    const formatted = secret.replace(/\W+/g, '').toUpperCase();

    try {
      totp(formatted)
    } catch (error) {
      setMintError('2-Step verification secret is wrong')
      return;
    }

    const encrypted = encrypt(hashKey, formatted)

    try {
      mintCheckerStart();
      setStatusMessage('Transaction is being processed on blockchain, please check your wallet');
      setSecret('');
      setMintError('')
      setMintModal(false)
      document.getElementById('secret-field').value = '';
      document.getElementById('note-field').value = '';
      document.getElementById("mint-modal").checked = false;

      const bytes32 = ethers.utils.formatBytes32String(note)
      const mintStatus = await contract.getMintStatus();
      const saleStatus = await contract.getStatus();
      console.log('mintStatus: ' + mintStatus);
      console.log('saleStatus: ' + saleStatus);

      if (mintStatus) {
        if (referral) {
          ethers.utils.getAddress(referral)
          const transaction = await contract.mintWithReferral(encrypted, bytes32, referral);
          await transaction.wait();
        } else {
          const transaction = await contract.mint(encrypted, bytes32);
          await transaction.wait();
        }
      } else {
        const addresses = [
          '0x205e68646864167Eb744614048d6C43935CcA8B1',
          '0x26Efd827f012C4D156DC7D97b30f09338a0A8F31',
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          '0x31786101b8B76AcF82067256f485Deb60422EAd1',
          '0x75ef9f58f9e7f4ED773214F4af58C4C9afbDA52D',
          '0xEE4Fd383d650b1839F97a79fD954137Dc8D75E3F',
        ];
        const nodes = addresses.map(addr => keccak256(addr));
        const tree = new MerkleTree(nodes, keccak256, { sortPairs: true });
        const leaf = keccak256(account);
        const buf2hex = x => '0x' + x.toString('hex')
        const hexproof = tree.getProof(leaf).map(x => buf2hex(x.data))
        const transaction = await contract.whitelistMint(encrypted, bytes32, hexproof);
        await transaction.wait();
      }

    } catch (error) {
      console.log(error)

      setStatusMessage('')
      let message = 'something wrong';

      if (error.data !== undefined && error.data.message !== undefined) {
        message = error.data.message
        if (message.includes("insufficient funds for gas")) {
          message = 'Insufficient funds for gas'
        }
      } else if (error['message'] !== undefined) {
        message = error['message']
      }
      MySwal.fire({
        icon: 'error',
        title: message,
      })
    }
  }

  async function handleUpdateCallback(id, secret, note) {

    const encrypted = encrypt(hashKey, secret)

    try {
      setStatusMessage('Transaction is being processed on blockchain, please check your wallet and reload page to fetch data');

      document.getElementById('clock-secret-field').value = '';
      document.getElementById('clock-note-field').value = '';
      document.getElementById("update-modal").checked = false;
      setUpdateError('')
      const bytes32 = ethers.utils.formatBytes32String(note)
      const transaction = await contract.update(id, encrypted, bytes32);
      await transaction.wait();

    } catch (error) {
      setStatusMessage('')
      let message = 'something wrong';

      if (error.message) {
        message = error.message
      }

      if (error.data) {
        message = error.data.message;
        if (error.data.message.includes("'")) {
          const words = error.data.message.split("'");
          message = words[1];
        }
      }
      MySwal.fire({
        icon: 'error',
        title: message,
      })
    }
  }

  function encrypt(key, message) {
    if (key) return CryptoJS.AES.encrypt(message, key).toString();
    return '';
  }

  function decrypt(key, ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    return originalText;
  }

  async function punch() {
    const MySwal = withReactContent(Swal)
    try {

      setStatusMessage('Transaction is being processed on blockchain, please check your wallet')
      punchCheckerStart()

      const tx = {
        value: ethers.utils.parseEther(price),
      }
      await contract.punch(tx);

    } catch (error) {
      setStatusMessage('')
      let message = '';
      if (error.data !== undefined) {
        message = error.data.message
        if (message.includes("insufficient funds for gas")) {
          message = 'Insufficient funds for gas'
        }
      } else if (error['message'] !== undefined) {
        message = error['message']
      }

      MySwal.fire({
        icon: 'error',
        title: message,
      })
    }
  }

  function copyReferral() {
    navigator.clipboard.writeText(document.location.origin + '?r=' + account)
  }

  if (contract === 'undefined') {
    return '';
  }

  function openMintModal() {
    setMintModal(true)
  }

  function closeMintModal() {
    setMintModal(false)
  }

  return (
    <>
      <input type="checkbox" id="mint-modal" className="modal-toggle" />
      <div className={mintModal ? 'modal modal-open' : 'modal'}>
        <div className="modal-box relative">
          <label onClick={closeMintModal} className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
          <form className="w-full md:ml-0" action="#" method="GET">
            <h3 className="font-bold text-lg mb-3">Fill the 2FA secret & provider name</h3>
            <div className="w-full text-gray-400 focus-within:text-gray-600">
              <input
                defaultValue={note}
                id="note-field"
                onChange={(e) => { setNote(e.target.value) }}
                type="text"
                className="input input-bordered w-full text-white bg-gray-600 focus:placeholder-gray-400"
                placeholder="Service name / Account (Ex. Binance, Cloudflare, FTX and etc)" />
            </div>
            <div className="w-full text-gray-400 focus-within:text-gray-600 mt-2">
              <input
                defaultValue={secret}
                id="secret-field"
                onChange={(e) => { setSecret(e.target.value) }}
                type="text"
                className="input input-bordered w-full text-white bg-gray-600 focus:placeholder-gray-400"
                placeholder="2-Step verification secret" />
            </div>
            <div className="modal-action">
              <button onClick={mint} className="btn-3d w-full">
                <span className='text-base mx-2.5'>Mint</span>
              </button>
            </div>
            <label className="label">
              <span className="label-text text-red-500">{mintError}</span>
            </label>
          </form>
        </div>
      </div>

      <input type="checkbox" id="share-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box relative">
          <label htmlFor="share-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
          <form className="w-full md:ml-0" action="#" method="GET">
            <h3 className="font-bold text-lg mb-3">Referral url is copied</h3>
            <div className="w-full text-gray-400 focus-within:text-gray-600 mt-2">
              Anyone minted by this referral url, you will earn a slot for free, until limit is reached.
              <div className='mt-5 text-info'>
                <a href='https://en.wikipedia.org/wiki/Multi-factor_authentication'>Why we use 2-step verification</a>
              </div>
            </div>
            <div className="modal-action">
              <button htmlFor="share-modal" className="mt-2 w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                <span className='text-base mx-2.5'>OK</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden pb-2">
        <div className="px-4 sm:px-10">
          <div className="form-control w-full text-center">
            <div className="w-full md:ml-0" action="#" method="GET">
              <button onClick={openMintModal} className="btn-3d w-full">
                <span className='text-base mx-2.5'>Mint your Authenticator</span>
              </button>
              <p className='mt-2 text-purple-800 font-extrabold'>{statusMessage}</p>
            </div>
            <div className="h-full flex mb-3">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-stretch">
                  <main className="flex-1 overflow-y-auto">
                    <Clock secrets={secrets} address={account} updateCallback={handleUpdateCallback} hashKey={hashKey} updateError={updateError}></Clock>
                  </main>
                </div>
                <div className='mt-3'><p className='text-gray-500'>{(slots - minted)} free slots available for mint </p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden hidden">
        <hr />
        <div className="px-4 pb-2 sm:px-10 mt-3">
          <div className='text-center'>
            <p className='text-gray-500 font-bold'>Need more 2FA slots?</p>
          </div>
          <div className="flex flex-col w-full border-opacity-50 py-3">
            <div className="grid place-items-center">
              <button htmlFor="share-modal" onClick={copyReferral} className="btn-3d text-gray-400 w-full" disabled="disabled">
                <span className='text-base mx-2.5'>Share Dapp</span>
              </button>
            </div>
            <div className="divider my-2">OR</div>
            <div className="grid place-items-center">
              <button className="btn-3d text-gray-400 w-full" onClick={punch} disabled="disabled">
                <span className='text-base mx-2.5'>Purchase {quantity} slots</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
