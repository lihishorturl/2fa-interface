import React, { useEffect, useState } from "react";
import List from './List';
import CryptoJS from 'crypto-js';
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import Instruction from '../components/Instruction'

function Panel({ contract, account, onLogin, tokenName, referral, minted }) {

    const [code, setCode] = useState('');
    const [codeAgain, setCodeAgain] = useState('');
    const [codeError, setCodeError] = useState('');
    const [codeClass, setCodeClass] = useState('');
    const [confirm, setConfirm] = useState(false);
    const [unclockError, setUnclockError] = useState('');
    const [hash, setHash] = useState(null);
    const [hashKey, setHashKey] = useState(null);
    const [showMainPanel, setShowMainPanel] = useState(false);
    const MySwal = withReactContent(Swal)

    function isHashKeyExist() {
        const item = localStorage.getItem(account);
        if (item !== null) return true;

        return false;
    }

    async function unlock() {

        if (!code || code.length > 32) {
            MySwal.fire({
                icon: 'error',
                title: 'This passcode is not allow',
            })
            return
        }

        const sha256 = CryptoJS.SHA256(code).toString(CryptoJS.enc.Hex);
        const sha1 = CryptoJS.SHA1(code).toString(CryptoJS.enc.Hex)

        if (!minted) {
            const item = localStorage.getItem(account);
            if (sha256 === item && item != null && sha256.length > 0) {
                setUnclockError('');
                setShowMainPanel(true);
                onLogin(true);
                setHashKey(sha1);
            } else {
                setUnclockError('Wrong passcode, re-try please');
            }
        } else {
            const ids = await contract.getTokenIds();
            const secret = await contract.getSecret(ids[0]);
            const decrypted = decrypt(sha1, secret)

            if (decrypted) {
                setHashKey(sha1);
                setHash(sha256)
                setUnclockError('');
                setShowMainPanel(true);
                onLogin(true);
                localStorage.setItem(account, sha256);
            } else {
                setUnclockError('Wrong passcode, re-try please');
            }
        }
    }

    function decrypt(key, ciphertext) {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        return originalText;
    }

    function register() {
        if (!confirm) {
            MySwal.fire({
                icon: 'warning',
                title: 'Please check the term',
            })
            return
        }
        if (code.length === 0) {
            MySwal.fire({
                icon: 'warning',
                title: 'Empty Passcode is not allow',
            })
            return
        }

        if (code.length > 32) {
            MySwal.fire({
                icon: 'warning',
                title: 'Long passcode is not allow',
            })
            return
        }

        if (code !== codeAgain) {
            MySwal.fire({
                icon: 'warning',
                title: 'Two Passcode is different',
            })
            return
        }
        const sha256 = CryptoJS.SHA256(code).toString(CryptoJS.enc.Hex);
        localStorage.setItem(account, sha256);
        setHash(sha256)
        setHashKey(CryptoJS.SHA1(code).toString(CryptoJS.enc.Hex));
        setShowMainPanel(true);
    }

    useEffect(() => {
        if (code.length > 0 && codeAgain.length > 0) {
            if (code !== codeAgain) {
                setCodeHint('You type two different code, Please re-type again.', ' input-bordered input-secondary bg-red-500 text-white');
            } else {
                setCodeHint('', ' input-bordered input-success bg-green-500 text-white')
            }
        } else {
            setCodeHint('', '');
        }
        if (isHashKeyExist()) {
            saveHash(localStorage.getItem(account))
        }
    });

    function saveHash(hash) {
        setHash(hash);
    }

    function setCodeHint(message, className) {
        setCodeError(message);
        setCodeClass(className)
    }

    if (!account) return '';

    if (showMainPanel) {
        return (
            <>
                <List contract={contract} account={account} hashKey={hashKey} tokenName={tokenName} referral={referral}></List>
                <div className="hidden">
                    <h3 className='text-2xl text-gray-700 font-bold text-center'>Instruction</h3>
                    <Instruction></Instruction>
                </div>
            </>
        );
    }

    if (hash || minted) {
        return (
            <>
                <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
                    <div className="px-4 pt-2 pb-4 sm:px-10">
                        <div className="form-control w-full text-center">
                            <div className="mb-4">
                                <div className="mb-4 h-20 w-20 m-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 m-auto " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <span className="text-3xl font-bold text-gray-600 mt-2">Unlock your vault</span>
                                <p className="text-xl mt-1">Please enter your vault passcode to unlock your vault.</p>
                            </div>
                            <input autoFocus onKeyUp={(e) => { if(e.key === 'Enter') unlock();}} onChange={(e) => { setCode(e.target.value) }} type="password" className="input input-bordered w-full text-center text-xl bg-gray-600 mb-2" placeholder="Enter your passcode" />
                            <button onClick={unlock} className="btn-3d">
                                <span className='text-base mx-2.5'>Open vault</span>
                            </button>
                            <div className="text-center text-red-500 mt-2">
                                {unclockError}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="bg-white sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
                <div className="px-4 py-8 sm:px-10">
                    <div className="form-control w-full text-center">
                        <div className="mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-3xl font-bold text-gray-600">Set up a passcode for lihi Authenticator</span>
                            <p className="text-red-500 mt-2">
                                Passcode is used to encrypt your 2FA keys, it doesn't need to be extremely complicated, but make sure you store and keep it safely in case you need to recover your account.
                            </p>
                        </div>
                        <label className="label">
                            <span className="label-text text-gray-600">Enter Passcode</span>
                        </label>
                        <input onChange={(e) => { setCode(e.target.value) }} type="password" className={"input input-bordered w-full text-center text-3xl bg-gray-600" + codeClass} placeholder="••••••••" />
                        <label className="label">
                            <span className="label-text text-gray-600">Enter Passcode again</span>
                        </label>
                        <input onChange={(e) => { setCodeAgain(e.target.value) }} type="password" className={"input input-bordered w-full text-center text-3xl bg-gray-600" + codeClass} placeholder="••••••••" />
                        <div className="form-control">
                            <label className="label cursor-pointer justify-start">
                                <input type="checkbox" className="checkbox checkbox-primary" value="on2" onChange={(e) => { setConfirm(e.target.checked) }} />
                                <span className="pl-3 label-text text-gray-500 text-left">I understand that lihi cannot recover<br className="block lg:hidden" /> the passcode for me.</span>
                            </label>
                        </div>
                        <label className="label">
                            <span className="label-text text-red-500">{codeError}</span>
                        </label>
                        <button onClick={register} className="btn-3d">
                            <span className='text-base mx-2.5'>Make a Vault</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Panel;
