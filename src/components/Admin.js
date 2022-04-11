import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import { addresses } from '../constants/whitelist';
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

export default function Admin({ contract }) {

    const MySwal = withReactContent(Swal)

    async function setRoot() {
        try {
            const old = await contract.getRoot();
            console.log('Old Root: ' + old)
            const nodes = addresses.map(addr => keccak256(addr));
            const tree = new MerkleTree(nodes, keccak256, { sortPairs: true });
            const root = tree.getHexRoot();
            console.log('New Root: ' + root)
            await contract.setRoot(root);
            
        } catch (error) {
            let message = '';
            if (error.data !== undefined) {
                message = error.data.message
            } else if (error['message'] !== undefined) {
                message = error['message']
            }

            MySwal.fire({
                icon: 'error',
                title: message,
            })
        }
    }

    return (
        <>
            <div className="x   sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden">
                <div className="px-4 py-2 sm:px-10">
                    <div className="form-control w-full text-center">
                        <button onClick={setRoot} className="btn-3d">
                            <span className='text-base mx-2.5'>Set Root</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
