/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState, useRef } from "react";
import styles from "./minigame.module.css";
import dynamic from "next/dynamic";
import { MediaRenderer, useOwnedNFTs } from "@thirdweb-dev/react";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import Skeleton from "../../components/Skeleton/Skeleton";

import {
  useAddress,
  useContract,
  useChainId,
  useNetwork,
} from "@thirdweb-dev/react";
import BigNumber from "bignumber.js";
const CountdownTimer = dynamic(
  () => import("../../components/MiniGame/Timer/CountdownTimer"),
  { ssr: false }
);
import { ConnectWallet } from "@thirdweb-dev/react";
import { MINI_GAME_ADDRESS, NETWORK } from "../../const/contractAddresses";
import minigameABI from "../../const/abi/minigame.json";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHome, faSpinner } from "@fortawesome/free-solid-svg-icons";
import toast, { Toaster } from "react-hot-toast";
import toastStyle from "../../util/toastConfig";
import { ethers } from "ethers";
import { Breadcrumb } from "react-bootstrap";
import Link from "next/link";

const INITIAL_COUNT = 0;
const Index = () => {
  const { contract: miniGameContract } = useContract(
    MINI_GAME_ADDRESS,
    minigameABI
  );
  const address = useAddress();
  const startDate = new Date("Aug 5, 2050 14:43:00");

  const dateTimeAfterThreeDays = startDate;
  const [time, setTime] = useState(0);
  const [{ data, error, loading }, switchNetwork] = useNetwork();
  const chainId = useChainId();
  // read contract
  const [balanceOf, setBalanceOf] = useState(0);
  const [minted, setMinted] = useState(0);
  const [dataNft, setDataNft] = useState<any>([]);
  const [totalMinted, setTotalMinted] = useState(0);
  //get nftType claim
  const [claim, setClaim] = useState([]);
  // loading
  const [loadingMint, setLoadingMint] = useState(false);
  //loading when change network
  const [loadingChange, setLoadingChange] = useState(false);
  //loading when claim ETH
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [idData, setIdData] = useState(-1);
  const [tmp, setTmp] = useState(-1);

  const { data: NFTs } = useOwnedNFTs(miniGameContract, address);

  const prevCountRef = useRef<number>(INITIAL_COUNT);
  // handle status
  const [status, setStatus] = useState({
    statusMessage: "",
    message: "",
  });

  const [openToast, setOpenToast] = useState(false);
  const changeNetwork = async () => {
    try {
      setLoadingChange(true);
      if (!switchNetwork) {
        console.log("can not switch network");
        return;
      }

      const result = await switchNetwork(84531);
      if (result.data) {
        console.log("Switched to Base Goerli testnet successfully");
      } else {
        console.log("Error switching to Base Goerli testnet", result.error);
      }
    } catch (e) {
      console.log("Error switching to Base Goerli testnet", e);
    } finally {
      setLoadingChange(false);
    }
  };

  const checkDate = async () => {
    if (dateTimeAfterThreeDays) {
      if (Date.now().valueOf() - dateTimeAfterThreeDays.valueOf() >= 0) {
        setTime(1);
      } else {
        setTime(0);
      }
    } else {
      setTime(0);
    }
  };
  const useMintNFT = async () => {
    try {
      setLoadingMint(true);
      const data = await miniGameContract?.call("mintNFT", [], {
        gasLimit: 223900,
        value: ethers.utils.parseEther("0.00065"),
      });
      if (data) {
        toast.success("Mint NFT Successfully", {
          icon: "👍",
          style: toastStyle,
          position: "bottom-center",
        });
        GetOwned();
      }
    } catch (error) {
      const err = (error as any).info.reason;
      toast(err, {
        icon: "❌",
        style: toastStyle,
        position: "bottom-center",
      });
    } finally {
      setLoadingMint(false);
    }
  };
  const claimETH = async () => {
    try {
      setLoadingClaim(true);
      const data = await miniGameContract?.call("claimReward", [idData], {
        value: 0,
      });
      if (data) {
        toast.success("Claim NFT Successfully", {
          icon: "👍",
          style: toastStyle,
          position: "bottom-center",
        });
        GetOwned();
        GetClaim(dataNft.id);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingClaim(false);
    }
  };
  const checkBalanceOf = async () => {
    if (address) {
      const data = await miniGameContract?.call("balanceOf", [address]);
      if (data) {
        const index = new BigNumber(data.toString()).toNumber();
        setBalanceOf(index);
      }
    }
  };

  const GetClaim = async (_tok: any) => {
    try {
      if (prevCountRef.current !== idData) {
        setTmp(1);
      }
      if (address) {
        const data = await miniGameContract?.call("nfts", [_tok]);
        if (data) {
          setClaim(data);
        } else {
          setClaim([]);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const GetTotalMinted = async () => {
    const data = await miniGameContract?.call("totalSupply", []);
    if (data) {
      const index = new BigNumber(data.toString()).toNumber();
      setTotalMinted(index);
    } else {
      setTotalMinted(0);
    }
  };

  const sdk = new ThirdwebSDK(NETWORK);

  const GetOwned = async () => {
    try {
      const contract = await sdk.getContract(MINI_GAME_ADDRESS);
      if (address) {
        const ownedTokenIds1 = await contract.erc721.getOwned(address);
        const data1 = ownedTokenIds1[0].metadata.id;
        const index = new BigNumber(data1.toString()).toNumber();
        setIdData(index);
        const data2 = ownedTokenIds1[0].metadata;
        setDataNft(data2);
      } else {
        setIdData(-1);
        setDataNft([]);
      }
    } catch (e) {
      console.log(e);
      setIdData(-1);
      setDataNft([]);
    }
  };

  const checkMinted = async () => {
    try {
      if (address) {
        const data = await miniGameContract?.call("walletMints", [address]);
        const index = new BigNumber(data.toString()).toNumber();
        if (index === 1) {
          setMinted(1);
          setIsLoading(true);
        } else {
          setMinted(0);
          setIsLoading(true);
        }
      } else {
        setMinted(0);
        setIsLoading(false);
      }
    } catch (e) {
      console.log(e);
    }
  };

  GetTotalMinted();
  checkBalanceOf();
  useEffect(() => {
    setDataNft(null);
    setTmp(-1);
    checkDate();
    GetOwned();
    GetClaim(idData);
    if (address !== null) {
      checkMinted();
      GetClaim(idData);
      checkBalanceOf();
      if (status.message !== "") {
        setOpenToast(true);
      }
      GetTotalMinted();
    }
    GetTotalMinted();
    prevCountRef.current = idData;
    if (idData) {
      GetClaim(idData);
    }
  }, [address, idData, minted, status.message, totalMinted, balanceOf, time]);
  return (
    <>
      <Toaster position="bottom-center" reverseOrder={false} />
      <Breadcrumb className={styles.containerMini}>
        <Breadcrumb.Item active className={styles.containerMiniItem}>
          <Link href="/">
            <FontAwesomeIcon icon={faHome} /> Home
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item active>Mini Game</Breadcrumb.Item>
      </Breadcrumb>

      {balanceOf > 0 && minted === 1 && chainId === 84531 ? (
        <div className={styles.minigameContainer}>
          <div className={styles.leftSide}>
            {!dataNft || !isLoading || tmp === -1 ? (
              [...Array(1)].map((_, index) => (
                <div key={index} className={styles.nftContainer}>
                  <Skeleton key={index} width={"100%"} height="412px" />
                </div>
              ))
            ) : (
              <div className={styles.nftContainer}>
                <MediaRenderer
                  style={{
                    width: "360px",
                    height: "360px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.04)",
                    objectFit: "cover",
                  }}
                  src={dataNft.image}
                  alt=""
                />
                <p className={styles.nftName}>{dataNft.name}</p>
                {claim[0] > 0 && !claim[1] ? (
                  chainId === 84531 ? (
                    <button
                      disabled={loadingClaim}
                      style={{
                        cursor: (loadingClaim && "not-allowed") || "",
                        width: "120px",
                      }}
                      onClick={() => claimETH()}
                    >
                      Claim{" "}
                      {loadingClaim ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          style={{ color: "#d0d8e7", marginLeft: "10px" }}
                        />
                      ) : (
                        ``
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => changeNetwork()}
                      disabled={loadingChange}
                      style={{ cursor: (loadingChange && "not-allowed") || "" }}
                    >
                      Switch Network{""}
                      {loadingClaim ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          style={{ color: "#d0d8e7", marginLeft: "10px" }}
                        />
                      ) : (
                        ``
                      )}
                    </button>
                  )
                ) : claim[0] === 0 ? (
                  ""
                ) : (
                  <div style={{ width: "200px" }}>
                    <button
                      disabled={true}
                      style={{
                        cursor: "not-allowed",
                        fontSize: "15px",
                        backgroundColor: "#e6e8ec",
                        borderColor: "#e6e8ec",
                        boxShadow: "none",
                        color: "#777e91",
                      }}
                    >
                      You claimed reward!
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.rightSide}>
            <div className={styles.content}>
              {/* <div id="social_icons">
                <img
                  src="/images/base-groerli.png"
                  alt=""
                  className={styles.icon}
                />
              </div> */}
              <h1>Lucky Octopus</h1>
              <div
                style={{
                  marginBottom: "15px",
                  display: "inline",
                  float: "right",
                  marginTop: "15px",
                  fontSize: "18px",
                }}
              >
                When you mint an NFT, you will receive a Silver NFT or a Gold
                NFT. If you get a silver NFT you will be able to win{" "}
                <b>0.002 ETH</b>, if you get a gold NFT you will be able to win{" "}
                <b>0.003 ETH</b> and you can claim immediately to your wallet.
              </div>
              <CountdownTimer targetDate={dateTimeAfterThreeDays} />
              <div
                style={{
                  fontSize: "22px",
                  margin: "0px",
                  fontWeight: "bold",
                  marginTop: "20px",
                }}
              >
                Total minted: {totalMinted}
              </div>
              <button
                disabled={true}
                style={{
                  cursor: "not-allowed",
                  fontSize: "20px",
                  backgroundColor: "#e6e8ec",
                  borderColor: "#e6e8ec",
                  boxShadow: "none",
                  color: "#777e91",
                }}
              >
                Minted
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.minigameContainer}>
          <div className={styles.leftSide}>
            {!isLoading && address && idData !== -1 ? (
              [...Array(1)].map((_, index) => (
                <div key={index} className={styles.nftContainer}>
                  <Skeleton key={index} width={"100%"} height="522px" />
                </div>
              ))
            ) : (
              <div
                className={styles.nftContainer}
                style={{ marginTop: "50px" }}
              >
                <img
                  className={styles.nftImage}
                  src="/images/cardSecret.jpg"
                  alt=""
                />
              </div>
            )}
          </div>
          <div className={styles.rightSide}>
            <div className={styles.content}>
              <div id="social_icons">
                <img
                  src="/images/base-groerli.png"
                  alt=""
                  className={styles.icon}
                />
              </div>
              <h1>Lucky Octopus</h1>
              <div
                className={styles.contenta}
                style={{
                  marginBottom: "15px",
                  display: "inline",
                  float: "right",
                  marginTop: "15px",
                  fontSize: "18px",
                }}
              >
                When you mint an NFT, you will receive a Silver NFT or a Gold
                NFT. If you get a silver NFT you will be able to win{" "}
                <b>0.002 ETH</b>, if you get a gold NFT you will be able to win{" "}
                <b>0.003 ETH</b> and you can claim immediately to your wallet.
              </div>
              <CountdownTimer targetDate={dateTimeAfterThreeDays} />

              <p
                style={{
                  fontSize: "22px",
                  margin: "0px",
                  fontWeight: "bold",
                  marginTop: "20px",
                }}
              >
                Total minted: {totalMinted}
              </p>
              <p
                className={styles.contenta}
                style={{ fontSize: "15px", marginTop: "5px" }}
              >
                Prepare 0.00065 ETH to mint
              </p>
              {chainId === 84531 ? (
                minted === 0 ? (
                  time === 0 ? (
                    <button
                      onClick={() => useMintNFT()}
                      disabled={loadingMint}
                      style={{ cursor: (loadingMint && "not-allowed") || "" }}
                    >
                      Mint NFT{" "}
                      {loadingMint ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          style={{ color: "#d0d8e7", marginLeft: "10px" }}
                        />
                      ) : (
                        ``
                      )}
                    </button>
                  ) : (
                    ""
                  )
                ) : (
                  <button
                    disabled={true}
                    style={{
                      cursor: "not-allowed",
                      fontSize: "20px",
                      backgroundColor: "#e6e8ec",
                      borderColor: "#e6e8ec",
                      boxShadow: "none",
                      color: "#777e91",
                    }}
                  >
                    Minted
                  </button>
                )
              ) : address ? (
                <button
                  onClick={() => changeNetwork()}
                  disabled={loadingChange}
                  style={{ cursor: (loadingChange && "not-allowed") || "" }}
                >
                  Switch Network{""}
                  {loadingChange ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      style={{ color: "#d0d8e7", marginLeft: "10px" }}
                    />
                  ) : (
                    ``
                  )}
                </button>
              ) : (
                <ConnectWallet theme="dark" btnTitle="Connect Wallet" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
