// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/WheelSwap.sol";

contract WheelSwapScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        address cbBTCAddress = vm.envAddress("CBBTC_ADDRESS");
        address wETHAddress = vm.envAddress("WETH_ADDRESS");
        address degenAddress = vm.envAddress("DEGEN_ADDRESS");
        address uniswapRouterAddress = vm.envAddress("UNISWAP_ROUTER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        WheelSwap wheelSwap = new WheelSwap(
            usdcAddress,
            cbBTCAddress,
            wETHAddress,
            degenAddress,
            uniswapRouterAddress
        );

        console.log("WheelSwap deployed at:", address(wheelSwap));

        vm.stopBroadcast();
    }
}