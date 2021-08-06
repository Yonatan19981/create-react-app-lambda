import React, { Component } from "react";
import getWeb3, { getGanacheWeb3, Web3 } from "../../utils/getWeb3";

import { Loader, Card, Input, Table, Form, Field, Image } from 'rimble-ui';
import { zeppelinSolidityHotLoaderOptions } from '../../webpack';
import { contractAddresses } from '../../Addresses';
import styles from '../../App.module.scss';
import styled from "styled-components";
import { Grid } from '@material-ui/core';

const address= require('../../Addresses');
const theme = {
  orange: {
    default: "#FD6363",
    hover: "#FD5050"
  },
 
};

const Button = styled.button`
  background-color: ${(props) => theme[props.theme].default};
  color: white;
  padding: 5px 15px;
  border-radius: 5px;
  outline: 0;
  text-transform: uppercase;
  margin: 10px 0px;
  cursor: pointer;
  box-shadow: 0px 2px 2px lightgray;
  transition: ease background-color 250ms;
  font-family:'MonoSpec-medium';

  &:hover {
    background-color: ${(props) => theme[props.theme].hover};
  }
  &:disabled {
    cursor: default;
    opacity: 0.7;
  }
`;

Button.defaultProps = {
  theme: "orange"
};

console.log(address[0].address)

export default class MyPhotos extends Component {
    constructor(props) {    
        super(props);

        this.state = {
          /////// Default state
          storageValue: 0,
          web3: null,
          accounts: null,
          currentAccount: null,
          route: window.location.pathname.replace("/", ""),

          /////// NFT
          allPhotos: []
        };

        //this.handlePhotoNFTAddress = this.handlePhotoNFTAddress.bind(this);

        this.putOnSale = this.putOnSale.bind(this);
        this.cancelOnSale = this.cancelOnSale.bind(this);
    }

    ///--------------------------
    /// Handler
    ///-------------------------- 
    // handlePhotoNFTAddress(event) {
    //     this.setState({ valuePhotoNFTAddress: event.target.value });
    // }


    ///---------------------------------------------------------
    /// Functions put a photo NFT on sale or cancel it on sale 
    ///---------------------------------------------------------
    putOnSale = async (e) => {
        const { web3, accounts, photoNFTMarketPlace, photoNFTData, PHOTO_NFT_MARKETPLACE } = this.state;

        console.log('=== value of putOnSale ===', e.target.value);
        console.log('=== PHOTO_NFT_MARKETPLACE ===', PHOTO_NFT_MARKETPLACE);

        const PHOTO_NFT = e.target.value;

        /// Get instance by using created photoNFT address
        let PhotoNFT = {};
        PhotoNFT = require("../../contracts/PhotoNFT.json"); 
        let photoNFT = new web3.eth.Contract(PhotoNFT.abi,PHOTO_NFT);

        /// Check owner of photoId
        const photoId = 1;  /// [Note]: PhotoID is always 1. Because each photoNFT is unique.
        const owner = await photoNFT.methods.ownerOf(photoId).call();
        console.log('=== owner of photoId ===', owner);  /// [Expect]: Owner should be the PhotoNFTMarketplace.sol (This also called as a proxy/escrow contract)
            
        /// Put on sale (by a seller who is also called as owner)
        const txReceipt1 = await photoNFT.methods.approve(PHOTO_NFT_MARKETPLACE, photoId).send({ from: accounts[0] });
        const txReceipt2 = await photoNFTMarketPlace.methods.openTrade(PHOTO_NFT, photoId).send({ from: accounts[0] });
        console.log('=== response of openTrade ===', txReceipt2);
    }

    cancelOnSale = async (e) => {
        const { web3, accounts, photoNFTMarketPlace, photoNFTData, PHOTO_NFT_MARKETPLACE } = this.state;

        console.log('=== value of cancelOnSale ===', e.target.value);

        const PHOTO_NFT = e.target.value;

        /// Get instance by using created photoNFT address
        let PhotoNFT = {};
        PhotoNFT = require("../../contracts/PhotoNFT.json"); 
        let photoNFT = new web3.eth.Contract(PhotoNFT.abi, PHOTO_NFT);

        /// Check owner of photoId
        const photoId = 1;  /// [Note]: PhotoID is always 1. Because each photoNFT is unique.
        const owner = await photoNFT.methods.ownerOf(photoId).call();
        console.log('=== owner of photoId ===', owner);  /// [Expect]: Owner should be the PhotoNFTMarketplace.sol (This also called as a proxy/escrow contract)
            
        /// Cancel on sale
        //const txReceipt1 = await photoNFT.methods.approve(PHOTO_NFT_MARKETPLACE, photoId).send({ from: accounts[0] });
        const txReceipt2 = await photoNFTMarketPlace.methods.cancelTrade(PHOTO_NFT, photoId).send({ from: accounts[0] });
        console.log('=== response of cancelTrade ===', txReceipt2);
    }


    ///------------------------------------- 
    /// NFT（Always load listed NFT data）
    ///-------------------------------------
    getAllPhotos = async () => {
        const { photoNFTData } = this.state

        const allPhotos = await photoNFTData.methods.getAllPhotos().call()
        console.log('=== allPhotos ===', allPhotos)

        this.setState({ allPhotos: allPhotos })
        return allPhotos
    }


    //////////////////////////////////// 
    /// Ganache
    ////////////////////////////////////
    getGanacheAddresses = async () => {
        if (!this.ganacheProvider) {
          this.ganacheProvider = getGanacheWeb3();
        }
        if (this.ganacheProvider) {
          return await this.ganacheProvider.eth.getAccounts();
        }
        return [];
    }

    componentDidMount = async () => {
        const hotLoaderDisabled = zeppelinSolidityHotLoaderOptions.disabled;
     
        let PhotoNFTMarketplace = {};
        let PhotoNFTData = {};
        try {
          PhotoNFTMarketplace = require("../../contracts/PhotoNFTMarketplace.json");
          PhotoNFTData = require("../../contracts/PhotoNFTData.json");
        } catch (e) {
          console.log(e);
        }

        try {
        
            // Get network provider and web3 instance.
            const web3 = await getWeb3();
            let ganacheAccounts = [];

            try {
              ganacheAccounts = await this.getGanacheAddresses();
            } catch (e) {
              console.log('Ganache is not running');
            }

            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();
            const currentAccount = accounts[0];

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const networkType = await web3.eth.net.getNetworkType();
            const isMetaMask = web3.currentProvider.isMetaMask;
            let balance = accounts.length > 0 ? await web3.eth.getBalance(accounts[0]): web3.utils.toWei('0');
            balance = web3.utils.fromWei(balance, 'ether');

            let instancePhotoNFTMarketplace = null;
            let instancePhotoNFTData = null;
            let PHOTO_NFT_MARKETPLACE;
            let deployedNetwork = null;

            // Create instance of contracts
            if (PhotoNFTMarketplace.networks) {
              deployedNetwork = PhotoNFTMarketplace.networks[networkId.toString()];
              if (deployedNetwork) {
                instancePhotoNFTMarketplace = new web3.eth.Contract(
                  PhotoNFTMarketplace.abi,
                  address[1].address,
                );
                PHOTO_NFT_MARKETPLACE = deployedNetwork.address;
                console.log('=== instancePhotoNFTMarketplace ===', instancePhotoNFTMarketplace);
              }
            }

            if (PhotoNFTData.networks) {
              deployedNetwork = PhotoNFTData.networks[networkId.toString()];
              if (deployedNetwork) {
                instancePhotoNFTData = new web3.eth.Contract(
                  PhotoNFTData.abi,
                  address[0].address,
                );
                console.log('=== instancePhotoNFTData ===', instancePhotoNFTData);
              }
            }

            if (instancePhotoNFTMarketplace) {
                // Set web3, accounts, and contract to the state, and then proceed with an
                // example of interacting with the contract's methods.
                this.setState({ 
                    web3, 
                    ganacheAccounts, 
                    accounts, 
                    balance, 
                    networkId, 
                    networkType, 
                    hotLoaderDisabled,
                    isMetaMask, 
                    currentAccount: currentAccount,
                    photoNFTMarketPlace: instancePhotoNFTMarketplace,
                    photoNFTData: instancePhotoNFTData,
                    PHOTO_NFT_MARKETPLACE: PHOTO_NFT_MARKETPLACE }, () => {
                      this.refreshValues(instancePhotoNFTMarketplace);
                      setInterval(() => {
                        this.refreshValues(instancePhotoNFTMarketplace);
                    }, 5000);
                });
            }
            else {
              this.setState({ web3, ganacheAccounts, accounts, balance, networkId, networkType, hotLoaderDisabled, isMetaMask });
            }

            ///@dev - NFT（Always load listed NFT data
            const allPhotos = await this.getAllPhotos();
            this.setState({ allPhotos: allPhotos })
          
        } catch (error) {
          // Catch any errors for any of the above operations.
          alert(
            `Failed to load web3, accounts, or contract. Check console for details.`,
          );
          console.error(error);
        }
    };

    componentWillUnmount() {
        if (this.interval) {
          clearInterval(this.interval);
        }
    }

    refreshValues = (instancePhotoNFTMarketplace) => {
        if (instancePhotoNFTMarketplace) {
          console.log('refreshValues of instancePhotoNFTMarketplace');
        }
    }

    render() {
        const { web3, allPhotos, currentAccount } = this.state;

        return (
            <div className={styles.contracts}>
              <h2>MY COLLECTION</h2>
              <Grid container spacing={4}>

              { allPhotos.map((photo, key) => (
                <Grid item xs={4}>
               

                    { currentAccount == photo.ownerAddress ? 
                            <Card width={"360px"} 
                                    maxWidth={"360px"} 
                                    mx={"auto"} 
                                    my={5} 
                                    p={20} 
                                    borderColor={"#E8E8E8"}
                            >
                              <Image
                                alt="random unsplash image"
                                borderRadius={8}
                                height="100%"
                                maxWidth='100%'
                                src={ `https://ipfs.io/ipfs/${photo.ipfsHashOfPhoto}` }
                              />

                              <span style={{ padding: "20px" }}></span>

                              <p>Photo Name: { photo.photoNFTName }</p>

                              <p>Price: { web3.utils.fromWei(`${photo.photoPrice}`, 'ether') } ETH</p>

                              <p>Owner: { photo.ownerAddress }</p>
                              
                              <br />

                              { photo.status == "Cancelled" ? 
                                  <Button size={'medium'} width={1} value={ photo.photoNFT } onClick={this.putOnSale}> Put on sale </Button>
                              :
                                  <Button size={'medium'} width={1} value={ photo.photoNFT } onClick={this.cancelOnSale}> Cancel on sale </Button>
                              }

                              <span style={{ padding: "5px" }}></span>
                            </Card>
                        :
                            ''
                        }

                        </Grid>
                )
              ) }
              </Grid>
            </div>
        );
    }
}
