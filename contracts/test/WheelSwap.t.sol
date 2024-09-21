// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/WheelSwap.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    uint8 private _decimals;

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract MockSwapRouter is ISwapRouter {
    function exactInputSingle(ExactInputSingleParams calldata params) external payable override returns (uint256 amountOut) {
        revert("Not implemented");
    }

    function exactInput(ExactInputParams calldata params) external payable override returns (uint256 amountOut) {
        revert("Not implemented");
    }

    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable override returns (uint256 amountIn) {
        // Mock implementation: just transfer the tokens
        IERC20(params.tokenIn).transferFrom(msg.sender, address(this), params.amountInMaximum);
        IERC20(params.tokenOut).transfer(params.recipient, params.amountOut);
        return params.amountInMaximum;
    }

    function exactOutput(ExactOutputParams calldata params) external payable override returns (uint256 amountIn) {
        revert("Not implemented");
    }

    function uniswapV3SwapCallback(int256 amount0Delta, int256 amount1Delta, bytes calldata data) external override {
        // Mock implementation - can be left empty
    }
}

contract WheelSwapTest is Test {
    WheelSwap public wheelSwap;
    MockERC20 public usdcToken;
    MockERC20 public cbBTCToken;
    MockERC20 public wETHToken;
    MockERC20 public degenToken;
    MockSwapRouter public mockRouter;

    address public user = address(0x1);
    uint256 public constant INITIAL_BALANCE = 10000 * 1e6; // 10000 USDC

    function setUp() public {
        usdcToken = new MockERC20("USDC", "USDC", 6);
        cbBTCToken = new MockERC20("cbBTC", "cbBTC", 8);
        wETHToken = new MockERC20("WETH", "WETH", 18);
        degenToken = new MockERC20("DEGEN", "DEGEN", 18);
        mockRouter = new MockSwapRouter();

        wheelSwap = new WheelSwap(
            address(usdcToken),
            address(cbBTCToken),
            address(wETHToken),
            address(degenToken),
            address(mockRouter)
        );

        // Mint initial balances
        usdcToken.mint(user, INITIAL_BALANCE);
        cbBTCToken.mint(address(mockRouter), 100 * 1e8);
        wETHToken.mint(address(mockRouter), 100 * 1e18);
        degenToken.mint(address(mockRouter), 100000 * 1e18);

        // Approve USDC spending
        vm.prank(user);
        usdcToken.approve(address(wheelSwap), type(uint256).max);
    }

    function testConstructor() public {
        assertEq(address(wheelSwap.usdcToken()), address(usdcToken));
        assertEq(address(wheelSwap.cbBTCToken()), address(cbBTCToken));
        assertEq(address(wheelSwap.wETHToken()), address(wETHToken));
        assertEq(address(wheelSwap.degenToken()), address(degenToken));
        assertEq(address(wheelSwap.uniswapRouter()), address(mockRouter));
    }

    function testSpinWheelInsufficientBalance() public {
        vm.prank(user);
        wheelSwap.spinWheel();

        // Check that USDC was transferred from user
        assertEq(usdcToken.balanceOf(user), INITIAL_BALANCE - 2.5 * 1e6);

        // Check that user didn't receive any prize due to insufficient balance
        assertEq(cbBTCToken.balanceOf(user), 0);
        assertEq(wETHToken.balanceOf(user), 0);
        assertEq(degenToken.balanceOf(user), 0);
    }

    function testSpinWheelWithSufficientBalance() public {
        // Add sufficient balance to the contract
        usdcToken.mint(address(wheelSwap), 7000 * 1e6);

        uint256 initialUSDCBalance = usdcToken.balanceOf(user);

        vm.prank(user);
        wheelSwap.spinWheel();

        // Check that USDC was transferred from user
        assertEq(usdcToken.balanceOf(user), initialUSDCBalance - 2.5 * 1e6);

        // Check that user received one of the prizes or no prize
        bool receivedPrize = 
            cbBTCToken.balanceOf(user) == 1 * 1e8 ||
            wETHToken.balanceOf(user) == 1 * 1e18 ||
            degenToken.balanceOf(user) == 500 * 1e18 ||
            (cbBTCToken.balanceOf(user) == 0 && wETHToken.balanceOf(user) == 0 && degenToken.balanceOf(user) == 0);
        
        assertTrue(receivedPrize, "Unexpected prize distribution");
    }

    function testWithdrawTokens() public {
        // Transfer some tokens to the contract
        usdcToken.mint(address(wheelSwap), 1000 * 1e6);

        uint256 initialOwnerBalance = usdcToken.balanceOf(wheelSwap.owner());
        
        vm.prank(wheelSwap.owner());
        wheelSwap.withdrawTokens(address(usdcToken), 500 * 1e6);

        assertEq(usdcToken.balanceOf(wheelSwap.owner()), initialOwnerBalance + 500 * 1e6);
        assertEq(usdcToken.balanceOf(address(wheelSwap)), 500 * 1e6);
    }

    function testFailWithdrawTokensNonOwner() public {
        usdcToken.mint(address(wheelSwap), 1000 * 1e6);

        vm.prank(user);
        wheelSwap.withdrawTokens(address(usdcToken), 500 * 1e6);
    }

    function testMultipleSpins() public {
        // Add sufficient balance to the contract
        usdcToken.mint(address(wheelSwap), 7000 * 1e6);

        uint256 initialUSDCBalance = usdcToken.balanceOf(user);

        for (uint i = 0; i < 5; i++) {
            vm.prank(user);
            wheelSwap.spinWheel();
        }

        assertEq(usdcToken.balanceOf(user), initialUSDCBalance - 5 * 2.5 * 1e6);
    }

    function testEmitTicketPurchasedEvent() public {
        vm.expectEmit(true, false, false, false);
        emit WheelSwap.TicketPurchased(user);
        
        vm.prank(user);
        wheelSwap.spinWheel();
    }

    function testEmitPrizeClaimedEvent() public {
        // Add sufficient balance to the contract
        usdcToken.mint(address(wheelSwap), 7000 * 1e6);

        vm.recordLogs();
        
        vm.prank(user);
        wheelSwap.spinWheel();

        Vm.Log[] memory entries = vm.getRecordedLogs();
        assertGt(entries.length, 1, "Expected at least two events");

        // The second event should be PrizeClaimed
        Vm.Log memory lastEntry = entries[entries.length - 1];
        assertEq(lastEntry.topics[0], keccak256("PrizeClaimed(address,uint256,uint256)"), "Expected PrizeClaimed event");
    }
}