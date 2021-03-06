pragma solidity ^0.4.17; // solidity version

contract Lottery {
    address public manager;
    address[] public players;
    
    constructor() public {
        manager = msg.sender;
    }
    
    function enter() public payable {
        require(msg.value > 0.01 ether); // minimum input ether to enter lottery
        players.push(msg.sender);
    }
    
    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, now, players)));
    }
    
    function pickWinner() public restricted {
        uint index = random() % players.length;
        players[index].transfer(address(this).balance);
        players = new address[](0);
    }
    
    modifier restricted() {
        require(msg.sender == manager);
        _; // underscore is marker where the code will be placed
    }
    
    function getPlayers() public view returns (address[]) { // no change of data
        return players;
    }

    function getContractBalance() public view restricted returns (uint) {
        return address(this).balance;
    }
}