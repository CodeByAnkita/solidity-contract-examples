//scripts/deploy.js
const hre = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with acconut:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    const MacVenturesToken = await hre.ethers.getContractFactory("MacVenturesToken");
    const token = await MacVenturesToken.deploy(50000000000);

    await token.deployed();

    console.log("Token address: ", token.address);

    await hre.run("verify:verify", {
        address: token.address,
        constructorArguments: [50000000000]
    });

}
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// const hre = require("hardhat");

// async function main() {
//     const [deployer] = await ethers.getSigners();

//     console.log("Deploying contract with account:", deployer.address);
//     console.log("Account balance:", (await deployer.getBalance()).toString());

//     const MacVenturesToken = await hre.ethers.getContractFactory("MacVenturesToken");
//     const token = await MacVenturesToken.deploy(58000000000);

//     await token.deployed();

//     console.log("Token address: ", token.address);

//     // Update the verification task call
//     await hre.run("verify:verify", {
//         address: token.address,
//         abi: token.interface.format(),
//         contract: "MacVenturesToken",
//         constructorCalldata: ["58000000000"]
//     });
// }

// main().catch((error) => {
//     console.error(error);
//     process.exitCode = 1;
// });
