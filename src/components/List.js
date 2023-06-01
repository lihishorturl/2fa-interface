import {ethers} from 'ethers'
import {useEffect, useState} from 'react'
import CryptoJS from 'crypto-js';
import Clock from './Clock';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {addresses} from '../constants/whitelist';

const totp = require("totp-generator");
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

let mintChecker;
let punchChecker;

export default function List({ contract, account, hashKey }) {

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
        const encrypted = await contract.getNote(ids[i]);
        const note = atou(decrypt(hashKey, encrypted));
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

  function utoa(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
// Decode
  function atou(str) {
    return decodeURIComponent(escape(atob(str)));
  }

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

      const noteEncrypted = encrypt(hashKey,utoa(note))
      // const bytes32 = ethers.utils.formatBytes32String(note)
      // console.log(bytes32)
      const mintStatus = await contract.getMintStatus();
      console.log('mintStatus: ' + mintStatus);

      const transaction = await contract.mint(encrypted, noteEncrypted);
      await transaction.wait();

    } catch (error) {
      console.log(error)

      setStatusMessage('')
      let message = 'something wrong';

      if (error.data !== undefined && error.data.message !== undefined) {
        message = error.data.message
        if (message.includes("insufficient funds for gas")) {
          message = 'Insufficient funds for gas'
        }
        if (message.includes("Invalid proof")) {
          message = 'Sorry, You are NOT in the whitelist'
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
    const noteEncrypted = encrypt(hashKey,utoa(note))

    try {
      setStatusMessage('Transaction is being processed on blockchain, please check your wallet and reload page to fetch data');

      document.getElementById('clock-secret-field').value = '';
      document.getElementById('clock-note-field').value = '';
      document.getElementById("update-modal").checked = false;
      setUpdateError('')
      const transaction = await contract.update(id, encrypted, noteEncrypted);
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
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  function getHexProof() {
    const nodes = addresses.map(addr => keccak256(addr));
    const tree = new MerkleTree(nodes, keccak256, {sortPairs: true});
    const leaf = keccak256(account);
    const buf2hex = x => '0x' + x.toString('hex')
    return tree.getProof(leaf).map(x => buf2hex(x.data));
  }

  async function punch() {
    const MySwal = withReactContent(Swal)
    let result = false
    try {
      result = await contract.getProof(getHexProof());
    }catch (error) {
      console.log(error)
    }
    try {
      setStatusMessage('Transaction is being processed on blockchain, please check your wallet')
      punchCheckerStart()
      let tx
      console.log(result)
      if(result === true) {
        tx = { value: ethers.utils.parseEther((price / 2).toString())}
        await contract.listPunch(getHexProof(), tx);
      }else{
        tx = { value: ethers.utils.parseEther(price.toString())}
        await contract.punch(tx);
      }

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
                placeholder="Service: account@email.com" />
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

      <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden pb-2">
        <div className="px-4 sm:px-10">
          <div className="form-control w-full text-center">
            <div className="w-full md:ml-0">
              {(slots - minted) > 0 && <button onClick={openMintModal} className="btn-3d w-full">
                <span className='text-base mx-2.5'>Mint your Authenticator</span>
              </button>}
              <p className='mt-2 text-purple-800 font-extrabold'>{statusMessage}</p>
            </div>
            <div className="h-full flex mb-3">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-stretch">
                  <main className="flex-1 overflow-y-auto">
                    <Clock secrets={secrets} address={account} updateCallback={handleUpdateCallback} hashKey={hashKey} updateError={updateError}></Clock>
                  </main>
                </div>
                <div className='mt-3'><p className='text-gray-500'>{(slots - minted)} / {slots} slots available for mint </p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
        <hr />
        <div className="px-4 pb-2 sm:px-10 mt-3">
          <div className='text-center'>
            <p className='text-gray-500 font-bold'>Need more 2FA slots?</p>
          </div>
          <div className="flex flex-col w-full border-opacity-50 py-3">
            <div className="grid place-items-center">
              <button className="btn-3d text-gray-400 w-full" onClick={punch}>
                <span className='text-base mx-2.5'>Purchase {quantity} slots</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
