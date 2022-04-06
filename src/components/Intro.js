export default function Intro({ defaultAccount }) {
    return (
        <div className="mt-5 px-4">
            <div className="sm:pt-2 lg:pt-1 ">
                <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-white sm:mt-5 sm:leading-none lg:mt-6 lg:text-5xl xl:text-6xl">
                    <p className="md:block text-5xl mb-2 ">lihi Authenticator</p>
                    <span className="text-indigo-400 md:block text-4xl">2FA Dapp on decentralized Web3.0. Live on BSC</span>
                </h1>
                <p className="mt-2">Keep your 2FA keys safe and accessible FOREVER</p>
                <div className="flex mt-3">
                    <div className="grow h-14 ...">
                    </div>
                    <div className="grow h-14">
                        <img
                            className="h-6"
                            src="/logo/binance-logo.svg"
                            alt="Workflow"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}