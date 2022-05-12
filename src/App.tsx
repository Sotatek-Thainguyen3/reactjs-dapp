import React, {useEffect, useState} from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';

import './App.scss';
import {BigNumber, ethers} from "ethers";
import ERC20_ABI from './instance/ERC20_ABI.json'
import ERC20_ABI_MSC from './instance/ERC20_ABI_MSC.json'
import ERC20_ABI_DD2 from './instance/ERC20_ABI_DD2.json'
import {Multicall} from "ethereum-multicall"
import WalletConnectProvider from '@walletconnect/web3-provider';
import {ContractNameMap} from "./model/app.state";

declare global {
    interface Window {
        ethereum?: any
    }
}

function App() {
    const ethereum = window.ethereum;

    const [defaultAccount, setDefaultAccount] = useState<string>('');
    const [balance, setBalance] = useState<string>('');
    const [web3Provider, setWeb3Provider] = useState<any>(null);
    const [scWeth, setContractWeth] = useState<any>(null);
    const [scMasterchef, setContractMasterchef] = useState<any>(null);
    const [scDd2, setContractDd2] = useState<any>(null);

    const [valueDeposit, setValueDeposit] = useState<any>('');
    const [valueWithdraw, setValueWithdraw] = useState<any>('');
    const [errorMessage, setErrorMessage] = useState<any>('');
    const [isLoading, setStateLoading] = useState<boolean>(false);
    const [openLoading, setOpenLoading] = useState<boolean>(false);
    const [openDeposit, setStateDeposit] = useState<boolean>(false);
    const [openWithdraw, setStateWithdraw] = useState<boolean>(false);

    const [totalStake, setTotalStake] = useState<any>('');
    const [tokenEarned, setTokenEarned] = useState<any>('');
    const [yourStakeBal, setYourStakeBal] = useState<any>('');
    const [stateApprove, setStateApprove] = useState<boolean>(false);

    const SC_WETH = '0xc778417E063141139Fce010982780140Aa0cD5Ab';
    const SC_MASTERCHEF = '0x9da687e88b0A807e57f1913bCD31D56c49C872c2';
    const SC_DD2 = '0xb1745657CB84c370DD0Db200a626d06b28cc5872';

    /**
     * Connect with connect đã inject browser (vì js của metamask đã được inject vào trong windown)
     * @returns {Promise<void>}
     */
    const connectWalletInjectd = async () => {
        if (ethereum) {
            const provider = updateEthers(ethereum);
            // debugger
            await provider.send('eth_requestAccounts', []).then(accounts => {
                if (accounts.length > 0) {
                    accountChangedHandler(accounts[0]);
                    saveProviderStore('injected');
                }
            }).catch(error => showErrorMessage(error.message));
        } else {
            showErrorMessage('No provider exists')
        }
    }

    /**
     * Connect wallet for mobile
     * @returns {Promise<void>}
     */
    const connectWalletConnectedConnector = async () => {
        //  Create WalletConnect Provider
        const provider = new WalletConnectProvider({
            infuraId: "5194fde9bf364940a1bbaffd59534e78",
        });
        await provider.enable();
        updateEthers(provider);
        if (provider.connected) {
            saveProviderStore('walletconnect');
            accountChangedHandler(provider.accounts[0]);
        }
    }

    const chainChangedHandler = () => {
        // reload the page to avoid any errors with chain change mid use of application
        window.location.reload();
    }
    const accountChangedHandler = (newAccount: any) => {
        setDefaultAccount(newAccount);
    }


    // listen for account changes
    ethereum?.on('accountsChanged', accountChangedHandler);
    ethereum?.on('chainChanged', chainChangedHandler);

    /**
     * When disconnect, this function to be trigger
     */
    web3Provider?.provider?.on("accountsChanged", (accounts: string[]) => {
        console.log('account changed');
        disconnect();
    });
    // Subscribe to chainId change
    web3Provider?.provider?.on("chainChanged", (chainId: number) => {
        console.log('chainChanged');
        disconnect();
    });
    // Subscribe to session disconnection
    web3Provider?.provider?.on("disconnect", (code: number, reason: string) => {
        console.log('disconnect');
        disconnect();
    });

    /**
     * This function only clear data in browser, however it connects with wallet
     */
    const disconnect = async () => {
        window.localStorage.clear();
        setDefaultAccount('');

        setTotalStake('');
        setTokenEarned('');
        setYourStakeBal('')
        setStateApprove(false);
        resetForm();
    }

    const saveProviderStore = (type: string) => {
        window.localStorage.setItem("provider", type);
    }

    useEffect(() => {
        handleConnectWhenInit();
        getInfoStaticInjected();
    }, [defaultAccount]);

    const handleConnectWhenInit = async () => {
        //check login, injected or walletconnect
        const provider = window.localStorage.getItem('provider');
        if (provider === 'walletconnect') {
            connectWalletConnectedConnector();
        }
        if (provider === 'injected') {
            connectWalletInjectd();
        }
    }

    const getInfoStaticInjected = async () => {
        if (defaultAccount && ethers.utils.isAddress(defaultAccount)) {
            await getBalance();
            await fetchDataAll();
        }
    }

//     // Subscribe to accounts change
//     connector?.on("accountsChanged", (accounts: string) => {
//         console.log(accounts);
//         onConnect(accounts);
//     });
//
// // Subscribe to chainId change
//     connector?.on("chainChanged", (chainId: number) => {
//         console.log(chainId);
//     });
//
// // Subscribe to session disconnection
//     connector?.on("disconnect", (code: number, reason: string) => {
//         console.log(code, reason);
//         disconnect();
//     });

    const updateEthers = (provider: any) => {
        let tempProvider = new ethers.providers.Web3Provider(provider);
        setWeb3Provider(tempProvider);
        let tempSigner = tempProvider.getSigner();
        let tempContractWeth = new ethers.Contract(SC_WETH, ERC20_ABI, tempSigner);
        let tempContractMasterchef = new ethers.Contract(SC_MASTERCHEF, ERC20_ABI_MSC, tempSigner);
        let tempContractDd2 = new ethers.Contract(SC_DD2, ERC20_ABI_DD2, tempSigner);
        setContractWeth(tempContractWeth);
        setContractMasterchef(tempContractMasterchef);
        setContractDd2(tempContractDd2);

        return tempProvider;
    }

    const getBalance = async () => {
        await web3Provider.getBalance(defaultAccount).then((result: any) => {
            setBalance(Number(ethers.utils.formatEther(result)).toFixed(3));
        })
    }

    const resetForm = () => {
        setValueDeposit('');
        setValueWithdraw('');
        setStateDeposit(false);
        setStateWithdraw(false);
    }

    const fetchDataAll = async () => {
        setOpenLoading(true);
        const etherMultiCall = new Multicall({ethersProvider: web3Provider, tryAggregate: true});
        const contractCallContext = [
            {
                reference: ContractNameMap.SC_WETH,
                contractAddress: SC_WETH,
                abi: ERC20_ABI,
                calls: [
                    {
                        reference: 'balance',
                        methodName: 'balanceOf',
                        methodParameters: [SC_MASTERCHEF]
                    },
                    {
                        reference: 'balApproved',
                        methodName: 'allowance',
                        methodParameters: [defaultAccount, SC_MASTERCHEF]
                    },
                ]
            },
            {
                reference: ContractNameMap.SC_MASTERCHEF,
                contractAddress: SC_MASTERCHEF,
                abi: ERC20_ABI_MSC,
                calls: [
                    {
                        reference: 'tokenEarned',
                        methodName: 'pendingDD2',
                        methodParameters: [defaultAccount]
                    },
                    {
                        reference: 'balance',
                        methodName: 'userInfo',
                        methodParameters: [defaultAccount]
                    }
                ]
            }
        ];
        const resultObj: any = {};
        await etherMultiCall.call(contractCallContext).then((result) => {
            for (const [key, obj] of Object.entries(result.results)) {
                const arrObj: any[] = obj.callsReturnContext;
                let objItem = {};
                arrObj.forEach(item => {
                    Object.assign(objItem, {[item.reference]: item.returnValues[0].hex || 0})
                })
                resultObj[key] = objItem;
            }

        }).finally(() => {
            console.log(resultObj);
            setStateApprove(stateBalApproved(ethers.utils.formatEther(resultObj[ContractNameMap.SC_WETH].balApproved)));
            setTotalStake(ethers.utils.formatEther(resultObj[ContractNameMap.SC_WETH].balance));
            setYourStakeBal(ethers.utils.formatEther(resultObj[ContractNameMap.SC_MASTERCHEF].balance));
            setTokenEarned(ethers.utils.formatEther(resultObj[ContractNameMap.SC_MASTERCHEF].tokenEarned));
            setOpenLoading(false);
        });

    }

    const stateBalApproved = (balance: string): boolean => {
        if (balance && !Number.isNaN(balance)) {
            return Number(balance) > 0;
        }
        return false;

    }

    const approveWethToMaster = async () => {
        if (balance) {
            setOpenLoading(true);
            const valueConvert = ethers.utils.parseEther(balance);
            await scWeth.approve(SC_MASTERCHEF, valueConvert).then(async (txn: any) => {
                await txn?.wait();
                setStateApprove(true);
            }).catch((e: any) => {
                showErrorMessage(e.message);
            });
            setOpenLoading(false);
        }
    }

    const depositToMasterchef = async () => {
        if (valueDeposit) {
            setStateLoading(true);
            const valueConvert = ethers.utils.parseEther(valueDeposit);
            const txn = await handleDeposit(valueConvert);
            if (txn) {
                await txn?.wait();
                getInfoStaticInjected();
            }
            resetForm();
            setStateLoading(false);
        }
    }

    const handleDeposit = async (value: BigNumber) => {
        return await scMasterchef.deposit(value).catch((e: any) => {
            showErrorMessage(e.message);
            setStateDeposit(false);
        });
    }

    const handleWithdraw = async (value: BigNumber) => {
        return await scMasterchef.withdraw(value).catch((e: any) => {
            showErrorMessage(e.message);
            setStateWithdraw(false);
        });
    }

    const showErrorMessage = (message: string) => {
        setErrorMessage(message);
        setTimeout(() => {
            setErrorMessage('');
        }, 5000);
    }

    const withdrawMasterchef = async () => {
        setStateLoading(true);
        const valueChange = ethers.utils.parseEther(valueWithdraw);
        const txn = await handleWithdraw(valueChange);
        if (txn) {
            await txn?.wait();
            getInfoStaticInjected();
        }
        resetForm();
        setStateLoading(false);
    }

    const onHarvest = async () => {
        setOpenLoading(true);
        console.log(BigNumber.from("0"))
        const txn = await handleWithdraw(BigNumber.from("0"));
        if (txn) {
            await txn?.wait();
            getInfoStaticInjected();
            resetForm();
        }
        setOpenLoading(false);
    }


    const style = {
        position: 'absolute' as 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
        borderRadius: '1rem'
    };

    return (
        <div className="App">
            <div className="app-container">
                <h1>React Web3</h1>
                {defaultAccount ?
                    <>
                        <div className="info-account">
                            <div className="wallet-info">
                                <Tooltip title={defaultAccount} placement="top" arrow>
                                    <h3 style={{marginBottom: 0}} className="wallet-info__account">My
                                        wallet: {defaultAccount}</h3>
                                </Tooltip>
                                <h3>Balance: {balance ? `${balance} ETH` : ''}</h3>
                            </div>

                            <div className="harvest-info">
                                <h3>Token earned: {tokenEarned ? `${tokenEarned} DD2` : ''}</h3>
                                <Button variant="contained" onClick={onHarvest}>Harvest</Button>
                            </div>
                            <div className="form-approve">
                                {stateApprove ?
                                    <>
                                        <Button variant="contained" onClick={() => {
                                            setStateDeposit(true)
                                        }}>Deposit</Button>
                                        <Button variant="contained" onClick={() => {
                                            setStateWithdraw(true)
                                        }}>Withdraw</Button>
                                    </> :
                                    <Button variant="contained" onClick={approveWethToMaster}
                                            disabled={isLoading}>Approve</Button>
                                }
                            </div>

                            <h3>Your stake: {yourStakeBal ? `${yourStakeBal} WETH` : ''}</h3>
                            <h3>Total stake: {totalStake ? `${totalStake} WETH` : ''}</h3>
                        </div>
                    </>
                    : ''}
                {
                    !defaultAccount ?
                        <>
                            <div className="button-group">
                                <Button variant="contained" onClick={connectWalletInjectd}>Connect metamask</Button>
                                <Button variant="contained" onClick={connectWalletConnectedConnector}>Connect wallet
                                    connect
                                </Button>
                            </div>
                        </> : <>
                            <Button variant="contained" className="disconnect" onClick={disconnect}>Logout /
                                Disconnect</Button>
                        </>
                }
                <small className="show-error-message">{errorMessage}</small>

                <Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    open={openDeposit}
                    onClose={(event: any) => {
                        !isLoading ? setStateDeposit(false) : event.preventDefault()
                    }}
                    BackdropComponent={Backdrop}
                    closeAfterTransition
                    BackdropProps={{
                        timeout: 500,
                    }}>
                    <Box sx={style}>
                        <div className="form-deposit">
                            <input type="number" placeholder="input amount" value={valueDeposit}
                                   disabled={isLoading}
                                   onChange={(event) => setValueDeposit(event.target.value)}/> <br/>
                            <label>Your WETH balance: {balance ? `${balance} WETH` : ''}</label>
                            <Button variant="contained" className="form-button" onClick={depositToMasterchef}
                                    disabled={isLoading}>{isLoading ? 'loading...' : 'Deposit'}</Button>
                        </div>
                    </Box>
                </Modal>

                <Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    open={openWithdraw}
                    onClose={(event: any) => {
                        !isLoading ? setStateWithdraw(false) : event.preventDefault()
                    }}
                    BackdropComponent={Backdrop}
                    closeAfterTransition
                    BackdropProps={{
                        timeout: 500,
                    }}>
                    <Box sx={style}>
                        <div className="form-withdraw">
                            <input type="number" placeholder="input amount" value={valueWithdraw}
                                   disabled={isLoading}
                                   onChange={(event) => setValueWithdraw(event.target.value)}/> <br/>
                            <label style={{textAlign: 'center', lineHeight: 2}}>Your WETH
                                deposited: {yourStakeBal ? `${yourStakeBal} WETH` : ''}</label>
                            <Button variant="contained" className="form-button" onClick={withdrawMasterchef}
                                    disabled={isLoading}>{isLoading ? 'loading...' : 'Withdraw'}</Button>
                        </div>
                    </Box>
                </Modal>
            </div>

            <Backdrop
                sx={{color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1}}
                open={openLoading}>
                <CircularProgress color="inherit"/>
            </Backdrop>
        </div>
    );
}

export default App;
