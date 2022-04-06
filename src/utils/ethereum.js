import { ethers } from 'ethers';
import Uni2fa_97 from '../abis/Uni2fa_97.json';

const getBlockchain = () =>
  new Promise((resolve, reject) => {
    window.addEventListener('load', async () => {
      if (window.ethereum) {
        await window.ethereum.enable();

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const { chainId } = await provider.getNetwork()
        console.log(chainId) // 42
        
        let Uni2fa = `${'Unit2fa_' + chainId}`

        const signer = provider.getSigner();
        const signerAddress = await signer.getAddress();
        const uni2fa = new ethers.Contract(
          Uni2fa.address,
          Uni2fa.abi,
          signer
        );

        console.log(signerAddress, uni2fa)

        resolve({ signerAddress, uni2fa });
      }
      console.log('window.ethereum fail')
      resolve({ signerAddress: undefined, uni2fa: undefined });
    });
  });

export default getBlockchain;
