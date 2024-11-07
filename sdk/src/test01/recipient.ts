// cast send 0x067A44Af3D39893Bd783518F6b687d89aed8f9b7 "dispatch(uint32,bytes32,bytes)" 7865 0x3039F278A920EA4f48F23929F366c9ff13A929F7 0x68656c6c6f

// const option = {
//   chain: 11820, // mainnet
//   //gas: "500",
//   // gasPrice: "500",
//   // from: signer.address,
//   data: bytecode,
//   // common: {
//   //   customChain: {
//   //     name: "lazy",
//   //     chainId: 11820,
//   //     networkId: 2018,
//   //   },
//   //   baseChain: "dev",
//   // },
// };
// var contract = new Contract(abi, option);
// // TODO use provider instead of url
// contract.setProvider(endpoint);

// const gas = await contract.deploy().estimateGas({ gas: "5000000" });

// logger.info(`Estimated Gas [${gas}]`);

// const deployTx = contract.deploy();

// const deployedContract = await deployTx
//   .send({
//     from: signer.address,
//     gas: (gas + BigInt(10000000000)).toString(),
//     gasPrice: "500",
//   })
//   .once("transactionHash", (txhash) => {
//     console.log(`Mining deployment transaction ...`);
//     console.log(`TX[${txhash}]`);
//   })
//   .then(function (newContractInstance) {
//     console.log(newContractInstance.options.address); // instance with the new contract address
//     return newContractInstance;
//   });
// // The contract is now deployed on chain!
// console.log(`Contract deployed at ${deployedContract.options.address}`);
