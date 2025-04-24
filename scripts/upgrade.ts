import hre from "hardhat";
import * as dotenv from "dotenv";
import { Contract } from "ethers";
import ProxyAdminABI from "../abis/ProxyAdmin.abi.json";
import UpgradeableBeaconABI from "../abis/UpgradableBeacon.abi.json";
// Load environment variables
dotenv.config();

// Type definitions for proxy addresses
interface ProxyAddresses {
    uups?: string;
    transparent?: string;
    beacon?: string;
    minimalProxy?: string;
}

async function getContractOwner(proxyAddress: string, proxyType: string): Promise<string> {
    try {
        console.log(`Fetching owner for ${proxyType} at ${proxyAddress}...`);

        if (proxyType === 'uups' || proxyType === 'minimal') {
            // For UUPS and minimal proxies, the owner is stored in the implementation contract
            const contract = await hre.ethers.getContractAt("AnyflowHelloWorld_V1", proxyAddress);
            const owner = await contract.owner();
            return owner;
        } else if (proxyType === 'transparent') {
            // For transparent proxies, get the admin from the proxy admin contract
            const adminAddress = await hre.upgrades.erc1967.getAdminAddress(proxyAddress);

            // Call the admin contract to get the owner
            const admin = await hre.ethers.getContractAt(ProxyAdminABI, adminAddress);
            const owner = await admin.owner();

            return `admin contract: ${adminAddress} owner: ${owner}`;
        } else if (proxyType === 'beacon') {
            // For beacon proxies, get the owner of the beacon
            const beaconAddress = proxyAddress;
            const beacon = await hre.ethers.getContractAt(UpgradeableBeaconABI, beaconAddress);
            const owner = await beacon.owner();
            const implementation = await beacon.implementation();
            return `beacon contract: ${beaconAddress} owner: ${owner} implementation: ${implementation}`;
        }

        return "Could not determine owner";
    } catch (error) {
        console.error(`Error fetching owner for ${proxyType}:`, error);
        return "Error fetching owner";
    }
}

async function upgradeUUPSProxy(factory: any, proxyAddress: string): Promise<Contract> {
    console.log('\n=== Starting UUPS Proxy Upgrade ===');

    // Get owner before upgrade
    const owner = await getContractOwner(proxyAddress, 'uups');
    console.log(`UUPS Proxy owner: ${owner}`);

    console.log(`Upgrading UUPS proxy at ${proxyAddress} to V2...`);

    const upgradedContract = await hre.upgrades.upgradeProxy(proxyAddress, factory, {
        kind: 'uups',
    });

    await upgradedContract.waitForDeployment();
    console.log("UUPS proxy upgraded to V2 at:", await upgradedContract.getAddress());
    console.log('=== UUPS Proxy Upgrade Completed ===\n');

    return upgradedContract;
}

async function upgradeTransparentProxy(factory: any, proxyAddress: string): Promise<Contract> {
    console.log('\n=== Starting Transparent Proxy Upgrade ===');

    // Get admin before upgrade
    const admin = await getContractOwner(proxyAddress, 'transparent');
    console.log(`Transparent Proxy admin: ${admin}`);

    console.log(`Upgrading Transparent proxy at ${proxyAddress} to V2...`);

    const upgradedContract = await hre.upgrades.upgradeProxy(proxyAddress, factory, {
        kind: 'transparent',
    });

    await upgradedContract.waitForDeployment();
    console.log("Transparent proxy upgraded to V2 at:", await upgradedContract.getAddress());
    console.log('=== Transparent Proxy Upgrade Completed ===\n');

    return upgradedContract;
}

async function upgradeBeacon(factory: any, beaconAddress: string): Promise<Contract> {
    console.log('\n=== Starting Beacon Upgrade ===');

    // Get owner before upgrade
    const owner = await getContractOwner(beaconAddress, 'beacon');
    console.log(`Beacon owner: ${owner}`);

    console.log(`Upgrading Beacon at ${beaconAddress} to V2...`);

    const upgradedBeacon = await hre.upgrades.upgradeBeacon(beaconAddress, factory);
    await upgradedBeacon.waitForDeployment();

    console.log("Beacon upgraded to V2 at:", await upgradedBeacon.getAddress());
    console.log('=== Beacon Upgrade Completed ===\n');

    return upgradedBeacon;
}

// Minimal proxies cannot be upgraded - this function is for documentation only
async function minimalProxyInfo(minimalProxyAddress: string): Promise<void> {
    console.log('\n=== Minimal Proxy Information ===');

    // Get owner before displaying info
    const owner = await getContractOwner(minimalProxyAddress, 'minimal');
    console.log(`Minimal Proxy owner: ${owner}`);

    console.log(`Minimal proxy at ${minimalProxyAddress} cannot be upgraded.`);
    console.log('To "upgrade" a minimal proxy, you need to deploy a new clone from a new implementation');
    console.log('=== Minimal Proxy Information Completed ===\n');
}

export async function main() {
    console.log('=== Starting Upgrade Process ===\n');

    // Get the first signer's address to use as initialOwner
    const [signer] = await hre.ethers.getSigners();
    const currentSigner = await signer.getAddress();
    // const initialOwner = '0xeAB3b6952F62668108B0F254bbC7400C83A9d62D';

    console.log(`Current signer (used for upgrade transactions): ${currentSigner}`);

    // Load proxy addresses from environment variables
    const proxyAddresses: ProxyAddresses = {
        uups: process.env.UUPS_PROXY_ADDRESS,
        transparent: process.env.TRANSPARENT_PROXY_ADDRESS,
        beacon: process.env.BEACON_ADDRESS,
        minimalProxy: process.env.MINIMAL_PROXY_ADDRESS
    };

    // Create V2 factory
    const factory_V2 = await hre.ethers.getContractFactory("AnyflowHelloWorld_V2");

    // Check and upgrade UUPS proxy if address exists
    if (proxyAddresses.uups) {
        await upgradeUUPSProxy(factory_V2, proxyAddresses.uups);
    } else {
        console.log("Skipping UUPS proxy upgrade: No address provided in UUPS_PROXY_ADDRESS");
    }

    // Check and upgrade Transparent proxy if address exists
    if (proxyAddresses.transparent) {
        await upgradeTransparentProxy(factory_V2, proxyAddresses.transparent);
    } else {
        console.log("Skipping Transparent proxy upgrade: No address provided in TRANSPARENT_PROXY_ADDRESS");
    }

    // Check and upgrade Beacon if address exists
    if (proxyAddresses.beacon) {
        await upgradeBeacon(factory_V2, proxyAddresses.beacon);
    } else {
        console.log("Skipping Beacon upgrade: No address provided in BEACON_ADDRESS");
    }

    // Show information about minimal proxy if address exists
    if (proxyAddresses.minimalProxy) {
        await minimalProxyInfo(proxyAddresses.minimalProxy);
    } else {
        console.log("Skipping Minimal proxy info: No address provided in MINIMAL_PROXY_ADDRESS");
    }

    console.log('=== All Upgrades Completed Successfully ===');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });