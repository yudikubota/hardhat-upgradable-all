import hre from "hardhat";
import { AnyflowHelloWorld_V1__factory, AnyflowHelloWorld_V2__factory } from "../typechain-types";

async function deployUUPSProxy(
    factory_V1: AnyflowHelloWorld_V1__factory,
    factory_V2: AnyflowHelloWorld_V2__factory,
    args: unknown[],
    initialOwner: string
) {
    console.log('\n=== Starting UUPS Proxy Deployment ===');

    console.log('Deploying UUPS upgradable proxy V1...');
    const uupsProxy_V1 = await hre.upgrades.deployProxy(factory_V1, args, {
        kind: 'uups',
    });

    await uupsProxy_V1.waitForDeployment()

    console.log("UUPS upgradable proxy deployed to:", await uupsProxy_V1.getAddress());

    console.log('Upgrading UUPS upgradable proxy V1 to V2...');
    const uupsProxy_V2 = await hre.upgrades.upgradeProxy(uupsProxy_V1, factory_V2, {
        kind: 'uups',
    });

    await uupsProxy_V2.waitForDeployment()

    // TODO: get implementation addresses

    console.log('=== UUPS Proxy Deployment Completed ===\n');
}

async function deployTransparentProxy(
    factory_V1: any,
    factory_V2: any,
    args: unknown[],
    initialOwner: string
) {
    console.log('\n=== Starting Transparent Proxy Deployment ===');

    console.log('Deploying Transparent upgradable proxy V1...');
    const transparentProxy_V1 = await hre.upgrades.deployProxy(factory_V1, args, {
        kind: 'transparent',
        initialOwner,
    });

    await transparentProxy_V1.waitForDeployment()

    console.log("Transparent upgradable proxy V1 deployed to:", await transparentProxy_V1.getAddress());

    console.log('Upgrading Transparent proxy V1 to V2...');
    const transparentProxy_V2 = await hre.upgrades.upgradeProxy(transparentProxy_V1, factory_V2, {
        kind: 'transparent',
    });

    await transparentProxy_V2.waitForDeployment()

    console.log('=== Transparent Proxy Deployment Completed ===\n');
}

async function deployMinimalProxy(
    factory_V1: any,
    initialOwner: string,
    helloMessage: string
) {
    console.log('\n=== Starting Minimal Proxy Deployment ===');

    console.log('Deploying implementation V1...');
    const implementation_V1 = await factory_V1.deploy();
    await implementation_V1.waitForDeployment()
    console.log("AnyflowHelloWorld_V1 deployed to:", await implementation_V1.getAddress());

    console.log('Deploying Minimal Factory...');
    const MinimalFactory = await hre.ethers.getContractFactory("AnyflowFactory");
    const minimalFactory = await MinimalFactory.deploy(implementation_V1.getAddress());
    await minimalFactory.waitForDeployment()
    console.log("AnyflowFactory deployed to:", await minimalFactory.getAddress());

    console.log('Creating Minimal Proxy clone...');
    const minimalProxyTx = await minimalFactory.createClone(initialOwner, helloMessage);
    const receipt = await minimalProxyTx.wait();
    if (!receipt) {
        throw new Error('Failed to get transaction receipt');
    }
    console.log("Minimal proxy transaction completed:", receipt.hash);
    const event = receipt!.logs.find(a => a?.fragment?.name === 'CloneCreated')
    const cloneAddress = event?.args[0]
    console.log("Minimal proxy deployed to:", cloneAddress);

    console.log('=== Minimal Proxy Deployment Completed ===\n');
}

async function deployBeaconProxy(
    factory_V1: any,
    factory_V2: any,
    args: unknown[],
    initialOwner: string
) {
    console.log('\n=== Starting Beacon Proxy Deployment ===');

    console.log('Deploying Beacon...');
    const beacon = await hre.upgrades.deployBeacon(factory_V1, {
        initialOwner,
    });
    await beacon.waitForDeployment();
    console.log("Beacon deployed to:", await beacon.getAddress());

    console.log('Deploying Beacon Proxy...');
    const beaconProxy_V1 = await hre.upgrades.deployBeaconProxy(beacon, factory_V1, [...args]);
    await beaconProxy_V1.waitForDeployment();
    console.log("Beacon Proxy V1 deployed to:", await beaconProxy_V1.getAddress());

    console.log('Upgrading Beacon to V2...');
    const beaconProxy_V2 = await hre.upgrades.upgradeBeacon(beacon, factory_V2);
    await beaconProxy_V2.waitForDeployment();
    console.log("Beacon proxy V2 deployed to:", await beaconProxy_V2.getAddress());

    console.log('=== Beacon Proxy Deployment Completed ===\n');
}

export async function main() {
    console.log('=== Starting Deployment Process ===\n');

    const initialOwner = await (await hre.ethers.getSigners())[0].getAddress();
    const helloMessage = "Hello, World!";
    const args = [initialOwner, helloMessage];

    const factory_V1 = await hre.ethers.getContractFactory("AnyflowHelloWorld_V1");
    const factory_V2 = await hre.ethers.getContractFactory("AnyflowHelloWorld_V2");

    await deployUUPSProxy(factory_V1, factory_V2, args, initialOwner);
    await deployTransparentProxy(factory_V1, factory_V2, args, initialOwner);
    await deployMinimalProxy(factory_V1, initialOwner, helloMessage);
    await deployBeaconProxy(factory_V1, factory_V2, args, initialOwner);

    console.log('=== All Deployments Completed Successfully ===');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });