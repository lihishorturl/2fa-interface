import React from "react";
import CryptoJS from 'crypto-js';
const totp = require("totp-generator");

class Clock extends React.Component {

    constructor(props) {
        super(props);
        let ts = Math.round((new Date()).getTime() / 1000);
        this.state = { date: new Date(), time: ts, secrets: props.secrets, current: { note: '' } };
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.tick(),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    getKey() {
        if (this.props.hashKey !== null) {
            return this.props.hashKey;
        }
        return null;
    }

    decrypt(key, ciphertext) {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        return originalText;
    }

    tick() {
        this.process()
    }

    copy(secret) {
        console.log('Copied')
        navigator.clipboard.writeText(secret.top)
        this.process(secret.id)
        this.setState({ current: secret });
    }

    process(copiedId = null) {
        const key = this.getKey();
        const ts = Math.round((new Date()).getTime() / 1000)
        const secrets = this.props.secrets;
        let rows = []
        for (let i = 0; i < secrets.length; i += 1) {
            let id = secrets[i].id;
            let text = ''
            let note = secrets[i].note
            if (copiedId === id) {
                text = 'Copied'
            }
            let secret = secrets[i].secret;
            let decrypted = this.decrypt(key, secret);
            let top = '';
            top = totp(decrypted);
            if (decrypted === '') {
                top = 'WRONG PASSCODE';
            }
            let status = true
            if(localStorage.getItem(id)) {
                status = (localStorage.getItem(id) === 'true')
            }

            rows.push({ id, note, secret, status, top, text });
        }
        this.setState({
            date: new Date(),
            time: ts,
            secrets: rows
        });
    }

    onFieldChange(event) {
        const fieldName = event.target.name;
        const fieldValue = event.target.value;
        this.setState({ [`${fieldName}`]: fieldValue });
    }

    render() {
        return (
            <div>
                <progress className={this.props.secrets.length > 0 ? "progress progress-info my-2 w-full" : 'hidden'} value={this.state.time % 30 * 3.45} max="100">Refresh</progress>
                <ul className="flex flex-col divide-y w-full rounded-lg">
                    {this.state.secrets.map((secret) => {
                        return secret.status === true &&
                        (<li className="flex flex-row" onClick={() => this.copy(secret)} key={secret.id}>
                            <div className="select-none cursor-pointer hover:border-2 hover:border-sky-500 hover:border-dashed flex flex-1 items-center p-4 bg-gray-100">
                                <div className="flex-1 pl-1">
                                    <div className="font-medium text-gray-500">{secret.note}</div>
                                    <h2 className="text-gray-800 text-3xl">{secret.top}</h2>
                                    <p>{secret.text}</p>
                                </div>
                            </div>
                      </li>)
                    })}
                </ul>
                <div className="hidden">
                    <label htmlFor="update-modal" className="mt-2 w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <p className='text-base mx-2.5'>Overwrite</p>
                    </label>
                </div>
                <input type="checkbox" id="update-modal" className="modal-toggle" />
                <div className="modal">
                    <div className="modal-box relative">
                        <label htmlFor="update-modal" className="btn btn-sm btn-circle absolute right-2 top-2">✕</label>
                        <h3 className="font-bold text-lg mb-3">{this.state.current.note} #{this.state.current.id}</h3>
                        <input
                            id="clock-note-field"
                            type="text"
                            name="note"
                            onChange={this.onFieldChange.bind(this)}
                            className="input input-bordered w-full text-white bg-gray-600 focus:placeholder-gray-400 mb-3"
                            placeholder="Service: account@email.com" />
                        <input
                            id="clock-secret-field"
                            type="text"
                            name="secret"
                            onChange={this.onFieldChange.bind(this)}
                            className="input input-bordered w-full text-white bg-gray-600 focus:placeholder-gray-400"
                            placeholder="2-Step verification secret" />
                        <div className="modal-action">
                            <label onClick={() => {
                                if (!this.state.current || this.state.current.id === null) {
                                    this.setState({ updateError: 'Target is required'})
                                    return;
                                }
                                if (!this.state.secret || this.state.secret.length === 0) {
                                    this.setState({ updateError: '2-Step verification secret is required'})
                                    return;
                                }

                                if (!this.state.note || this.state.note.length === 0) {
                                    this.setState({ updateError: 'Service Name is required'})
                                    return;
                                }

                                if (this.state.note.length > 32) {
                                    this.setState({ updateError: 'Service Name is too long'})
                                    return;
                                }

                                try {
                                    totp(this.state.secret)
                                } catch (error) {
                                    this.setState({ updateError: 'Wrong 2-Step verification secret format'})
                                    return;
                                }

                                this.props.updateCallback(this.state.current.id, this.state.secret, this.state.note)
                            }} className="w-full btn btn-accent">
                                <span>Overwrite</span>
                            </label>
                        </div>
                        <label className="label">
                            <span className="label-text text-red-500">{this.state.updateError}</span>
                        </label>
                    </div>
                </div>

            </div>
        );
    }
}

export default Clock;