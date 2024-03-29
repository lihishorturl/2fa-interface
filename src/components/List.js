import {ethers} from 'ethers'
import {useEffect, useState} from 'react'
import CryptoJS from 'crypto-js';
import Visual from './Visual';
import Clock from './Clock';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { Html5Qrcode } from "html5-qrcode";

const totp = require("totp-generator");

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
  const [slots, setSlots] = useState(3);
  const [minted, setMinted] = useState(0);
  const [counter, setCounter] = useState(0);
  const [mintError, setMintError] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [scanLock, setScanLock] = useState(false);
  const [mintModal, setMintModal] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [visualMode, setVisualMode] = useState(false);
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
    console.log(1)
    const encrypted = encrypt(hashKey, formatted)
    console.log(2)
    try {
      mintCheckerStart();
      setStatusMessage('Transaction is being processed on blockchain, please check your wallet');
      setSecret('');
      setMintError('')
      setMintModal(false)
      document.getElementById('secret-field').value = '';
      document.getElementById('note-field').value = '';
      document.getElementById("mint-modal").checked = false;

      console.log(3)

      const noteEncrypted = encrypt(hashKey,utoa(note))

      console.log(4)
      const transaction = await contract.mint(encrypted, noteEncrypted);
      console.log(5)
      await transaction.wait();
      console.log(6)
      setNote('');

    } catch (error) {
      console.log(error)

      setStatusMessage('')
      let message = 'something wrong';

      if (error && error.data !== undefined && error.data.message !== undefined) {
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

  async function punch() {
    const MySwal = withReactContent(Swal)
    let result = false

    try {
      setStatusMessage('Transaction is being processed on blockchain, please check your wallet')
      punchCheckerStart()
      let tx = { value: ethers.utils.parseEther(price.toString())}
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
        if(error['message'].includes("insufficient")) {
          message = 'Insufficient funds for gas fee in wallet'
        } else if(error['message'].includes("User denied transaction signature")) {
          message = 'Transaction canceled'
        } else {
          message = error['message']
        }
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

  function startVisualMode()
  {
    setVisualMode(true)
  }

  function closeVisualMode()
  {
    setVisualMode(false)
  }

  function openMintModal() {
    setScanMessage('')
    setMintModal(true)
  }

  function closeMintModal() {
    setScanMessage('')
    setMintModal(false)
    stopScan()
  }

  function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  function createScan() {
    if (scanLock === true) return
    setScanLock(true)
    document.getElementById('btn-scan-start').textContent = 'Permissions requesting...'
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        document.getElementById('btn-scan-start').textContent = 'Scan a QR code'
        document.getElementById('scan-start').style.display = 'none'
        setScanMessage('')
        const reader = new Html5Qrcode(/* element id */ "createReader");
        setHtml5QrCode(reader)
        reader.start(
          { facingMode: "environment" },
          {
            fps: 10,    // Optional, frame per seconds for qr code scanning
            qrbox: { width: 250, height: 250 }  // Optional, if you want bounded box UI
          },
          (decodedText, decodedResult) => {
            let text = decodeURIComponent(decodedText)
            if (!text.includes('otpauth://totp/') || !text.includes('secret=')) {
              setScanMessage('Invalid 2FA QRcode (TOTP)')
              return;
            }
            let note = text.substring(15, text.length).split("?")[0].split(":")[0];
            let secret = getParameterByName('secret', text);
            let issuer = getParameterByName('issuer', text);

            if(!note.includes(issuer)) note = issuer + ' (' + note + ')'

            if (note && secret) {
              setNote(note);
              setSecret(secret);
              setScanMessage('Imported successfully')
              setMintError('')
            } else {
              setScanMessage('Something wrong')
            }

            try {
              reader.stop().then((ignore) => {
                // QR Code scanning is stopped.
              }).catch((err) => {
              });
            } catch (err) {
            }
            setScanLock(false)
            // do something when code is read
          },
          (errorMessage) => {
            // parse error, ignore it.
          })
          .catch((err) => {
            // Start failed, handle it.
            setScanMessage(err)
            setScanLock(false)
          });
      }
    }).catch(err => {
      MySwal.fire({
        icon: 'error',
        title: 'Permission Deny',
        text: 'The request is not allowed by the user agent or the platform in the current context.',
        confirmButtonText: 'Reload Page',
      }).then(() => {
        window.location.reload();
      })
      setScanMessage(err)
      setScanLock(false)
      document.getElementById('btn-scan-start').textContent = 'Scan a QR code'
    });
  }

  function stopScan() {
    document.getElementById('scan-start').style.display = 'block'
    try {
      html5QrCode.stop().then((ignore) => {
        // QR Code scanning is stopped.
      }).catch((err) => {
      });
    } catch (err) {
    }
    setScanLock(false)
  }

  return (
    <>
      <input type="checkbox" id="mint-modal" className="modal-toggle" />
      <div className={mintModal ? 'modal modal-open' : 'modal'}>
        <div className="modal-box relative">
          <label onClick={closeMintModal} className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
          {(slots - minted) <= 0 && <form className="w-full md:ml-0" action="#" method="GET">
            <h3 className="font-bold text-lg mb-3">{(slots - minted)} / {slots} slots available for mint.</h3>
            <div className="modal-action">
              <button className="btn-3d text-gray-400 w-full" onClick={punch}>
                <span className='text-base mx-2.5'>Purchase {quantity} slots</span>
              </button>
            </div>
          </form>}
          {(slots - minted) > 0 && <form className="w-full md:ml-0" action="#" method="GET">
            <h3 className="font-bold text-lg mb-3">Fill Account & the 2FA secret</h3>
            <div id='scan-start' className='btn-3d w-full text-center scan-start mt-3' onClick={createScan}>
              <button id='btn-scan-start' className='btn-scan-start' type='button' >Scan a QR code</button>
            </div>
            <div id="createReader"></div>
            <label className='label'>
              <span className={scanMessage === 'Imported successfully' ? "label-text text-green-500 pt-1" : "label-text text-red-500 pt-1"}>{scanMessage}</span>
            </label>
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
          </form>}
        </div>
      </div>

      <input type="checkbox" id="share-modal" className="modal-toggle" />

      <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden pb-2">
        <div className="px-4 sm:px-10">
          <div className="form-control w-full text-center">
            <div className="w-full md:ml-0">
              {<button onClick={openMintModal} className="btn-3d w-full">
                <span className='text-base mx-2.5'>Mint your Authenticator</span>
              </button>}
              <p className='mt-2 text-purple-800 font-extrabold'>{statusMessage}</p>
            </div>
            <div className="h-full flex mb-3">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-stretch">
                  <main className="flex-1 overflow-y-auto">
                    {!visualMode && <Clock secrets={secrets} address={account} updateCallback={handleUpdateCallback} hashKey={hashKey} updateError={updateError}></Clock>}
                    {visualMode && <Visual secrets={secrets} address={account} updateCallback={handleUpdateCallback} hashKey={hashKey} updateError={updateError}></Visual>}
                  </main>
                </div>
              </div>
            </div>
            <div className='mt-2'><p className='text-gray-500'>{(slots - minted)} / {slots} slots available for mint </p></div>
          </div>
        </div>
      </div>
      <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
        {!visualMode && <div className="px-4 pb-2 sm:px-10">
          <div className="flex flex-col w-full border-opacity-50 p-2">
            <div className="grid place-items-center">
              <button className="btn-3d text-gray-400 w-full" onClick={startVisualMode}>
                <span className='text-base mx-2.5'>Display setting</span>
              </button>
            </div>
          </div>
        </div>}
        {visualMode && <div className="px-4 pb-2 sm:px-10">
          <div className="flex flex-col w-full border-opacity-50 p-2">
            <div className="grid place-items-center">
              <button className="btn-3d text-gray-400 w-full" onClick={closeVisualMode}>
                <span className='text-base mx-2.5'>Exit display setting</span>
              </button>
            </div>
          </div>
        </div>}
      </div>

    </>
  )
}
