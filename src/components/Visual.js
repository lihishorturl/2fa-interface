import React from "react";
import CryptoJS from 'crypto-js';

const show = require('../assets/images/show-svgrepo-com.png');
const hide = require('../assets/images/hide-svgrepo-com.png');
class Visual extends React.Component {
    constructor(props) {
        super(props);
        let ts = Math.round((new Date()).getTime() / 1000);
        this.state = { date: new Date(), time: ts, secrets: props.secrets, current: { note: '' } };
    }

    componentDidMount() {
        this.process()
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
        //this.process()
    }

    toggle(id) {
        let status = false
        if(localStorage.getItem(id)) {
            status = !(localStorage.getItem(id) === 'true')
        }
        localStorage.setItem(id, status.toString());
        this.process()
    }

    process() {
        const secrets = this.props.secrets;
        let rows = []
        for (let i = 0; i < secrets.length; i += 1) {
            let id = secrets[i].id;
            let text = ''
            let note = secrets[i].note

            let status = true
            if(localStorage.getItem(id)) {
                status = (localStorage.getItem(id) === 'true')
            }

            rows.push({ id, note, status, text });
        }
        this.setState({
            date: new Date(),
            secrets: rows
        });
    }

    render() {
        return (
            <div className="mt-4">
                <ul className="flex flex-col divide-y w-full rounded-lg">
                    {this.state.secrets.map((secret) => (
                        <li className="flex flex-row" onClick={() => this.toggle(secret.id)} key={secret.id}>
                            <div className="select-none cursor-pointer hover:border-2 hover:border-sky-500 hover:border-dashed flex flex-1 items-center p-4 bg-gray-100">
                                <div className="flex-1 pl-1">
                                    <div className="font-medium text-gray-500">{secret.note}</div>
                                    <div className="inline-flex justify-center">
                                        {secret.status === true && <img style={{width: '30px'}} src={show} alt=''/>}
                                        {secret.status === false && <img style={{width: '25px', marginTop: '3px'}} src={hide} alt=''/>}
                                    </div>
                                    <p>{secret.text}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

export default Visual;