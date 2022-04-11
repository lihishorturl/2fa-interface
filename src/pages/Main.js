import Nav from '../components/Nav';
import React from "react";

import {
  CloudUploadIcon,
  LockClosedIcon,
  RefreshIcon,
} from '@heroicons/react/outline'

export default function Main({ defaultAccount, started }) {
  const features = [
    {
      name: 'Securely Encrypted',
      description: 'We encrypt your keys with AES algorithm',
      icon: LockClosedIcon,
    },
    {
      name: 'Blockchain Technology',
      description: 'Using blockchain to make sure the keys can\'t be altered and stay forever',
      icon: CloudUploadIcon,
    },
    {
      name: 'Accessibility',
      description: 'Never lose your keys again',
      icon: RefreshIcon,
    }
  ]

  const footers = {
    social: [
      {
        name: 'Discord',
        href: 'https://arowana.me/authInvite',
        icon: (props) => (
          <img src="./logo/discord.svg" className='h-10' alt=''></img>
        ),
      },
    ],
  }

  return (
    <main className={started ? 'hidden' : 'block'}>
      <Nav defaultAccount={defaultAccount}></Nav>
      <div className="pt-10 bg-gray-900 sm:pt-16 lg:pt-8 lg:pb-14 lg:overflow-hidden">
        <div className="mx-auto max-w-7xl lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 sm:text-center lg:px-0 lg:text-left lg:flex lg:items-center pb-10">
              <div className="lg:py-24">
                <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-white sm:mt-5 sm:text-6xl lg:mt-6 xl:text-6xl">
                  <span className="block">lihi Authenticator</span>
                  <span className="pb-3 block bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-cyan-400 sm:pb-5">
                    2FA on Web3.0
                  </span>
                </h1>
                <p className="text-base text-gray-300 sm:text-xl lg:text-lg xl:text-xl">
                  Thanks to blockchain, now you can keep your 2FA keys<br />safe and accessible FOREVER
                </p>
                <div className="mt-10 sm:mt-12">
                  <form method="get" action="/app">
                    <button type="submit"
                      className="btn-3d">
                      Try it for FREE!
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="mt-12 -mb-16 sm:-mb-48 lg:m-0 lg:relative">
              <div className="mx-auto max-w-md px-4 sm:max-w-2xl sm:px-6 lg:max-w-none lg:px-0">
                {/* Illustration taken from Lucid Illustrations: https://lucid.pixsellz.io/ */}
                <img
                  className="w-full lg:absolute lg:inset-y-0 lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                  src="/images/cloud-illustration-teal-cyan.svg"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section with screenshot */}
      <div className="relative bg-gray-50 pt-16 sm:pt-24 lg:pt-32">
        <div className="mx-auto max-w-md px-4 text-center sm:px-6 sm:max-w-3xl lg:px-8 lg:max-w-7xl">
          <div>
            <h2 className="text-base font-semibold tracking-wider text-cyan-600 uppercase">Problem with traditional authenticator</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              Losing all 2FA keys after switching to a new phone. <br />Every single one needs to be reset.
            </p>
            <p className="mt-5 max-w-prose mx-auto text-xl text-gray-500">
              We encrypt it, put it on blockchain and store it forever. Never lose your 2FA keys again
            </p>
          </div>
          <div className="mt-12 pb-10">
            <div className="grid grid-cols-6 gap-4">
              <div className="col-start-2 col-span-4">
                <img className="rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 w-full"
                  src="./images/screenshot.png"
                  alt=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section with grid */}
      <div className="relative bg-white pt-16 sm:pt-24 lg:pt-32" id="features">
        <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:px-8 lg:max-w-7xl">
          <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Product Benefits
          </p>
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-md shadow-lg">
                          <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.name}</h3>
                      <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='mt-10'>
            <form method="get" action="/app">
              <button type="submit"
                className="btn-3d">
                Try it for FREE!
              </button>
            </form>
          </div>
          <div className="bg-white" id="team">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
              <p className="mt-10 mb-10 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
                Our Team
              </p>
              <div className="grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5 pt-2">
                <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
                  <div className="avatar flex flex-col">
                    <div className="mask mask-hexagon">
                      <img src="./images/team/tony.jpeg" alt=''/>
                    </div>
                    <span className='text-gray-500 text-center pt-3'>Tony</span>
                  </div>
                </div>
                <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
                  <div className="avatar flex flex-col">
                    <div className="mask mask-hexagon">
                      <img src="./images/team/jojo.jpeg" alt=''/>
                    </div>
                    <span className='text-gray-500 text-center pt-3'>Jojo</span>
                  </div>
                </div>
                <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
                  <div className="avatar flex flex-col">
                    <div className="mask mask-hexagon">
                      <img src="./images/team/mos.jpeg" alt=''/>
                    </div>
                    <span className='text-gray-500 text-center pt-3'>Mos</span>
                  </div>
                </div>
                <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
                  <div className="avatar flex flex-col">
                    <div className="mask mask-hexagon">
                      <img src="./images/team/simon.png" alt=''/>
                    </div>
                    <span className='text-gray-500 text-center pt-3'>Simon</span>
                  </div>
                </div>
                <div className="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
                  <div className="avatar flex flex-col">
                    <div className="mask mask-hexagon">
                      <img src="./images/team/falcon.jpeg" alt=''/>
                    </div>
                    <span className='text-gray-500 text-center pt-3'>Falcon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white pt-8" id="panel">
            <div className="max-w-7xl mx-auto pb-6 px-4 overflow-hidden sm:px-6 lg:px-8">
              <div className="flex justify-center space-x-6">
                {footers.social.map((item) => (
                  <a target="_blank" rel="noreferrer" key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </a>
                ))}
              </div>
              <p className="mt-8 text-center text-base text-gray-400">&copy; 2022 lihi, Inc. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
};