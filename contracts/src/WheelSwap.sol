// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3SwapCallback.sol";

contract WheelSwap is Ownable {
    IERC20 public usdcToken;
    IERC20 public cbBTCToken;
    IERC20 public wETHToken;
    IERC20 public degenToken;
    ISwapRouter public uniswapRouter;

    uint256 public constant TICKET_PRICE = 2.5 * 1e6; // 2.5 USDC (assuming 6 decimals)
    uint256 public constant CBBTC_PRIZE = 1 * 1e8; // 1 cbBTC (assuming 8 decimals)
    uint256 public constant WETH_PRIZE = 1 * 1e18; // 1 wETH (18 decimals)
    uint256 public constant DEGEN_PRIZE = 500 * 1e18; // 500 DEGEN (assuming 18 decimals)

    event TicketPurchased(address indexed player);
    event PrizeClaimed(address indexed winner, uint256 tokenType, uint256 amount);

    constructor(
        address _usdcToken,
        address _cbBTCToken,
        address _wETHToken,
        address _degenToken,
        address _uniswapRouter
    ) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        cbBTCToken = IERC20(_cbBTCToken);
        wETHToken = IERC20(_wETHToken);
        degenToken = IERC20(_degenToken);
        uniswapRouter = ISwapRouter(_uniswapRouter);
    }

    function spinWheel() external {
        require(usdcToken.transferFrom(msg.sender, address(this), TICKET_PRICE), "USDC transfer failed");
        emit TicketPurchased(msg.sender);

        uint256 tokenType = uint256(block.timestamp) % 3; // 0: cbBTC, 1: wETH, 2: DEGEN

        // hardcode minimum balances to swap
        if (tokenType == 0 && usdcToken.balanceOf(address(this)) > 6400 * 1e6) { 
            swapAndTransfer(cbBTCToken, CBBTC_PRIZE, msg.sender);
            emit PrizeClaimed(msg.sender, 0, CBBTC_PRIZE);
        } else if (tokenType == 1 && usdcToken.balanceOf(address(this)) > 2600 * 1e6) {
            swapAndTransfer(wETHToken, WETH_PRIZE, msg.sender);
            emit PrizeClaimed(msg.sender, 1, WETH_PRIZE);
        } else if (tokenType == 2 && usdcToken.balanceOf(address(this)) > 0.0046 * 500 * 1e6) {
            swapAndTransfer(degenToken, DEGEN_PRIZE, msg.sender);
            emit PrizeClaimed(msg.sender, 2, DEGEN_PRIZE);
        } else {
            // No prize,
            emit PrizeClaimed(msg.sender, 3, 0);
        }
    }

    function swapAndTransfer(IERC20 token, uint256 amount, address recipient) internal {
        uint256 deadline = block.timestamp + 300; // 5 minutes from now
        uint24 fee = 3000; // 0.3% fee tier

        TransferHelper.safeApprove(address(usdcToken), address(uniswapRouter), TICKET_PRICE);

        ISwapRouter.ExactOutputSingleParams memory params =
            ISwapRouter.ExactOutputSingleParams({
                tokenIn: address(usdcToken),
                tokenOut: address(token),
                fee: fee,
                recipient: recipient,
                deadline: deadline,
                amountOut: amount,
                amountInMaximum: TICKET_PRICE,
                sqrtPriceLimitX96: 0
            });

        uniswapRouter.exactOutputSingle(params);

        // Refund any unused USDC back to the contract
        if (usdcToken.balanceOf(address(this)) > 0) {
            TransferHelper.safeApprove(address(usdcToken), address(uniswapRouter), 0);
        }
    }

    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}