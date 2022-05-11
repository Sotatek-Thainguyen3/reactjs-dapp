import WalletConnect from "@walletconnect/client";

export interface IInternalEvent {
    event: string;
    params: any;
}

export enum ContractNameMap {
    SC_WETH = 'SC_WETH',
    SC_DD2 = 'SC_DD2',
    SC_MASTERCHEF = 'SC_MASTERCHEF',
}

export interface IAppState {
    connector: WalletConnect | null;
    fetching: boolean;
    connected: boolean;
    chainId: number;
    showModal: boolean;
    pendingRequest: boolean;
    uri: string;
    accounts: string[];
    address: string;
    result: any | null;

    balanceOf: string;
    valueDeposit: string;
    valueWithdraw: string;
    errorMessage: string;
    isLoading: string;
}

export const INITIAL_STATE: IAppState = {
    connector: null,
    fetching: false,
    connected: false,
    chainId: 1,
    showModal: false,
    pendingRequest: false,
    uri: "",
    accounts: [],
    address: "",
    result: null,

    balanceOf: "",
    valueDeposit: "",
    valueWithdraw: "",
    errorMessage: "",
    isLoading: "",
};