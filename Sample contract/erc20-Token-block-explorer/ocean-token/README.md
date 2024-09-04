# ERC20 Token Tutorial

This is the source code for the Block Explorer YouTube video:
https://www.youtube.com/watch?v=gc7e90MHvl8


token -design

initial supply (send to owner)70,000,000
max supply (capped)-100,000,000
30% for rewards
make token burnable

create block reward to distribute new supply to miners
-block reward
-_beforeTokenTransfer
-_mintMineReward

changes in hardhat.config

- npx hardhat compie
- add test folder and .js file 
- npx hardhat test
- npm i dotenv  and add in hardhat.config.js, add network also 

- npx hardhat run --network sepolia scripts/deploy.js


