const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying ServicePayment contract...");
    
    const ServicePayment = await ethers.getContractFactory("ServicePayment");
    const servicePayment = await ServicePayment.deploy();
    
    await servicePayment.waitForDeployment();
    
    console.log("ServicePayment deployed to:", await servicePayment.getAddress());
    console.log("MUSD Token Address:", "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503");
    console.log("Points per purchase:", 10);
    console.log("MUSD cost per purchase:", "3 MUSD");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });