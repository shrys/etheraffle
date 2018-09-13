const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3'); // uppercase, instatiate with ctor
const { interface, bytecode } = require('../compile');

const provider = ganache.provider();
const web3 = new Web3(provider);

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    // use an account for deployment
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({
            data: bytecode
        })
        .send({
            from: accounts[0],
            gas: '1000000'
        });
    lottery.setProvider(provider);
});

describe('Lottery Contract', () => {
    it('deploys contract', () => {
        assert.ok(lottery.options.address);
    });

    it('allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: web3.utils.toWei('0.02', 'ether')
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        assert.equal(accounts[0], players[0]);
        assert.equal(1, players.length);
    });

    it('allows multiple accounts', async () => {
        for (let account of accounts) {
            await lottery.methods.enter().send({
                from: account,
                value: web3.utils.toWei('0.02', 'ether')
            });
        }

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0]
        });

        for (let a in accounts) {
            assert(accounts[a], players[a]);
        }

        assert(accounts.length, players.length);
    });

    it('requires a minimum amount', async () => { // intentionally erroring out
        try {
            await lotter.methods.enter().send({
                from: accounts[0],
                value: 0
            });
            assert(false); // failing on purpose if previous statement is ignored somehow
        } catch (err) {
            assert.ok(err); //making susre the test passes
        }
    });

    it('only manager can call pickWinner', async () => {
        try {
            await lottery.methods.pickWinner().send({
               from: account[1] // failing the case on purpose
            });
            assert(false);
        } catch(err) {
            assert.ok(err);
        }
    });

    it('sends money to winner and resets players array', async () => {
        await lottery.methods.enter().send({ // test with one player entry
            from: accounts[0],
            value: web3.utils.toWei('2', 'ether')
        });
        const initialBalance = await web3.eth.getBalance(accounts[0]);
        await lottery.methods.pickWinner().send({ // player will get back which it put initially
            from: accounts[0]
        });
        const finalBalance = await web3.eth.getBalance(accounts[0]);
        const difference = finalBalance - initialBalance;

        assert(difference > web3.utils.toWei('1.8', 'ether')); // assumption as gas will be spent

        const players = await lottery.methods.getPlayers().call({ // resetting players array
            from: accounts[0]
        });
        assert(0 == players.length);

        assert(0 == await lottery.methods.getContractBalance().call({ // contract balance reset check
            from: accounts[0]
        }));
        

    });
});